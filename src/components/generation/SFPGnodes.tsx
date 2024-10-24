// 
// this gets the midi sample from the preset 
// splits it up into small chucks, say 0.1 seconds
// each chuck is a different node.
// pitch, volume, and pan modifications are made to each
// chuck based on the time that the generator start until it stops.
// these chucks are fed to the scheduler as the audiocontext advances 

import { GeneratorTimes } from "../../types/types";
import SFPG from "../../classes/sfpg";
import { InstrumentZone } from "../../types/soundfonttypes";
import { getSFGeneratorValues } from "../../utils/soundfont2utils";

// through current time.
let currentSampleIndex: number = 0;
export function getBufferSourceNodesFromSFPG(
    context: AudioContext | OfflineAudioContext, destination: AudioDestinationNode | MediaStreamAudioDestinationNode, CMgenerator: SFPG, deltaT: number
): { sources: AudioBufferSourceNode[], times: GeneratorTimes[] } {

    console.log('getting SFPG sources',
        'name', CMgenerator.name,
        'deltaT', deltaT,
    );
    // get the instrument zone for generator's preset
    if (!CMgenerator.preset)
        throw new Error(`Preset '${CMgenerator.presetName}' has not been initialized.`)
    const zones: InstrumentZone[] = CMgenerator.preset.zones[0].instrument.zones;
    if (zones.length == 0)
        throw new Error(`Preset '${CMgenerator.presetName}' instrument zones no not exist.`)

    // the generator has a start and end time
    const { startTime, stopTime } = CMgenerator;
    // A generator will need a number of #chucks = (stoptime-start)/CHUCKSIZE
    const chunkCount = Math.ceil((stopTime - startTime) / deltaT);

    // loop through each time chunks to get the current pitch, volume, and pan
    // for each chunk and apply them to the chunk
    let currentZone: InstrumentZone | null = null;
    let lastPitch: number = -1;
    const sources: AudioBufferSourceNode[] = [];
    const times: GeneratorTimes[] = [];
    for (let iChunk: number = 0; iChunk < chunkCount; iChunk += 1) {
        if (iChunk == 0) currentSampleIndex = 0;
        const time = iChunk * deltaT;
        const { pitch, volume, pan } = CMgenerator.getCurrentValues(time);
        if (lastPitch != pitch) {
            lastPitch = pitch;
        }
        // get the instrument's zone from the pitch, with clipping
        const basePitch = Math.ceil(pitch)
        let iZone = zones.findIndex((z) => (z.keyRange && basePitch >= z.keyRange.lo && basePitch <= z.keyRange.hi));
        if (iZone < 0) iZone = 0;
        if (!currentZone || currentZone != zones[iZone]) {
            currentZone = zones[iZone];
            // currentSampleIndex = 0;
        }
        const { sampleRate, startLoop, endLoop, pitchCorrection } = currentZone.sample.header;

        // each chuck a number of samples depending on the sample rate and the Chunk size
        const chunkSize = Math.ceil(sampleRate * deltaT);

        // get the soundfont generator values
        const generatorValues: Map<number, number> =
            getSFGeneratorValues(CMgenerator.preset, currentZone);
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
        const cents = pitch * 100 - baseDetune;
        const precision = deltaT / 10.0;
        const playbackRate = Math.ceil(1.0 * Math.pow(2, cents / 1200) / precision) * precision;
        const loopStart = startLoop +
            (startloopAddrsOffset ? startloopAddrsOffset : 0) +
            (startloopAddrsCoarseOffset ? startloopAddrsCoarseOffset * 32768 : 0);
        const loopEnd = endLoop +
            (endloopAddrsOffset ? endloopAddrsOffset : 0) +
            (endloopAddrsCoarseOffset ? endloopAddrsCoarseOffset * 32768 : 0);

            if (currentSampleIndex > loopEnd) currentSampleIndex = loopStart;
        // get the chunk's sample and update the next sample index
        const floatSample: Float32Array = getNextSample(
            loopStart, loopEnd,
            currentZone.sample.data,
            Math.ceil(chunkSize * playbackRate));
        console.log(
            'chunkCount', chunkCount,
            'iChunk', iChunk,
            'time', time,
            'currentSampleIndex', currentSampleIndex,
            'loopStart', loopStart,
            'loopEnd', loopEnd,
            'sample length', floatSample.length,
            'currentzone', currentZone,
            'rootKey', rootKey,
            'pitchCorrection', pitchCorrection,
            'fineTune', fineTune,
            'baseDetune', baseDetune,
            'pitch', pitch,
            'cents', cents,
            'playbackRate', playbackRate,
            'sampleRate', sampleRate,
        )


        // move the chunk into the audio node
        // setting the samples, pan, volume, start time, and stop time
        const buffer: AudioBuffer = context.createBuffer(1, floatSample.length, sampleRate);
        const channelData: Float32Array = buffer.getChannelData(0);
        channelData.set(floatSample);
        const source: AudioBufferSourceNode = context.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = playbackRate;
        const vol: GainNode = context.createGain();
        vol.gain.value = volume / 100;
        const panner: StereoPannerNode = context.createStereoPanner();
        panner.pan.value = Math.min(Math.max(pan, -1.0), 1.0);
        vol.connect(panner);
        source.connect(vol);
        panner.connect(destination);

        // and add it to the accumulated sources
        sources.push(source);
        times.push(
            {
                start: time + CMgenerator.startTime,
                stop: time + CMgenerator.startTime + deltaT,
                lastGain: (iChunk == chunkCount - 1 ? vol : null)
            })
    }

    return { sources: sources, times: times };
}
// get a full chuckSize set of samples from the instrument's samples
// taking into account looping
function getNextSample
    (startLoop: number, endLoop: number, sampleData: Int16Array, chunkSize: number): Float32Array {
    const floatSample: Float32Array = new Float32Array(chunkSize);
    for (let i = 0; i < chunkSize; i++) {
        floatSample[i] =
            sampleData[currentSampleIndex] / 32768.0;
        currentSampleIndex++;
        if (currentSampleIndex > endLoop) {
            currentSampleIndex = startLoop;
        }
    }
    return floatSample;
}
