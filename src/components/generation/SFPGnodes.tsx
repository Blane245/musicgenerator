// 
// this gets the midi sample from the preset 
// splits it up into small chucks, say 0.1 seconds
// each chuck is a different node.
// pitch, volume, and pan modifications are made to each
// chuck based on the time that the generator start until it stops.
// these chucks are fed to the scheduler as the audiocontext advances 

import SFPG from "../../classes/sfpg";
import { InstrumentZone } from "../../types/soundfonttypes";
import { getSFGeneratorValues } from "../../utils/soundfont2utils";

// through current time.
let currentSampleIndex: number = 0;
export function getBufferSourceNodesFromSFPG(
    context: AudioContext, destination: AudioDestinationNode | MediaStreamAudioDestinationNode, CMgenerator: SFPG, deltaT: number
): { sources: AudioBufferSourceNode[], times: { start: number, stop: number }[] } {

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
    const chunkCount = Math.round((stopTime - startTime) / deltaT);

    // loop through each time chunks to get the current pitch, volume, and pan
    // for each chunk and apply them to the chunk
    let currentZone: InstrumentZone | null = null;
    let lastPitch: number = -1;
    const sources: AudioBufferSourceNode[] = [];
    const times: { start: number, stop: number }[] = [];
    for (let iChunk: number = 0; iChunk < chunkCount; iChunk += 1) {
        if (iChunk == 0) currentSampleIndex = 0;
        const time = iChunk * deltaT;
        const { pitch, volume, pan } = CMgenerator.getCurrentValues(time);
        if (lastPitch != pitch) {
            lastPitch = pitch;
        }
        // get the instrument's zone from the pitch, with clipping
        let iZone = 0;
        const basePitch = Math.trunc(pitch)
        if (!zones[0].keyRange || basePitch < zones[0].keyRange.lo) {
            iZone = 0;
        } else if (!zones[zones.length - 1].keyRange || (basePitch > zones[zones.length - 1].keyRange.hi)) {
            iZone = zones.length - 1;
        } else {
            iZone = zones.findIndex((z) => (z.keyRange && basePitch >= z.keyRange.lo && basePitch <= z.keyRange.hi));
        }
        if (!currentZone || currentZone != zones[iZone]) {
            currentZone = zones[iZone];
            currentSampleIndex = 0;
        }
        // console.log (
        //     'iZone', iZone,
        //     'currentZone', currentZone, 
        // )
        const { sampleRate, start, startLoop, endLoop, pitchCorrection } = currentZone.sample.header;

        // each chuck a number of samples depending on the sample rate and the Chunk size
        const chunkSize = Math.round(sampleRate * deltaT);

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
        // const rootKey = currentZone.sample.header.originalPitch;
        // const rootKey = Math.round(pitch)
        const baseDetune = 100 * rootKey + pitchCorrection - (fineTune ? fineTune : 0);
        const cents = pitch * 100 - baseDetune;
        const playbackRate = 1.0 * Math.pow(2, cents / 1200);
        const loopStart = startLoop +
            (startloopAddrsOffset ? startloopAddrsOffset : 0) +
            (startloopAddrsCoarseOffset ? startloopAddrsCoarseOffset * 32768 : 0);
        const loopEnd = endLoop +
            (endloopAddrsOffset ? endloopAddrsOffset : 0) +
            (endloopAddrsCoarseOffset ? endloopAddrsCoarseOffset * 32768 : 0);

        // get the chunk's sample and update the next sample index
        // nextSampleIndex = Math.ceil(iChunk * chunkSize * playbackRate);
        const floatSample: Float32Array = getNextSample(
            loopStart, loopEnd,
            currentZone.sample.data,
            chunkSize * playbackRate);
        console.log(
            'chunkCount', chunkCount,
            'iChunk', iChunk,
            'time', time,
            'currentSampleIndex',currentSampleIndex,
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
        times.push({ start: time + CMgenerator.startTime, stop: time + CMgenerator.startTime + deltaT })

    }

    return { sources: sources, times: times };
}
// get a full chuckSize set of samples from the instrument's samples
// taking into account looping
function getNextSample
    (startLoop: number, endLoop: number, sampleData: Int16Array, chunkSize: number): Float32Array {
    let sampleCount = 0;
    // console.log('in getNextSample',
    //     'chunkSize', chunkSize,
    //      'startLoop', startLoop,
    //        'endLoop', endLoop,
    //        'sample length', sampleData.length,
    // )
    const floatSample: Float32Array = new Float32Array(chunkSize);
    while (sampleCount < chunkSize) {
        floatSample[sampleCount] =
            sampleData[currentSampleIndex] / 32768.0;
        currentSampleIndex++;
        if (currentSampleIndex > endLoop) {
            currentSampleIndex = startLoop;
            console.log(`loop back, ${currentSampleIndex}`)
        }
        sampleCount++;
    }
    // console.log(`last sample, ${sampleCount}`);
    return floatSample;
}
