// 
// this genertors a random sample for the duration the generator
// and the modulated the volume and pan rules similarly to
// the SFPG generatr
// each node time starts when the last one stops as determined by the spped attribute

import { NodeConnections } from "../../utils/nodeconnections";
import Compressor from "../../classes/compressor";
import Equalizer from "../../classes/equalizer";
import Noise from "../../classes/noise";
import { GeneratorTime } from "../../types/types";
const CHUNKSIZE: number = 0.1; // seconds
// the node's midi, volume, and pan values is plugged in from their respective chains 
export function getBufferSourceNodesFromNoise(
    context: AudioContext | OfflineAudioContext, 
    destination: AudioDestinationNode | MediaStreamAudioDestinationNode, 
    equalizer: Equalizer,
    compressor: Compressor,
    CMgenerator: Noise
): { sources: AudioBufferSourceNode[], times: GeneratorTime[] } {

    // console.log(
    //     'in getBufferSourceNodesFromNoise',
    // );
    // the generator has a start and end time
    const { startTime, stopTime } = CMgenerator;
    const sources: AudioBufferSourceNode[] = [];
    const times: GeneratorTime[] = [];


    // move the chunk into the audio node
    const chunkCount = Math.ceil((stopTime - startTime) / CHUNKSIZE);
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
        source.connect(vol);
        vol.connect(panner);
        NodeConnections(panner, equalizer, compressor, destination);
        sources.push(source);
        times.push({ start: time, stop: time + CHUNKSIZE, lastGain: (i == chunkCount - 1? vol: null)});
    }
    return { sources: sources, times: times };
}
