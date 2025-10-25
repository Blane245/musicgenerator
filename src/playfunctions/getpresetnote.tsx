import RandomNumber from "classes/randomnumber";
import { Algorithmic } from "../classes/generators";
import { RawSourceData } from "../types";
import { gaussianRandom } from "../utils/gaussianrandom";
import { getGeneratorValues } from "sfcomponents/sfgenerators";
import { samplePool } from "sfcomponents/samplepool";
import { InstrumentZone, Preset, PresetZone } from "sfcomponents/types";
import { attenuate, dBToGain, midiToFrequency, precision, tc2s } from "sfcomponents/util";
import { linearInterpolate } from "utils/interpolation";
import Track from "classes/track";
import findGeneratorParent from "utils/findgeneratorparent";
import CMGFile from "classes/cmgfile";

// select mid range velocity Range
const isActiveZone = (
  zone: PresetZone | InstrumentZone,
  midi: number,
  velocity: number
): boolean => {
  const keyRange: any = zone.keyRange;
  const velRange: any = zone.velRange;
  const keyCheck: boolean =
    !keyRange || (keyRange.lo <= midi && midi <= keyRange.hi);
  const velCheck: boolean =
    !velRange || (velRange.lo <= velocity && velocity <= velRange.hi);
  return keyCheck && velCheck;
};

const getActiveZones = (preset: Preset, midi: number, velocity: number) => {
  const activeZones = preset.zones
    .filter(
      (pzone: PresetZone) =>
        isActiveZone(pzone, midi, velocity) && pzone.instrument
    )
    .map((pzone: PresetZone) => {
      return pzone.instrument.zones
        .filter((izone: InstrumentZone) => isActiveZone(izone, midi, velocity))
        .map((izone: InstrumentZone) => {
          const mergedGenerators = getGeneratorValues(izone, pzone, preset);
          return {
            ...izone,
            mergedGenerators: mergedGenerators,
          };
        });
    })
    .flat();
  return activeZones;
};

export const getPresetNote = (
  fileContents: CMGFile,
  gen: Algorithmic,
  preset: Preset,
  noiseFrequency: number,
  noiseAmplitude: number,
  interval: number, // the note's time interval
  duration: number, // the note's duration with that interval
  pitchValue: number, // midi
  attack: number,
  generatorVolume: number,
  panValue: number,
  time: number,
  nextSource: number
): RawSourceData[] => {
  let sourceCount: number = nextSource;
  const zones = getActiveZones(preset, Math.round(pitchValue), attack);
  const result: RawSourceData[] = zones.map((zone) => {
    // get the sample
    const { sample: instrumentSample, header } = samplePool(zone.sample);

    // get the preset merged generator attributes
    const {
      name,
      startLoop,
      endLoop,
      originalPitch,
      pitchCorrection,
      sampleRate: instrumentSampleRate,
    } = header;
    const {
      // @ts-ignore
      overridingRootKey,
      // @ts-ignore
      fineTune = 0,
      // @ts-ignore
      startloopAddrsOffset = 0,
      // @ts-ignore
      startloopAddrsCoarseOffset = 0,
      // @ts-ignore
      endloopAddrsOffset = 0,
      // @ts-ignore
      endloopAddrsCoarseOffset = 0,
      // @ts-ignore
      delayVolEnv = -12000,
      // @ts-ignore
      attackVolEnv = -12000,
      // @ts-ignore
      holdVolEnv = -12000,
      // @ts-ignore
      decayVolEnv = -12000,
      // @ts-ignore
      sustainVolEnv = -12000,
      // @ts-ignore
      releaseVolEnv = -12000,
      // @ts-ignore
      sampleModes = 0,
      // @ts-ignore
      initialAttenuation = 0,
    } = zone.mergedGenerators;

    // get the playback rate
    const rootKey =
      overridingRootKey !== undefined && overridingRootKey !== -1
        ? overridingRootKey
        : originalPitch;
    const baseDetune = 100 * rootKey + pitchCorrection - fineTune;
    const cents = pitchValue * 100 - baseDetune - 45;

    // combining the instrument's sampleRate with the playbackRate
    let playbackRate = 1.0 * Math.pow(2, cents / 1200);
    const sampleRate: number = Math.floor(instrumentSampleRate * playbackRate);
    // playbackRate = 1;

    // get the sample looping parameters and override looping if requested
    let loopStart: number = 0;
    let loopEnd: number = 0;
    let loop = false;
    if (sampleModes == 1) {
      loopStart =
        startLoop + startloopAddrsOffset + startloopAddrsCoarseOffset * 32768;
      loopEnd = endLoop + endloopAddrsOffset + endloopAddrsCoarseOffset * 32768;
      loop = (gen as Algorithmic).isLooping;
    }

    // get the end times for the amplitude envelope
    const sampleTime: number =
      instrumentSample.length * instrumentSampleRate;
    const delayEnd: number = precision(tc2s(delayVolEnv), 3);
    const attackEnd: number = delayEnd + precision(tc2s(attackVolEnv), 3);
    const holdEnd: number = attackEnd + precision(tc2s(holdVolEnv), 3);
    const decayEnd: number = holdEnd + precision(tc2s(decayVolEnv), 3);
    // this last two number may be less than the others
    const noteEnd: number = loop ? duration : Math.min(sampleTime, duration);
    // release is cutoff if this is a staccatto or the sample is not looping
    const releaseEnd: number =
      loop && Math.abs(duration - interval) < 0.01
        ? noteEnd + precision(tc2s(releaseVolEnv), 3)
        : noteEnd;
    const totalTime: number = releaseEnd;
    const track: Track| null = findGeneratorParent(gen.name, fileContents);
    const volumeValue: number = track? generatorVolume + track.volume: generatorVolume
    const volumeGain: number = dBToGain(volumeValue);
    let attenuationdB: number = initialAttenuation / 10;
    // const attenuation: number = attenuate(1.0, attenuationdB);
    const attenuation: number = 1;
    const sustainGain: number = attenuate(volumeGain, sustainVolEnv / 100);

    // get the envelope curve
    let noteEndGain: number = 0;
    const envelope: { t: number; g: number }[] = [{ t: 0, g: 0 }];
    if (noteEnd < delayEnd) {
      envelope.push({ t: noteEnd, g: 0 });
    } else {
      envelope.push({t:delayEnd, g:0});
    }

    if (noteEnd >= delayEnd && noteEnd < attackEnd) {
      noteEndGain = linearInterpolate(noteEnd, delayEnd, attackEnd, 0, 1);
      envelope.push({ t: noteEnd, g: noteEndGain });
      if (noteEnd != releaseEnd) envelope.push({ t: releaseEnd, g: 0 });
    } else if (noteEnd >= attackEnd) {
      envelope.push({ t: attackEnd, g: 1 });
      noteEndGain = 1;
    }

    if (noteEnd >= attackEnd && noteEnd < holdEnd) {
      envelope.push({ t: noteEnd, g: 1 });
      if (noteEnd != releaseEnd) envelope.push({ t: releaseEnd, g: 0 });
      noteEndGain = 1;
    } else if (noteEnd >= holdEnd) {
      envelope.push({ t: holdEnd, g: 1 });
      noteEndGain = 1;
    }

    if (noteEnd >= holdEnd && noteEnd < decayEnd) {
      noteEndGain = linearInterpolate(
        noteEnd,
        holdEnd,
        decayEnd,
        noteEndGain,
        sustainGain
      );
      envelope.push({ t: noteEnd, g: noteEndGain });
      if (noteEnd != releaseEnd) envelope.push({ t: releaseEnd, g: 0 });
    } else if(noteEnd >= decayEnd) {
      envelope.push({ t: decayEnd, g: sustainGain });
      envelope.push({ t: noteEnd, g: sustainGain });
      noteEndGain = sustainGain;
    }

    envelope.push({ t: releaseEnd, g: 0 });

    let sample: Float32Array = buildSampleArray(
      instrumentSample,
      instrumentSampleRate,
      sampleRate, // includes instrumentSampleRate and playbackRate
      loop,
      loopStart,
      loopEnd,
      delayEnd,
      totalTime,
      pitchValue,
      noiseFrequency,
      noiseAmplitude,
      volumeGain,
      attenuation,
      gen.rn
    );

    sample = applyEnvelope(sample, sampleRate, envelope);

    const aResult: RawSourceData = {
      gen,
      index: sourceCount,
      source: {
        note: pitchValue,
        sample: [sample],
        sampleRate,
        playbackRate,
        startTime: time,
        duration: releaseEnd,
        stopTime: time + releaseEnd,
        started: false,
      },
      panner: {
        value: panValue,
      },
      vol: { value: volumeValue },
      instrument: {
        name,
        sampleRate: instrumentSampleRate,
        sample: instrumentSample,
        loopStart,
        loopEnd,
        loop,
        rootKey,
        pitchCorrection,
        fineTune,
        baseDetune,
        cents,
        delayVolEnv,
        attackVolEnv,
        holdVolEnv,
        decayVolEnv,
        releaseVolEnv,
        sustainVolEnv,
        delayEnd,
        attackEnd,
        holdEnd,
        decayEnd,
        noteEnd,
        interval,
        duration,
        releaseEnd,
        totalTime,
        volumeValue,
        volumeGain,
        noteEndGain,
        sustainGain,
        initialAttenuation: attenuationdB,
        attenuation,
        envelope,
      },
    };
    sourceCount++;
    return aResult;
  });
  return result;
};

// construct the sample array from the original sample and the total time and sample rate
// add zeroes for any delay. Add noise and adsjust the volume
function buildSampleArray(
  instrumentSample: Float32Array,
  instrumentSampleRate: number,
  sampleRate: number,
  looping: boolean,
  loopStart: number,
  loopEnd: number,
  delayEnd: number,
  totalTime: number,
  midi: number,
  noiseFrequency: number,
  noiseAmplitude: number,
  volume: number,
  attenuation: number,
  rn: RandomNumber
): Float32Array {
  const sampleCount: number = Math.ceil(sampleRate * totalTime);
  const result: Float32Array = new Float32Array(sampleCount);
  const deltaT: number = 1 / sampleRate;
  let t: number = 0;
  const instrumentSampleLength: number = instrumentSample.length;
  const delayCount: number = Math.ceil(sampleRate * delayEnd);

  // console.log('signal level', signalLevel);
  // handle sampling where the instrument sample rate is to the final sample rate
  const deltaIndex: number = instrumentSampleRate / sampleRate;
  // console.log('delta index', deltaIndex);
  let currentIndex: number = 0;
  // let iSample = delayCount;
  const lastSample: number = looping ? loopEnd : instrumentSampleLength;
  const centerFrequency: number = midiToFrequency(midi);
  for (let iSample: number = delayCount; iSample < sampleCount; iSample++) {
  // while (iSample < sampleCount) {
    let thisIndex: number = Math.round(currentIndex);

    if (thisIndex < lastSample) {
      // haven't reach the end
      result[iSample] =
        getSampleWithNoise(
          instrumentSample[thisIndex],
          t,
          centerFrequency,
          noiseFrequency,
          noiseAmplitude,
          rn
        ) * volume * 
        attenuation;
      // iSample++;
      t+=deltaT;
    } else if (looping) {
      // handle looping
      if (thisIndex >= lastSample) {
        currentIndex = loopStart;
        thisIndex = loopStart;
      }
      result[iSample] =
        getSampleWithNoise(
          instrumentSample[thisIndex],
          t,
          centerFrequency,
          noiseFrequency,
          noiseAmplitude,
          rn
        ) * volume *
        attenuation;
      // iSample++;
      t+=deltaT;
    } else {
      // signal is zero if not looping
      result[iSample] = 0;
      // iSample++;
      t+=deltaT;
    }

    // increment to next index
    currentIndex += deltaIndex;
    thisIndex = Math.round(currentIndex);
  }

  return result; // an array of size sampleCount to accomodate the entire sound
}

function getSampleWithNoise(
  sample: number,
  t: number,
  frequency: number,
  noiseFrequency: number,
  noiseAmplitude: number,
  rn: RandomNumber
): number {
  let thisSample = sample;
  if (noiseAmplitude != 0 && noiseFrequency != 0) {
    const noise: number = gaussianRandom(0, noiseFrequency, rn);
    thisSample =
      (thisSample + noiseAmplitude * Math.sin(2 * Math.PI * (frequency + noise) * t)) /
      (1 + noiseAmplitude);
  }
  return thisSample;
}

// test : remove envelope and see how things sound
function applyEnvelope(
  sample: Float32Array,
  sampleRate: number,
  envelope: { t: number; g: number }[],
): Float32Array {
  const newSample: Float32Array = new Float32Array(sample.length);
  const deltaT: number = 1 / sampleRate;
  let ti: number = 0;
  let iEnvelope: number = 0;
  const maxI: number = envelope.length - 1;
  const doEnvelope: boolean = false;
  let g: number = 1;
  sample.forEach((s,i) => {
    if (ti >= envelope[iEnvelope].t && iEnvelope < maxI) iEnvelope++;
    if (doEnvelope) {
    g = envelope[iEnvelope].g != envelope[iEnvelope - 1].g? linearInterpolate(
      ti,
      envelope[iEnvelope - 1].t,
      envelope[iEnvelope].t,
      envelope[iEnvelope - 1].g,
      envelope[iEnvelope].g
    ): envelope[iEnvelope].g;
  }
    newSample[i] = s * g;
    ti+=deltaT;
  });
  return newSample;
}