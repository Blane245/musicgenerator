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
    const { fileContents, setStatus, playing, setTimeProgress } = useCMGContext();
    const [error, setError] = useState<string>('');
    const recordHandle = useRef<FileSystemFileHandle>();
    const generatorSource: AudioBufferSourceNode[] = [];
    const generatorTime: { start: number, stop: number }[] = [];
    const generatorStarted: boolean[] = [];

    useEffect(() => {
        async function filePicker() {
            try {
                const rh: FileSystemFileHandle = await window.showSaveFilePicker();
                recordHandle.current = rh;
                doTheWork();
            } catch (e) {
                // nothing to do here - user aborted recording
            }
        }
        console.log('mode change:', mode);
        if (mode == 'recordfile') {
            filePicker();
        } else if (mode != '') {
            doTheWork();
        }
    }, [mode])

    function handleErrorClose() {
        setError('');
        setMode('');
    }

    function doTheWork() {

        const SFPGenerators: SFPG[] = [];
        const SFRGenerators: SFRG[] = [];
        const NoiseGenerators: Noise[] = [];
        generatorSource.splice(0, generatorSource.length);
        generatorTime.splice(0, generatorTime.length);
        generatorStarted.splice(0, generatorStarted.length);
        let playbackLength = 0;

        // build the audio sources from the generators
        function buildSources(context: AudioContext, destination: AudioDestinationNode | MediaStreamAudioDestinationNode, chunkTime: number): void {
            SFPGenerators.forEach((g) => {
                const { sources, times } =
                    getBufferSourceNodesFromSFPG(context, destination, g, chunkTime);
                generatorSource.push(...sources);
                generatorTime.push(...times);
                generatorStarted.push(...Array(times.length).fill(false));
            });

            // build the buffers for the SFRGs
            SFRGenerators.forEach(g => {
                const { sources, times } = getBufferSourceNodesFromSFRG(context, destination, g);
                generatorSource.push(...sources);
                generatorTime.push(...times);
                generatorStarted.push(...Array(times.length).fill(false));
            });

            // build the buffers for the SFRGs
            NoiseGenerators.forEach(g => {
                const { sources, times } = getBufferSourceNodesFromNoise(context, destination, g);
                generatorSource.push(...sources);
                generatorTime.push(...times);
                generatorStarted.push(...Array(times.length).fill(false));
            });
        }

        function PreviewOrRecord(mode: string): void {
            if (playing.current)
                playing.current.on = true;
            setTimeProgress(0);

            // create an audiocontext that has its output as an mpeg file that is stored in the Generate folder.
            // get the length of the file, in seconds. It is the maximum of 
            // all of the generators stop times

            const audioContext: AudioContext = new AudioContext();
            audioContext.suspend();

            // setup the sources for all of the generators
            const recordDestination: MediaStreamAudioDestinationNode = audioContext.createMediaStreamDestination();
            const destination = (mode == 'recordfile'? recordDestination: audioContext.destination);
            const mediaRecorder: MediaRecorder = new MediaRecorder(recordDestination.stream);
            const recordChunks: Blob[] = [];
            if (mode == 'recordfile') {
                mediaRecorder.start();
                mediaRecorder.pause();
            }

            mediaRecorder.ondataavailable = (evt) => {
                console.log(`new recorded chunk at ${evt.timecode}, chunk size ${evt.data.size}`);
                recordChunks.push(evt.data);
            }

            mediaRecorder.onstop = async () => {
                // capture the recorded data and create an mpeg blob
                console.log('generator stopped recording with chunks', recordChunks.length);
                if (recordChunks.length > 0) {
                    const mpeg: Blob = new Blob(recordChunks, { type: "audio/mpeg-3" });

                    // write the blob to disk
                    if (recordHandle.current) {
                        console.log('recordHandle.name', recordHandle.current.name)
                        const accessHandle = await recordHandle.current.createWritable();
                        accessHandle.write(mpeg);
                        accessHandle.close();
                    }
                }
                if (playing.current) playing.current.on = false;
            }

            let nextTime: number = 0.0;
            // setup the destination as either the speakers or a recording buffer

            buildSources(audioContext, destination, CHUNKTIME);

            // resume the audio context after the sources have been built
            audioContext.resume();
            if (mode == 'recordfile') mediaRecorder.resume();

            // the real time scheduler
            scheduler();

            function scheduler(): void {
                if (playing.current?.on) {
                    const aheadTime = audioContext.currentTime + SCHEDULEAHEADTIME;
                    // console.log('currentTIME', audioContext.currentTime, 'nextTime', nextTime, 'aheadTime', aheadTime);
                    while (nextTime < aheadTime) {
                        let started:boolean = false;
                        generatorSource.forEach((g, i) => {
                            if (aheadTime >= generatorTime[i].start && !generatorStarted[i]) {
                                // console.log('source', i, 'start', generatorTime[i].start, 'stop', generatorTime[i].stop, 'aheadtime', aheadTime, 'buffer length', g.buffer?.length);
                                console.log('source', i, 'start', generatorTime[i].start, 'stop', generatorTime[i].stop);
                                g.start(generatorTime[i].start);
                                g.stop(generatorTime[i].stop + 2 * LOOKAHEAD / 1000);
                                generatorStarted[i] = true;
                                started = true;
                            }
                        });
                        if (started) setTimeProgress(audioContext.currentTime);
                        nextTime += CHUNKTIME;
                        // console.log(`next chunk`, nextTime)
                    }
                    timerID = window.setTimeout(scheduler, LOOKAHEAD);
                    // console.log('timer set');
                } else {
                    // console.log('clearing timer')
                    clearTimeout(timerID);
                }
                // stop the playback if the current time is past all generator stop times
                const running = generatorTime.find((t) => (t.stop > audioContext.currentTime))
                // generatorTime.forEach((t) => {
                //     // console.log('generator stopped?', g.stopTime, 'context', audioContext.currentTime);
                //     if (t.stop > audioContext.currentTime) {
                //         // console.log('genertor not stopped', g.name, g.stopTime, audioContext.currentTime);
                //         allStop = false;
                //     }
                // });
                if (!running || !playing.current?.on) {
                    // if (!running || !playing) {
                    // console.log('all stop')
                    // setPlaying(false);
                    if (playing.current)
                        playing.current.on = false;
                    if (audioContext.state !== 'closed') {
                        audioContext.suspend();
                        audioContext.close();
                    }
                    if (mode == 'recordfile')
                        mediaRecorder.stop();
                    setMode('');
                    setTimeProgress(0);
                }
            }
        }

        // get the active generators
        if (mode == 'recordfile' || mode == 'previewfile') {

            // find is there are any solo tracks
            let isSolo: boolean = (fileContents.tracks.findIndex((t) => (t.solo)) >= 0)

            fileContents.tracks.forEach((t) => {
                if (!t.mute) {
                    if ((isSolo && t.solo) || !isSolo) {
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
                    }
                }
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

        // select either recording or preview
        PreviewOrRecord(mode);
    }

    return (
        <>
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

