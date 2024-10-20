// 
// this genertors a random sample for the duration the generator
// and the modulated the volume and pan rules similarly to
// the SFPG generatr
// each node time starts when the last one stops as determined by the spped attribute

import { setRansomSeed } from "../../utils/seededrandom";
import Noise from "../../classes/noise";
const CHUNKSIZE: number = 0.1; // seconds
// the node's midi, volume, and pan values is plugged in from their respective chains 
export function getBufferSourceNodesFromNoise(
    context: AudioContext, destination: AudioDestinationNode | MediaStreamAudioDestinationNode, CMgenerator: Noise
): { sources: AudioBufferSourceNode[], times: { start: number, stop: number }[] } {

    // console.log(
    //     'in getBufferSourceNodesFromNoise',
    // );
    // the generator has a start and end time
    const { startTime, stopTime } = CMgenerator;
    const sources: AudioBufferSourceNode[] = [];
    const times: { start: number, stop: number }[] = [];


    // move the chunk into the audio node
    const chunkCount = Math.ceil((stopTime - startTime) / CHUNKSIZE);
    setRansomSeed(CMgenerator.seed);
    for (let i = 0; i < chunkCount; i++) {
        const time: number = i * CHUNKSIZE + startTime;
        const { sample, volume, pan } = CMgenerator.getCurrentValue(time, CHUNKSIZE);
        // console.log(
        //     'noise type', CMgenerator.noiseType,
        //     'startTime', time,
        //     'stopTime', time + CHUNKSIZE,
        //     'volume', volume,
        //     'pan', pan,
        //     'sample length', sample.length,
        // )
        // setting the samples, pan, volume, start time, and stop time
        const buffer: AudioBuffer = context.createBuffer(1, sample.length, CMgenerator.sampleRate);
        const channelData: Float32Array = buffer.getChannelData(0);
        channelData.set(sample);
        const source: AudioBufferSourceNode = context.createBufferSource();
        source.buffer = buffer;
        source.loopEnd = sample.length;
        source.loopStart = 0;
        source.playbackRate.value = 1.0;
        const vol: GainNode = context.createGain();
        vol.gain.value = volume / 100;
        const panner: StereoPannerNode = context.createStereoPanner();
        panner.pan.value = pan;
        vol.connect(panner);
        source.connect(vol);
        panner.connect(destination);
        sources.push(source);
        times.push({ start: time, stop: time + CHUNKSIZE });
    }
    return { sources: sources, times: times };
}
