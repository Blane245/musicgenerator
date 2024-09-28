
import { InstrumentZone } from 'types/soundfonttypes';
import SFPG from '../classes/sfpg';
import { getSFGeneratorValues } from './soundfont2utils';
import { SoundFont2 } from 'soundfont2';
import CMG from 'classes/cmg';

// 
// this gets the midi sample from the preset 
// splits it up inot small chucks, say 0.1 seconds
// each chuck is a different node.
// pitch, volume, and pan modifications are made to each
// chuck based on the time that the generator start until it stops.
// these chucks are fed to the scheduler as the audiocontext advances 
// through current time.
const CHUNKTIME: number = 0.1;
export function getBufferSourceNodesFromSample(context: AudioContext, CMgenerator: SFPG):
    AudioBufferSourceNode[] {

    // get the instrument zone for generator's preset
    if (!CMgenerator.preset)
        throw new Error(`Preset '${CMgenerator.presetName}' has not been initialized.`)
    const zones: InstrumentZone[] = CMgenerator.preset.zones[0].instrument.zones;
    if (zones.length == 0)
        throw new Error(`Preset '${CMgenerator.presetName}' instrument zones no not exist.`)

    // the generator has a start and end time
    const { startTime, stopTime } = CMgenerator;
    // A generator will need a number of #chucks = (stoptime-start)/CHUCKSIZE
    const chunkCount = Math.trunc(stopTime - startTime) / CHUNKTIME;

    // loop through each time chunks to get the current pitch, volume, and pan
    // for each chunk and apply them to the chunk
    let currentZone: InstrumentZone | null = null;
    let nextSampleIndex: number = 0;
    const sampleDuration: number = CMgenerator.stopTime - CMgenerator.startTime;
    const sources: AudioBufferSourceNode[] = [];
    for (let time: number = 0; time < sampleDuration; time += CHUNKTIME) {
        const { pitch, volume, pan } = CMgenerator.getCurrentValues(time);
        const iChunk = time / CHUNKTIME; // which chuck we are working on 

        // get the samples for the sound to last the 
        // get the instrument's zone from the pitch, with clipping
        let iZone = 0;
        if (!zones[0].keyRange || pitch < zones[0].keyRange.lo) {
            iZone = 0;
        } else if (!zones[zones.length - 1].keyRange || (pitch > zones[zones.length - 1].keyRange.hi)) {
            iZone = zones.length - 1;
        } else {
            iZone = zones.findIndex((z) => (z.keyRange && pitch >= z.keyRange.lo && pitch <= z.keyRange.hi));
        }
        if (!currentZone || currentZone != zones[iZone]) {
            currentZone = zones[iZone];
        }
        const { sampleRate, start, startLoop, endLoop, pitchCorrection } = zones[iZone].sample.header;

        // each chuck a number of samples depending on the sample rate and the Chunk size
        const chunkSize = sampleRate * CHUNKTIME;
        nextSampleIndex = time / CHUNKTIME * chunkSize;

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

        const rootKey = overridingRootKey !== undefined && overridingRootKey !== -1 ? overridingRootKey : currentZone.sample.header.originalPitch;
        const baseDetune = 100 * rootKey + pitchCorrection - (fineTune ? fineTune : 0);
        const cents = pitch * 100 - baseDetune;
        const playbackRate = 1.0 * Math.pow(2, cents / 1200);
        const loopStart = zones[iZone].sample.header.startLoop +
            (startloopAddrsOffset ? startloopAddrsOffset : 0) +
            (startloopAddrsCoarseOffset ? startloopAddrsCoarseOffset * 32768 : 0);
        const loopEnd = endLoop +
            (endloopAddrsOffset ? endloopAddrsOffset : 0) +
            (endloopAddrsCoarseOffset ? endloopAddrsCoarseOffset * 32768 : 0);


        // get the chunk's sample and update the next sample index
        const floatSample = getNextSample(
            nextSampleIndex, loopStart, loopEnd, currentZone.sample.data, chunkSize);


        // move the chunk into the audio node
        // setting the samples, pan, volume, start time, and stop time
        const buffer = context.createBuffer(1, floatSample.length, sampleRate);
        const channelData = buffer.getChannelData(0);
        channelData.set(floatSample);
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = playbackRate;
        const vol = context.createGain();
        vol.gain.value = volume;
        const panner = context.createStereoPanner();
        panner.pan.value = pan / 1000;
        vol.connect(panner);
        source.connect(vol);
        source.start(time + CMgenerator.startTime);
        source.stop(time + CMgenerator.startTime + CHUNKTIME);

        // and add it to the accumulated sources
        sources.push(source);

    }




    return sources;
}

// while the sfumato solution for playing soundfont files is very elegant
// it is a bit of overkill for what I need. It uses some but not all of the
// preset, zone, and instrument generators. TypeScript is having trouble explicitly
// capturing the mapping of the modulators for some reason. I need fewer than that uses. The
// necessary list is
// http://www.synthfont.com/SFSPEC21.PDF page 38
// startloopAddrsOffset (2) - start offset of looping samples
// endloopAddrsOffset (3) - start offset of looping samples
// startAddrsCoarseOffset (4) - 
// endAddrsCoarseOffset (50) - 

// overridingrootkey(58) - overrides original key (midi number)
// fineTune(52) - pitch offset (cents)
// sampleModes(54) - 0,2 (no loop), 1 (continuous loop) others not implemented
// velocity(47) - ?
// delayVolEnv(33) - delay time (timecents) before note starts
//  there will be no delay
// attackVolEnv(34) - attack time (timecents) (use)
//  attack phase will be implemented
// holdVolEnv(35) - hold time (timecents)
//  hold phase will not be implemented
// decayVolEnv(36) - decay time (timecents) (use)
//  decay will be will implemented
// sustainVolEnv(37) - sustain time (timecents)
//  sustain period will depend on the playback rate
// releaseVolEnv(38) - release time (timecents)
//  will not be implemented
// values from sample header
// pitchCorrection (cents)
// originalPitch (midi number)
// startLoop (index to sample)
// endLoop (index to sample)

// the note time period is split up as follows:
// playbackrate(sec) = 1/BPM * 60 which is the time between notes
// t0 will be the time that the note is to played
// attack time is from t0 to attack exponential ramp
// sustain time is from t0 + attack to playbackrate - attack - decay
// decay time is t0+playbackrate - decay linear ramp

// so I need modulators 58, 52, 54, 47, 34, 36
// they will come (relatively from the preset and absolutely from the instrument)

// to get the generator values for a specific note for a specific instrument (preset)
// NOTE only using preset with one zone (instrument)
// check preset globalzone generators
// check the presetzone's generators
// check the instument's global zone
// get the note's zone
// check the zone's generators

// get a full chuckSize set of samples from the instrument's samples
// taking into account looping
function getNextSample
    (nextSampleIndex: number, startLoop: number, endLoop: number, sampleData: Int16Array, chunkSize: number):Float32Array {
    // make sure the zone has proper loop values
    // nextsampleindex is the place in teh smaple where the chunk
    // will start
    let sampleCount = 0;
    let currentSampleIndex = nextSampleIndex;
    const floatSample: Float32Array = new Float32Array(chunkSize);
    while (sampleCount < chunkSize) {
        floatSample[sampleCount] =
            sampleData[currentSampleIndex] / 32768.0;
        currentSampleIndex++;
        if (currentSampleIndex > endLoop) {
            currentSampleIndex = startLoop;
        }
        sampleCount++;
    }
    return floatSample;
}
