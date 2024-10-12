// https://github.com/Blane245/musicgenerator/issues/5#issue-2550789485

import CMG from '../../classes/cmg';
import CMGFile from '../../classes/cmgfile';
import SFPG from '../../classes/sfpg';
import SFRG from 'classes/sfrg';
import { CMGeneratorType } from '../../types/types';
import { getBufferSourceNodesFromSFPG } from './SFPGnodes';
import { getBufferSourceNodesFromSFRG } from './SFRGnodes';
import Noise from 'classes/noise';
import { getBufferSourceNodesFromNoise } from './noisenodes';


const SCHEDULEAHEADTIME: number = 0.1 // how far ahead to schedule audio (seconds)
const LOOKAHEAD: number = 25.0; // how frequently to call the schedule function (ms)
let timerID: number = 0; // the timer used to set the schedule 

// using the defined cm generators for all tracks, create a web audio
// if a generator is provided
const CHUNKTIME: number = 0.1;
export function Generate(fileContents: CMGFile, setStatus: Function, mode: string, generator: CMGeneratorType | null = null, recordHandle: FileSystemFileHandle | null = null): string[] {

    const errors: string[] = [];
    let playing: boolean = false;

    // collect all generators on unmuted tracks
    const SFPGenerators: SFPG[] = [];
    const SFRGenerators: SFRG[] = [];
    const NoiseGenerators: Noise[] = [];
    let playbackLength = 0;
    if (!generator || mode == 'recordfile') {
        fileContents.tracks.forEach((t) => {
            t.generators.forEach((g: CMG | SFPG | SFRG | Noise) => {
                if (g.type == 'SFPG' && !g.mute) {
                    if (!(g as SFPG).preset)
                        errors.push(`Generator '${g.name}' on track '${t.name}' does not have a preset assigned.`)
                    else {
                        SFPGenerators.push(g as SFPG);
                        playbackLength = Math.max(playbackLength, g.stopTime);
                    }
                }
                if (g.type == 'SFRG' && !g.mute) {
                    if (!(g as SFRG).preset)
                        errors.push(`Generator '${g.name}' on track '${t.name}' does not have a preset assigned.`)
                    else {
                        SFPGenerators.push(g as SFPG);
                        playbackLength = Math.max(playbackLength, g.stopTime);
                    }
                }
                if (g.type == 'Noise') {
                    NoiseGenerators.push(g as Noise);
                    playbackLength = Math.max(playbackLength, g.stopTime);

                }
            })
        })
    } else {
        if (!generator.mute) {
            if (generator.type == 'SFPG') {
                const tempGen: SFPG = (generator as SFPG).copy();
                tempGen.stopTime = tempGen.stopTime - tempGen.startTime;
                tempGen.startTime = 0;
                SFPGenerators.push(tempGen);
            } else if (generator.type == 'SFRG') {
                const tempGen: SFRG = (generator as SFRG).copy();
                tempGen.stopTime = tempGen.stopTime - tempGen.startTime;
                tempGen.startTime = 0;
                SFRGenerators.push(tempGen);
            } else if (generator.type == 'Noise') {
                const tempGen: Noise = (generator as Noise).copy();
                tempGen.stopTime = tempGen.stopTime - tempGen.startTime;
                tempGen.startTime = 0;
                NoiseGenerators.push(tempGen);

            }
            playbackLength = Math.max(playbackLength, (generator as CMG).stopTime);
        }
    }
    if (SFPGenerators.length == 0 &&
        SFRGenerators.length == 0 &&
        NoiseGenerators.length == 0
    )
        errors.push('No generators are available to produce any sound');
    if (errors.length != 0)
        return errors;

    console.log('useful generators', SFPGenerators.length + SFRGenerators.length + NoiseGenerators.length)

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
    const generatorSource: AudioBufferSourceNode[] = [];
    const generatorTime: { start: number, stop: number }[] = [];
    const generatorStarted: boolean[] = [];
    // build the buffers for the SFPGs
    let nextTime: number = 0.0;
    SFPGenerators.forEach((g) => {
        const { sources, times } =
            getBufferSourceNodesFromSFPG(audioContext, destination, g, CHUNKTIME);
        sources.forEach((s) => {
            generatorSource.push(s);
        })
        times.forEach((t) => {
            generatorTime.push(t);
            generatorStarted.push(false);
        })
    });

    // build the buffers for the SFRGs
    SFRGenerators.forEach(g => {
        const { sources, times } = getBufferSourceNodesFromSFRG(audioContext, destination, g);
        sources.forEach(s => {
            generatorSource.push(s);
        });
        times.forEach(t => {
            generatorTime.push(t);
            generatorStarted.push(false);
        });
    });

    // build the buffers for the SFRGs
    NoiseGenerators.forEach(g => {
        const { sources, times } = getBufferSourceNodesFromNoise(audioContext, destination, g);
        sources.forEach(s => {
            generatorSource.push(s);
        });
        times.forEach(t => {
            generatorTime.push(t);
            generatorStarted.push(false);
        });
    });


    start();
    scheduler();

    return [];

    // the idea is to modulate the the following when the source is created from 
    // the sample (getBufferSoruceFromSample)
    // frequency is changed by adjusting playbackrate
    // volume is changed by adjusting the volume envelop of CreateGain.gain
    // pan is by adjusting the pan value of a createStereoPanner.pan

    // audio context will increment the current time
    // this scheduler will prepare the generator samples 
    // for playing by adjusting the playback rate, the gain, and pan
    // based on the generator parameters

    function stop() {
        playing = false;
    }
    function start() {
        playing = true;
    }
    function scheduler(): void {
        if (playing) {
            const aheadTime = audioContext.currentTime + SCHEDULEAHEADTIME;
            // console.log('currentTIME', audioContext.currentTime, 'nextTime', nextTime, 'aheadTime', aheadTime);
            while (nextTime < aheadTime) {
                generatorSource.forEach((g, i) => {
                    if (aheadTime >= generatorTime[i].start && !generatorStarted[i]) {
                        // console.log('source', i, 'start', generatorTime[i].start, 'stop', generatorTime[i].stop, 'aheadtime', aheadTime, 'buffer length', g.buffer?.length);
                        g.start(generatorTime[i].start);
                        g.stop(generatorTime[i].stop + 2 * LOOKAHEAD / 1000);
                        generatorStarted[i] = true;
                        // playSample(aheadTime, generatorSource[i], generatorTime[i]);
                    }
                });
                nextTime += CHUNKTIME;
            }
            timerID = window.setTimeout(scheduler, LOOKAHEAD);
            // console.log('timer set');
        } else {
            // console.log('clearing timer')
            clearTimeout(timerID);
        }
        // stop the playback if the current time is past all generator stop times
        let allStop = true;
        SFPGenerators.forEach((g) => {
            if (g.stopTime > audioContext.currentTime)
                allStop = false;
        });
        if (allStop) {
            stop();
            if (!generator && recordHandle) {
                mediaRecorder.stop();
                setStatus(`Recording complete in '${recordHandle.name}' in the directory of your choosing.`)
                // audioContext.close();
            }
        }
    }
}

