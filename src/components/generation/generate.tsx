// https://github.com/Blane245/musicgenerator/issues/5#issue-2550789485

import CMG from '../../classes/cmg';
import CMGFile from '../../classes/cmgfile';
import SFPG from '../../classes/sfpg';
import SFRG from 'classes/sfrg';
import { InstrumentZone } from '../../types/soundfonttypes';
import { getSFGeneratorValues } from '../../utils/soundfont2utils';


const SCHEDULEAHEADTIME: number = 0.1 // how far ahead to schedule audio (seconds)
const LOOKAHEAD: number = 25.0; // how frequently to call the schedule function (ms)
let timerID: number = 0; // the timer used to set the schedule 

// using the defined cm generators for all tracks, create a web audio
// TODO live for now, evenetually a mpg file
const CHUNKTIME: number = 1.0;
export function Generate(fileContents: CMGFile): string[] {

    const errors: string[] = [];
    let playing: boolean = false;

    // collect all generators on unmuted tracks
    const SFPGenerators: SFPG[] = [];
    const SFRGenerators: SFRG[] = [];
    let playbackLength = 0;
    fileContents.tracks.forEach((t) => {
        t.generators.forEach((g: CMG | SFPG) => {
            if (g.type == 'SFPG') {
                if (!(g as SFPG).preset)
                    errors.push(`Generator '${g.name}' on track '${t.name}' does not have a preset assigned.`)
                else {
                    SFPGenerators.push(g as SFPG);
                    playbackLength = Math.max(playbackLength, g.stopTime);
                }
            }
        })
    })
    if (SFPGenerators.length == 0 && SFRGenerators.length == 0)
        errors.push('No generators are available to produce any sound');
    if (errors.length != 0)
        return errors;

    console.log('useful SFP generators', SFPGenerators.length)

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
    // audioContext.suspend().then(()=> {
    // console.log('audio context state', audioContext.state);});
    // TODO - how to have the audio destination be an mpeg file

    // setup the sources for all of the generators
    const generatorSource: AudioBufferSourceNode[] = [];
    const generatorTime: { start: number, stop: number }[] = [];
    const generatorStarted: boolean[] = [];
    let nextTime: number = 0.0;
    SFPGenerators.forEach((g) => {
        const { sources, times } =
            getBufferSourceNodesFromSample(audioContext, g, CHUNKTIME);
        sources.forEach((s) => {
            generatorSource.push(s);
        })
        times.forEach((t) => {
            generatorTime.push(t);
            generatorStarted.push(false);
        })
    });
    // audioContext.resume().then(() => {
    //     console.log('audio context state', audioContext.state);});

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
            while (nextTime < audioContext.currentTime + SCHEDULEAHEADTIME) {
                generatorSource.forEach((g, i) => {
                    if (aheadTime >= generatorTime[i].start && !generatorStarted[i]) {
                        console.log('source', i, 'start', generatorTime[i].start, generatorTime[i].stop, 'aheadtime', aheadTime);
                        g.buffer?.length
                        g.start(aheadTime + generatorTime[i].start);
                        g.stop(aheadTime + generatorTime[i].stop);
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
            // audioContext.close();
        }
    }

    function playSample(
        time: number,
        generatorSource: AudioBufferSourceNode,
        generatorTime: { start: number, stop: number },
    ): void {
        generatorSource.start(time + generatorTime.start);
        generatorSource.stop(time + generatorTime.stop);
    }
}

// 
// this gets the midi sample from the preset 
// splits it up inot small chucks, say 0.1 seconds
// each chuck is a different node.
// pitch, volume, and pan modifications are made to each
// chuck based on the time that the generator start until it stops.
// these chucks are fed to the scheduler as the audiocontext advances 
// through current time.
function getBufferSourceNodesFromSample(context: AudioContext, CMgenerator: SFPG, deltaT: number):
    {sources: AudioBufferSourceNode[], times: {start: number, stop:number}[]} {

    // get the instrument zone for generator's preset
    if (!CMgenerator.preset)
        throw new Error(`Preset '${CMgenerator.presetName}' has not been initialized.`)
    const zones: InstrumentZone[] = CMgenerator.preset.zones[0].instrument.zones;
    if (zones.length == 0)
        throw new Error(`Preset '${CMgenerator.presetName}' instrument zones no not exist.`)

    // the generator has a start and end time
    const { startTime, stopTime } = CMgenerator;
    // A generator will need a number of #chucks = (stoptime-start)/CHUCKSIZE
    const chunkCount = Math.trunc(stopTime - startTime) / deltaT;

    // loop through each time chunks to get the current pitch, volume, and pan
    // for each chunk and apply them to the chunk
    let currentZone: InstrumentZone | null = null;
    let nextSampleIndex: number = 0;
    const sampleDuration: number = CMgenerator.stopTime - CMgenerator.startTime;
    const sources: AudioBufferSourceNode[] = [];
    const times:{start:number, stop:number}[] = [];
    for (let iChunk: number = 0; iChunk < chunkCount; iChunk += 1) {
        const time = iChunk * deltaT;
        const { pitch, volume, pan } = CMgenerator.getCurrentValues(time);
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
        const chunkSize = sampleRate * deltaT;
        nextSampleIndex = time / deltaT * chunkSize;

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
        // const rootKey = currentZone.sample.header.originalPitch;
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
        const floatSample: Float32Array = getNextSample(
            nextSampleIndex, loopStart, loopEnd, currentZone.sample.data, chunkSize);


        // move the chunk into the audio node
        // setting the samples, pan, volume, start time, and stop time
        const buffer:AudioBuffer = context.createBuffer(1, floatSample.length, sampleRate);
        const channelData:Float32Array = buffer.getChannelData(0);
        channelData.set(floatSample);
        const source:AudioBufferSourceNode = context.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = playbackRate;
        const vol:GainNode = context.createGain();
        vol.gain.value = volume;
        const panner:StereoPannerNode = context.createStereoPanner();
        panner.pan.value = pan / 1000;
        vol.connect(panner);
        source.connect(vol);
        panner.connect(context.destination);
        // source.start(time + CMgenerator.startTime);
        // source.stop(time + CMgenerator.startTime + deltat);

        // and add it to the accumulated sources
        sources.push(source);
        times.push({start:time + CMgenerator.startTime, stop:time + CMgenerator.startTime + deltaT})

    }

    return {sources:sources,times:times};
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