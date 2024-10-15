// https://github.com/Blane245/musicgenerator/issues/5#issue-2550789485

import CMG from '../../classes/cmg';
import SFPG from '../../classes/sfpg';
import SFRG from '../../classes/sfrg';
import { CMGeneratorType } from '../../types/types';
import Noise from '../../classes/noise';
import { getBufferSourceNodesFromNoise } from './noisenodes';
import { getBufferSourceNodesFromSFPG } from './sfpgnodes';
import { getBufferSourceNodesFromSFRG } from './sfrgnodes';
import { useCMGContext } from '../../contexts/cmgcontext';
import { useEffect, useRef, useState } from 'react';


const SCHEDULEAHEADTIME: number = 0.1 // how far ahead to schedule audio (seconds)
const LOOKAHEAD: number = 25.0; // how frequently to call the schedule function (ms)
let timerID: number = 0; // the timer used to set the schedule 

// using the defined cm generators for all tracks, create a web audio
// if a generator is provided
const CHUNKTIME: number = 0.1;
export interface GeneratorProps {
    mode: string;
    setMode: Function;
    generator: CMGeneratorType | null;
}
export default function Generate(props: GeneratorProps) {
    const { mode, setMode, generator } = props;
    const { fileContents, setStatus } = useCMGContext();
    const playing = useRef<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    // const [playing, setPlaying] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [recordHandle, setRecordHandle] = useState<FileSystemFileHandle | null>(null);
    const generatorSource: AudioBufferSourceNode[] = [];
    const generatorTime: { start: number, stop: number }[] = [];
    const generatorStarted: boolean[] = [];

    useEffect(() => {
        async function filePicker() {
            try {
                const rh: FileSystemFileHandle[] = await window.showOpenFilePicker();
                setRecordHandle(rh[0]);
                doTheWork();
            } catch (e) {
                // nothing to do here - user aborted recording
            }
        }
        if (mode == 'recordfile') {
            filePicker();
        } else {
            doTheWork();
        }
    }, [mode, generator])

    function handleGeneratorStop() {
        playing.current = false;
        // setPlaying(false);
        setMode('');
    }

    function handleErrorClose() {
        setError('');
        setMode('');
    }

    function doTheWork() {

        // collect all generators on unmuted tracks
        const SFPGenerators: SFPG[] = [];
        const SFRGenerators: SFRG[] = [];
        const NoiseGenerators: Noise[] = [];
        generatorSource.splice(0, generatorSource.length);
        generatorTime.splice(0, generatorTime.length);
        generatorStarted.splice(0, generatorStarted.length);

        let playbackLength = 0;
        if (mode == 'recordfile' || mode == 'previewfile') {
            fileContents.tracks.forEach((t) => {
                t.generators.forEach((g: CMG | SFPG | SFRG | Noise) => {
                    if (g.type == 'SFPG' && !g.mute) {
                        if (!(g as SFPG).preset) {
                            setError(`Generator '${g.name}' on track '${t.name}' does not have a preset assigned.`);
                            return;
                        }
                        else {
                            SFPGenerators.push(g as SFPG);
                            playbackLength = Math.max(playbackLength, g.stopTime);
                        }
                    }
                    if (g.type == 'SFRG' && !g.mute) {
                        if (!(g as SFRG).preset) {
                            setError(`Generator '${g.name}' on track '${t.name}' does not have a preset assigned.`);
                            return;
                        }
                        else {
                            SFRGenerators.push(g as SFRG);
                            playbackLength = Math.max(playbackLength, g.stopTime);
                        }
                    }
                    if (g.type == 'Noise') {
                        NoiseGenerators.push(g as Noise);
                        playbackLength = Math.max(playbackLength, g.stopTime);

                    }
                })
            })
        } else if (generator) {
            if (!generator.mute) {
                if (generator.type == 'SFPG') {
                    const tempGen: SFPG = (generator as SFPG).copy();
                    tempGen.stopTime = tempGen.stopTime - tempGen.startTime;
                    tempGen.startTime = 0;
                    SFPGenerators.push(tempGen);
                    playbackLength = tempGen.stopTime;
                } else if (generator.type == 'SFRG') {
                    const tempGen: SFRG = (generator as SFRG).copy();
                    tempGen.stopTime = tempGen.stopTime - tempGen.startTime;
                    tempGen.startTime = 0;
                    SFRGenerators.push(tempGen);
                    playbackLength = tempGen.stopTime;
                } else if (generator.type == 'Noise') {
                    const tempGen: Noise = (generator as Noise).copy();
                    tempGen.stopTime = tempGen.stopTime - tempGen.startTime;
                    tempGen.startTime = 0;
                    NoiseGenerators.push(tempGen);
                    playbackLength = tempGen.stopTime;
                }
            }
        }
        if (SFPGenerators.length == 0 &&
            SFRGenerators.length == 0 &&
            NoiseGenerators.length == 0
        ) {
            setError('No generators are available to produce any sound');
            return;
        }

        console.log('useful generators', 'SFPG', SFPGenerators.length, 'SFRG', SFRGenerators.length, 'Noise', NoiseGenerators.length);

        // create an audiocontext that has its output as an mpeg file that is stored in the Generate folder.
        // get the length of the file, in seconds. It is the maximum of 
        // all of the generators stop times

        const audioContext: AudioContext = new AudioContext();
        const recordDestination: MediaStreamAudioDestinationNode = audioContext.createMediaStreamDestination();
        const destination: AudioDestinationNode | MediaStreamAudioDestinationNode =
            (generator || mode == 'previewfile' ? audioContext.destination : recordDestination);
        const mediaRecorder: MediaRecorder = new MediaRecorder(recordDestination.stream);
        console.log(`recording set up, recorder in state ${mediaRecorder.state}`)
        const recordChunks: Blob[] = [];
        mediaRecorder.ondataavailable = (evt) => {
            console.log(`new recorded chunk at ${evt.timeStamp}`);
            recordChunks.push(evt.data);
        }

        mediaRecorder.onstop = async () => {
            // capture the recorded data and create an mpeg blob
            console.log('generator stopped recording');
            if (recordChunks.length > 0) {
                const mpeg: Blob = new Blob(recordChunks, { type: "audio/mpeg-3" });

                // write the blob to disk

                // const root = await navigator.storage.getDirectory();
                // const recordHandle = await root.getFileHandle('C:/Users/blane/Documents/development/musicgenerator/generated.mpg', { create: true });
                if (recordHandle) {
                    console.log('recordHandle.name', recordHandle.name)
                    const accessHandle = await recordHandle.createWritable();
                    accessHandle.write(mpeg);
                    accessHandle.close();
                }
            }
        }

        // start recording if not in preview mode
        if (!generator) {
            console.log('recording started');
            mediaRecorder.start();
        }

        // setup the sources for all of the generators
        // build the buffers for the SFPGs
        let nextTime: number = 0.0;
        SFPGenerators.forEach((g) => {
            const { sources, times } =
                getBufferSourceNodesFromSFPG(audioContext, destination, g, CHUNKTIME);
            generatorSource.push(...sources);
            generatorTime.push(...times);
            generatorStarted.push(...Array(times.length).fill(false));
        });

        // build the buffers for the SFRGs
        SFRGenerators.forEach(g => {
            const { sources, times } = getBufferSourceNodesFromSFRG(audioContext, destination, g);
            generatorSource.push(...sources);
            generatorTime.push(...times);
            generatorStarted.push(...Array(times.length).fill(false));
        });

        // build the buffers for the SFRGs
        NoiseGenerators.forEach(g => {
            const { sources, times } = getBufferSourceNodesFromNoise(audioContext, destination, g);
            generatorSource.push(...sources);
            generatorTime.push(...times);
            generatorStarted.push(...Array(times.length).fill(false));
        });


        // setPlaying(true);
        playing.current = true;
        setProgress(0);
        scheduler();
        function scheduler(): void {
            if (playing.current) {
                const aheadTime = audioContext.currentTime + SCHEDULEAHEADTIME;
                // console.log('currentTIME', audioContext.currentTime, 'nextTime', nextTime, 'aheadTime', aheadTime);
                let progressIncrement: number = 0;
                while (nextTime < aheadTime) {
                    generatorSource.forEach((g, i) => {
                        if (aheadTime >= generatorTime[i].start && !generatorStarted[i]) {
                            // console.log('source', i, 'start', generatorTime[i].start, 'stop', generatorTime[i].stop, 'aheadtime', aheadTime, 'buffer length', g.buffer?.length);
                            g.start(generatorTime[i].start);
                            g.stop(generatorTime[i].stop + 2 * LOOKAHEAD / 1000);
                            generatorStarted[i] = true;
                            progressIncrement += 1;
                        }
                    });
                    nextTime += CHUNKTIME;
                    // console.log(`next chunk`, nextTime)
                }
                if (progressIncrement > 0)
                    setProgress((prev) =>
                        (prev + 100* progressIncrement / generatorTime.length));
                timerID = window.setTimeout(scheduler, LOOKAHEAD);
                // console.log('timer set');
            } else {
                // console.log('clearing timer')
                clearTimeout(timerID);
            }
            // stop the playback if the current time is past all generator stop times
            let allStop = true;
            generatorTime.forEach((t) => {
                // console.log('generator stopped?', g.stopTime, 'context', audioContext.currentTime);
                if (t.stop > audioContext.currentTime) {
                    // console.log('genertor not stopped', g.name, g.stopTime, audioContext.currentTime);
                    allStop = false;
                }
            });
            if (allStop) {
                // console.log('all stop')
                // setPlaying(false);
                playing.current = false;
                setMode('');
                if (!generator && recordHandle) {
                    mediaRecorder.stop();
                    setStatus(`Recording complete in '${recordHandle.name}' in the directory of your choosing.`)
                }
                audioContext.close();
            }
        }
    }

    return (
        <>
            {/* Generator running modal */}
            <div
                style={{ display: playing ? "block" : "none" }}
                className="modal-content"
            >
                <div className='modal-header'>
                    <span className='close' onClick={handleGeneratorStop}>&times;</span>
                    <h2>Generator Running</h2>
                </div>
                <div className='modal-body'>
                    <div className='progress-container' key={'progress-container'}>
                        <div className='progress-filler'
                            style={{ width: `${progress}%` }}
                        >
                            <div className='progress-labels'>
                                <span>{`${Math.trunc(progress)}%`}</span>
                            </div>
                        </div>
                    </div>
                    {/* <ProgressBar key={'playback-progress'} completed={progress.current} /> */}
                </div>
                <div className='modal-footer'>
                    <button
                        id={'generator-stop'}
                        key={'generator-stop'}
                        onClick={handleGeneratorStop}>
                        Stop Generator
                    </button>
                </div>
            </div>
            {/* error modal */}
            <div
                style={{ display: error == '' ? "none" : "block" }}
                className="modal-content"
            >
                <div className='modal-header'>
                    <span className='close' onClick={handleErrorClose}>&times;</span>
                    <h2>Error occurred during audio generation</h2>
                </div>
                <div className="modal-body">
                    <p>{error}</p>
                </div>
                <div className='modal-footer'>
                    <button
                        id={'generator-error'}
                        onClick={handleErrorClose}
                    >
                        OK
                    </button>
                </div>
            </div>

        </>
    )
}

