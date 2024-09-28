// https://github.com/Blane245/musicgenerator/issues/5#issue-2550789485

import CMG from "classes/cmg";
import CMGFile from "classes/cmgfile";
import SFPG from "classes/sfpg";
import { Preset } from "types/soundfonttypes";
import { Envelop } from "types/types";
import { getBufferSourceNodesFromSample } from "utils/soundfont2utils";
const SCHEDULEAHEADTIME = 0.1 // how far ahead to schedule audio (seconds)
const LOOKAHEAD: number = 25.0; // how frequently to call the schedule function (ms)
let timerID: number = 0; // the timer used to set the schedule 

export function Generate(fileContents: CMGFile): string[] {

    const errors: string[] = [];
    let playing: boolean = false;

    // collect all generators on unmuted tracks. for now only SFPG generators are processed
    const generators: SFPG[] = [];
    let playbackLength = 0;
    fileContents.tracks.forEach((t) => {
        t.generators.forEach((g: CMG | SFPG) => {
            if (g.type == 'SFPG') {
                if (!(g as SFPG).preset)
                    errors.push(`Generator '${g.name}' on track '${t.name}' does not have a preset assigned.`)
                else {
                    generators.push(g as SFPG);
                    playbackLength = Math.max(playbackLength, g.stopTime);
                }
            }
        })
    })
    if (generators.length == 0)
        errors.push('No generators are available to produce any sound');
    if (errors.length != 0)
        return errors;

    console.log('useful generators', generators.length)
    // create an audiocontext that has its output as an mpeg file that is stored in the Generate folder.
    // get the length of the file, in seconds. It is the maximum of 
    // all of the generators stop times

    // for now, we'll just play the tune
    // const audioContext:OfflineAudioContext = 
    //     new window.OfflineAudioContext({
    //         numberOfChannels: 2,
    //         sampleRate: 480000, 
    //         length: playbackLength * 480000
    //     });
    const audioContext: AudioContext = new AudioContext()
    console.log('audio context state', audioContext.state);
    // // TBD - how to have the audio destination be an mpeg file

    // setup the sources for all of the generators
    const generatorSource: AudioBufferSourceNode[] = [];
    generators.forEach((g) => {
        generatorSource.push(getBufferSourceNodesFromSample(audioContext, g));
    });

    playing = true;
    scheduler();
    // ready to start the playback

    // const TIMESTEP = 0.010;
    // // loop through time, set the gain and pan envelops, and connet everything to the audio context destination
    // generators.forEach((g) => {
    //     buildSampleSequence(g, sources);

    // })
    // for (let time = 0.0; time < playbackLength; time += TIMESTEP) {
    //     generateAtTime(time);
    // }

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

    function stop () {
        playing = false;
    }
    function start() {
        playing = true;
    }
    function scheduler(): void {
        if (playing) {
            const aheadTime = audioContext.currentTime + SCHEDULEAHEADTIME;
            generators.forEach((g, i) => {
                if (aheadTime >= g.startTime && aheadTime <= g.stopTime)
                    playSample(aheadTime, g, generatorSource[i]);
            });
            timerID = window.setTimeout(scheduler, LOOKAHEAD);
        } else {
            clearTimeout(timerID);
        }
    }

    function playSample(
        time: number,
        generator: SFPG,
        generatorSource: {
            source: AudioBufferSourceNode,
            envelop: Envelop,
        }
    ): void {

        // make adjustments to the playbackrate, volume, and pan
        // based on the generators parameters
        const {source, envelop} = generatorSource;
        const {pitch, volume, pan} = generator.getCurrentValues(time);
        source.playbackRate.value = pitch; //??
        const vol:GainNode = audioContext.createGain();
        vol.gain.setValueAtTime(volume, time);
        const panner: StereoPannerNode = audioContext.createStereoPanner();
        panner.pan.value = pan;
        source.connect(vol);
        vol.connect(panner);
        panner.connect(audioContext.destination);
        source.start(time);
        source.stop(time + LOOKAHEAD);
    }
}
