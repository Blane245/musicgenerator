import RandomNumber from "classes/randomnumber";
import { Algorithmic } from "../classes/generators";
import { RawSourceData } from "../types";
import { gaussianRandom } from "../utils/gaussianrandom";
import { getGeneratorValues } from "./generators";
import { samplePool } from "./samplepool";
import { InstrumentZone, Preset, PresetZone } from "./types";
import { attenuate, dBToGain, precision, tc2s } from "./util";

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
  gen: Algorithmic,
  preset: Preset,
  noiseAmplitude: number,
  noiseDispersion: number,
  interval: number, // the note's time interval
  duration: number, // the note's duration with that interval
  pitchValue: number,
  velocity: number,
  volumeValue: number,
  panValue: number,
  time: number,
  nextSource: number
): RawSourceData[] => {
  let sourceCount: number = nextSource;
  const zones = getActiveZones(preset, Math.round(pitchValue), velocity);
  const result: RawSourceData[] = zones.map((zone) => {
    // get the sample
    const { sample, header } = samplePool(zone.sample);

    // get the preset merged generator attributes
    const {
      name,
      startLoop,
      endLoop,
      originalPitch,
      pitchCorrection,
      sampleRate,
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
    const cents = pitchValue * 100 - baseDetune;
    const playbackRate = 1.0 * Math.pow(2, cents / 1200);

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
    const { delayEnd, attackEnd, holdEnd, decayEnd, noteEnd, releaseEnd } =
      setEndTimes(
        delayVolEnv,
        attackVolEnv,
        holdVolEnv,
        decayVolEnv,
        duration,
        releaseVolEnv,
        duration != interval
      );

    // determine the total time of the sample
    const totalTime: number = findTotalTime(
      delayEnd,
      attackEnd,
      holdEnd,
      decayEnd,
      duration,
      releaseEnd,
      loop,
      sample,
      sampleRate
    );
    // build the sample
    const volumeGain: number = dBToGain(volumeValue);
    // const attenuation: number = attenuate(1.0, initialAttenuation / 10);
    //TODO for now, don't handle attenuation. Getting bad values from the zones for index 48
    const attenuation: number = 1.0;
    const thisSample: Float32Array = buildSampleArray(
      sample,
      sampleRate,
      loop,
      loopStart,
      loopEnd,
      delayEnd,
      totalTime,
      noiseAmplitude,
      noiseDispersion,
      volumeGain,
      gen.rn
    );

    // apply the amplitude envelope to the sample
    const sustainGain: number =
      attenuate(volumeGain, sustainVolEnv / 10);
    // console.log(`envelope for generator ${gen.name} tone ${pitchValue}:
    //    delay ${delayEnd} attack ${attackEnd} hold ${holdEnd} decay ${decayEnd}, note ${noteEnd}, release ${releaseEnd}
    //    time ${totalTime}
    //    volume ${volumeGain}
    //    sustain ${sustainGain}
    //    sample length ${thisSample.length}
    //    sample rate ${sampleRate}
    //    `);

    const noteEndGain: number = applyEnvelope(
      thisSample,
      sampleRate,
      delayEnd,
      attackEnd,
      holdEnd,
      decayEnd,
      noteEnd,
      releaseEnd,
      sustainGain,
      attenuation,
    );

    const aResult: RawSourceData = {
      gen,
      index: sourceCount,
      source: {
        note: pitchValue,
        sample: [thisSample],
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
        attenuation,
      },
    };
    sourceCount++;
    return aResult;
  });
  return result;
};

// determine the total time of the sample from the amplitude envelope and the
// duration. This routine assumes decayEnd <= attackEnd <= holdEnd <= decayEnd
// if the sample is not looping, then truncate the time to the end of the sample
function findTotalTime(
  delayEnd: number,
  attackEnd: number,
  holdEnd: number,
  decayEnd: number,
  duration: number,
  releaseEnd: number,
  looping: boolean,
  sample: Float32Array,
  sampleRate: number
): number {
  const sampleDuration: number = looping
    ? Number.MAX_VALUE
    : sample.length / sampleRate;
  const thisDuration: number = Math.min(duration, sampleDuration);
  // if (decayEnd <= thisDuration && holdEnd != decayEnd) return decayEnd; // signal goes to zero before note duration
  // if (delayEnd > thisDuration) return duration;
  return releaseEnd;
}

// set the end time for each part of the amplitude curve. Truncate release on an early end (stacatto)
function setEndTimes(
  delayVolEnv: number,
  attackVolEnv: number,
  holdVolEnv: number,
  decayVolEnv: number,
  duration: number,
  releaseVolEnd: number,
  earlyEnd: boolean
): {
  delayEnd: number;
  attackEnd: number;
  holdEnd: number;
  decayEnd: number;
  noteEnd: number;
  releaseEnd: number;
} {
  // delayEnd, attackEnd, holdEnd, and decayEnd are monitonically non-decreasing
  const delayEnd: number = precision(tc2s(delayVolEnv), 3);
  const attackEnd: number = delayEnd + precision(tc2s(attackVolEnv), 3);
  const holdEnd: number = attackEnd + precision(tc2s(holdVolEnv), 3);
  const decayEnd: number = holdEnd + precision(tc2s(decayVolEnv), 3);
  // this last two number may be less than the others
  const noteEnd: number = duration;
  const releaseEnd: number = earlyEnd
    ? duration
    : duration + precision(tc2s(releaseVolEnd), 3);
  return { delayEnd, attackEnd, holdEnd, decayEnd, noteEnd, releaseEnd };
}

// construct the sample array from the original sample and the total time and sample rate
// add zeroes for any delay. Add noise and adsjust the volume
function buildSampleArray(
  sample: Float32Array,
  sampleRate: number,
  looping: boolean,
  loopStart: number,
  loopEnd: number,
  delayEnd: number,
  totalTime: number,
  noiseAmplitude: number,
  noiseDispersion: number,
  volume: number,
  rn: RandomNumber
): Float32Array {
  const sampleCount: number = Math.ceil(sampleRate * totalTime);
  const result: Float32Array = new Float32Array(sampleCount);
  const sampleLength: number = sample.length;
  const delayCount: number = Math.ceil(sampleRate * delayEnd);

  // get the signal level to balance with noise
  let signalLevel: number = 0;
  if (noiseDispersion != 0 && noiseAmplitude != 0)
    sample.forEach((s) => {
      signalLevel = Math.max(Math.abs(s), 0);
    });
  // copy the initial part of the sample without looping with delay
  // apply volume and noise
  let iSample = delayCount;
  const lastSample: number = looping? loopEnd: sampleLength;
  for (let i = 0; i < lastSample && iSample < sampleCount; i++) {
    const thisSample = getSampleWithNoise(
      sample[i],
      signalLevel,
      volume,
      noiseAmplitude,
      noiseDispersion,
      rn
    );
    result[iSample] = thisSample;
    iSample++;
  }
  // add any looping, if necessary
  if (looping) {
    while (iSample < sampleCount) {
      for (let i = loopStart; i < loopEnd && iSample < sampleCount; i++) {
        const thisSample = getSampleWithNoise(
          sample[i],
          signalLevel,
          volume,
          noiseAmplitude,
          noiseDispersion,
          rn
        );
        result[iSample] = thisSample;
        iSample++;
      }
    }
  }
  return result; // an array of size sampleCount to accomodate the entire sound
}

function getSampleWithNoise(
  sample: number,
  signalLevel: number,
  volume: number,
  noiseAmplitude: number,
  noiseDispersion: number,
  rn: RandomNumber
): number {
  let thisSample = sample;
  if (noiseAmplitude == 0 || noiseDispersion == 0) {
    thisSample = thisSample * volume;
  } else {
    const noise: number = gaussianRandom(0, noiseDispersion, rn);
    thisSample =
      (volume * (signalLevel * thisSample + noiseAmplitude * noise)) /
      (signalLevel + noiseAmplitude);
  }
  return thisSample;
}

// apply the amplitude envelope to the sample in place
function applyEnvelope(
  sample: Float32Array,
  sampleRate: number,
  delayEnd: number,
  attackEnd: number,
  holdEnd: number,
  decayEnd: number,
  noteEnd: number,
  releaseEnd: number,
  sustainGain: number,
  attenuation: number
): number {
  // loop through each sample point, find its time, and apply the envelope
  console.log('sustainGain in applyEnvelope', sustainGain);
  const deltaT = 1 / sampleRate;
  let data:string= "";
  let noteEndGain: number = 0; // the gain of the envelope when the duration of the note is reached and release is performed
  sample.forEach((s, i) => {
    const ti = i * deltaT;
    if (ti < delayEnd) {
      // sample has a level of 0
      s = 0;
      noteEndGain = 0;
    }
    else if (ti < noteEnd) {
      // in note proper
      if (ti < attackEnd && attackEnd != delayEnd) {
        // ramp from 0 to 1
        const thisGain: number =
          ((1.0 * (ti - delayEnd)) / (attackEnd - delayEnd)) * attenuation;
        s = s * thisGain;
        noteEndGain = thisGain;
      } else if (ti < holdEnd) {
        // sample has a gain of 1.
        noteEndGain = 1.0 * attenuation;
        s = s * attenuation;
      } else if (ti < decayEnd && holdEnd != decayEnd) {
        // from 1 to sustainGain
        const thisGain: number =
          (1.0 + ((sustainGain - 1) * (ti - holdEnd)) / (decayEnd - holdEnd)) *
          attenuation;
        s = s * thisGain;
        noteEndGain = thisGain;
      } else s = s * sustainGain * attenuation;
    } else {
      if (ti < releaseEnd && releaseEnd != noteEnd) {
        // ramp from noteEndGain to 0
        const thisGain: number =
          noteEndGain * (1.0 - (ti - noteEnd) / (releaseEnd - noteEnd)) * attenuation;
        s = s * thisGain;
        // console.log('release at', ti, 'gain is ', thisGain, 'sample is', s);
      } else {
        s = 0;
        //  console.log('sample is zero at ', i, ti);
      }
    }
    // data+=(i*deltaT).toString()+','+s.toString()+';'
  });
  return noteEndGain;
}
