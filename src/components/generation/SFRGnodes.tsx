// 
// this follows the 4 markov chains for the midi, speed, volume, and pan attributes
// each node time starts when the last one stops as determined by the spped attribute

import SFRG from "../../classes/sfrg";
import { InstrumentZone } from "../../types/soundfonttypes";
import { getSFGeneratorValues } from "../../utils/soundfont2utils";

// the node's midi, volume, and pan values is plugged in from their respective chains 
export function getBufferSourceNodesFromSFRG(
    context: AudioContext, destination: AudioDestinationNode | MediaStreamAudioDestinationNode, gen: SFRG
): 
{ sources: AudioBufferSourceNode[], times: { start: number, stop: number }[] } {

    // get the instrument zone for generator's preset
    if (!gen.preset)
        throw new Error(`Preset '${gen.presetName}' has not been initialized.`)
    const zones: InstrumentZone[] = gen.preset.zones[0].instrument.zones;
    if (zones.length == 0)
        throw new Error(`Preset '${gen.presetName}' instrument zones no not exist.`)

    // the generator has a start and end time
    const { startTime, stopTime } = gen;
    let currentTime: number = startTime;
    const sources: AudioBufferSourceNode[] = [];
    const times: { start: number, stop: number }[] = [];

    // initialize the current values of the generator
    gen.midiT.currentValue = gen.midi;
    gen.speedT.currentValue = gen.speedT.startValue;
    gen.volumeT.currentValue = gen.volumeT.startValue;
    gen.panT.currentValue = gen.panT.startValue;
    while (currentTime < stopTime) {
        const { midi, speed, volume, pan } = gen.getCurrentValue();

        // deterime how long this note will play from the new speed and set its start and stop times
        const timeStep = 60.0 / speed;
        const thisTimeInterval: { start: number, stop: number } =
            { start: currentTime, stop: Math.min(stopTime, currentTime + timeStep) };
        currentTime += timeStep;
        times.push(thisTimeInterval);

        // get the new midi attributes from the soundfont file
        // get the samples for the sound to last the 
        // get the instrument's zone from the pitch, with clipping
        const iZone = zones.findIndex((z) => (z.keyRange && midi >= z.keyRange.lo && midi <= z.keyRange.hi));
        const currentZone: InstrumentZone = zones[iZone];
        const { sampleRate, start, startLoop, endLoop, pitchCorrection } = currentZone.sample.header;

        // get the soundfont generator values
        const generatorValues: Map<number, number> =
            getSFGeneratorValues(gen.preset, currentZone);
        // apply adjustments
        const startloopAddrsOffset: number | undefined = generatorValues.get(2);
        const endloopAddrsOffset: number | undefined = generatorValues.get(3);
        const startloopAddrsCoarseOffset: number | undefined = generatorValues.get(4);
        const endloopAddrsCoarseOffset: number | undefined = generatorValues.get(50);
        const overridingRootKey: number | undefined = generatorValues.get(58);
        const fineTune: number | undefined = generatorValues.get(52);
        const sampleModes: number | undefined = generatorValues.get(54);
        const velocity: number | undefined = generatorValues.get(47);

        const rootKey = overridingRootKey !== undefined && overridingRootKey > 0 ? overridingRootKey : currentZone.sample.header.originalPitch;
        const baseDetune = 100 * rootKey + pitchCorrection - (fineTune ? fineTune : 0);
        const cents = midi * 100 - baseDetune;
        const playbackRate = 1.0 * Math.pow(2, cents / 1200);
        const loopStart = startLoop +
            (startloopAddrsOffset ? startloopAddrsOffset : 0) +
            (startloopAddrsCoarseOffset ? startloopAddrsCoarseOffset * 32768 : 0);
        const loopEnd = endLoop +
            (endloopAddrsOffset ? endloopAddrsOffset : 0) +
            (endloopAddrsCoarseOffset ? endloopAddrsCoarseOffset * 32768 : 0);

        // get the chunk's sample
        // nextSampleIndex = Math.ceil(iChunk * chunkSize * playbackRate);
        const floatSample: Float32Array = new Float32Array(currentZone.sample.data.length)
        for (let i = 0; i < floatSample.length; i++) {
            floatSample[i] = currentZone.sample.data[i] / 32768.0
        }
        console.log(
            'midi', midi,
            'speed', speed,
            'volume', volume,
            'pan', pan,
            'thisTimeInterval', thisTimeInterval,
            'currentTime', currentTime,
            'currentzone', currentZone,
            'rootKey', rootKey,
            'pitchCorrection', pitchCorrection,
            'fineTune', fineTune,
            'baseDetune', baseDetune,
            'cents', cents,
            'playbackRate', playbackRate,
            'sampleRate', sampleRate,
            'loopStart', loopStart,
            'loopEnd', loopEnd,
            'sample length', floatSample.length,
        )


        // move the chunk into the audio node
        // setting the samples, pan, volume, start time, and stop time
        const buffer: AudioBuffer = context.createBuffer(1, floatSample.length, sampleRate);
        const channelData: Float32Array = buffer.getChannelData(0);
        channelData.set(floatSample);
        const source: AudioBufferSourceNode = context.createBufferSource();
        source.buffer = buffer;
        // source.loop = true;
        source.loopEnd = loopEnd;
        source.loopStart = loopStart;
        source.playbackRate.value = playbackRate;
        const vol: GainNode = context.createGain();
        vol.gain.value = volume / 100;
        const panner: StereoPannerNode = context.createStereoPanner();
        panner.pan.value = pan;
        vol.connect(panner);
        source.connect(vol);
        panner.connect(destination);
        sources.push(source);
    }

    return { sources: sources, times: times };
}
