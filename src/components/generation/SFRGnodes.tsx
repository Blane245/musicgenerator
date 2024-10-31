// 
// this follows the 4 markov chains for the midi, speed, volume, and pan attributes
// each node time starts when the last one stops as determined by the spped attribute
import { NodeConnections } from "../../utils/nodeconnections";
import Equalizer from "../../classes/equalizer";
import SFRG from "../../classes/sfrg";
import { InstrumentZone } from "../../types/soundfonttypes";
import { GeneratorTime, REPEATOPTION } from "../../types/types";
import { getSFGeneratorValues } from "../../utils/soundfont2utils";
import Compressor from "classes/compressor";

// the node's midi, volume, and pan values is plugged in from their respective chains 
export function getBufferSourceNodesFromSFRG(
    context: AudioContext | OfflineAudioContext,
    destination: AudioDestinationNode | MediaStreamAudioDestinationNode,
    equalizer: Equalizer,
    compressor: Compressor,
    gen: SFRG
): { sources: AudioBufferSourceNode[], times: GeneratorTime[] } {

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
    const times: GeneratorTime[] = [];

    // initialize the current values of the generator
    gen.midiT.currentValue = gen.midi;
    gen.speedT.currentValue = gen.speedT.startValue;
    gen.volumeT.currentValue = gen.volumeT.startValue;
    gen.panT.currentValue = gen.panT.startValue;
    while (currentTime < stopTime) {
        const { midi, speed, volume, pan } = gen.getCurrentValue();

        // deterime how long this note will play from the new speed and set its start and stop times
        const timeStep = 60.0 / speed;

        // get the new midi attributes from the soundfont file
        // get the samples for the sound to last the 
        // get the instrument's zone from the pitch, with clipping
        let iZone = zones.findIndex((z) => (z.keyRange && midi >= z.keyRange.lo && midi <= z.keyRange.hi));
        if (iZone < 0) iZone = 0;
        const currentZone: InstrumentZone = zones[iZone];
        const { sampleRate, startLoop, endLoop, pitchCorrection } = currentZone.sample.header;

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
        function getSample(loopStart: number, loopEnd: number, repeat: REPEATOPTION, sample: Int16Array, chunkSize: number): Float32Array {
            const nSam = Math.ceil(chunkSize);
            const sam: Float32Array = new Float32Array(nSam);
            let iSam: number = 0;
            let iLoop: number = 0;
            while (iSam < nSam) {
                if (repeat == REPEATOPTION.None && iSam > loopEnd)
                    sam[iSam] = 0.0;
                else
                    sam[iSam] = sample[iLoop] / 32768.0;
                iSam++;
                iLoop++;
                if (iLoop > loopEnd)
                    if (repeat == REPEATOPTION.Sample)
                        iLoop = loopStart;
                    else if (repeat == REPEATOPTION.Beginning)
                        iLoop = 0;
                // console.log(`loop back at ${iSam} -  ${iLoop}`)

            }
            return sam;
        }
        const floatSample: Float32Array = getSample(loopStart, loopEnd, gen.repeat, currentZone.sample.data, sampleRate * timeStep * playbackRate)
        // const floatSample: Float32Array = new Float32Array(currentZone.sample.data.length)
        // for (let i = 0; i < floatSample.length; i++) {
        //     floatSample[i] = currentZone.sample.data[i] / 32768.0
        // }
        // console.log(
        //     'midi', midi,
        //     'speed', speed,
        //     'volume', volume,
        //     'pan', pan,
        //     'currentTime', currentTime,
        //     'currentzone', currentZone,
        //     'rootKey', rootKey,
        //     'pitchCorrection', pitchCorrection,
        //     'fineTune', fineTune,
        //     'baseDetune', baseDetune,
        //     'cents', cents,
        //     'playbackRate', playbackRate,
        //     'sampleRate', sampleRate,
        //     'loopStart', loopStart,
        //     'loopEnd', loopEnd,
        //     'sample length', floatSample.length,
        // )


        // move the chunk into the audio node
        // setting the samples, pan, volume, start time, and stop time
        const buffer: AudioBuffer = context.createBuffer(1, floatSample.length, sampleRate);
        const channelData: Float32Array = buffer.getChannelData(0);
        channelData.set(floatSample);
        const source: AudioBufferSourceNode = context.createBufferSource();
        source.buffer = buffer;
        source.loop = false;
        // source.loopEnd = loopEnd;
        // source.loopStart = loopStart;
        source.playbackRate.value = playbackRate;
        const vol: GainNode = context.createGain();
        vol.gain.value = volume / 100;
        const panner: StereoPannerNode = context.createStereoPanner();
        panner.pan.value = pan;
        source.connect(vol);
        vol.connect(panner);
        NodeConnections(panner, equalizer, compressor, destination);
        sources.push(source);
        const thisTimeInterval: GeneratorTime =
            { start: currentTime, stop: Math.min(stopTime, currentTime + timeStep), lastGain: vol };
        // console.log(
        //     'thisTimeInterval', thisTimeInterval,
        // )
        times.push(thisTimeInterval);
        currentTime += timeStep;
    }

    return { sources: sources, times: times };
}
