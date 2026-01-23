import Algorithmic from "classes/generators/algorithmic";
import { pantoLeftRight } from "helpers/algorithms/panutils";
import { samplePool } from "sfcomponents/samplepool";
import { Preset } from "sfcomponents/types";
import { attenuate, dBToGain, precision, tc2s } from "sfcomponents/util";
import { RawSourceData } from "types";
import buildEnvelope from "./buildenvelope";
import buildSampleArray from "./buildsample";
import getActiveZones from "./getactivezones";

export const getPresetNote = (
  gen: Algorithmic,
  preset: Preset,
  interval: number, // the note's time interval
  duration: number, // the note's duration with that interval
  pitchValue: number, // pitch
  attack: number,
  generatorVolume: number, // dB
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
      // @ts-expect-error name cannot be found?
      overridingRootKey,
      // @ts-expect-error name cannot be found?
      fineTune = 0,
      // @ts-expect-error name cannot be found?
      startloopAddrsOffset = 0,
      // @ts-expect-error name cannot be found?
      startloopAddrsCoarseOffset = 0,
      // @ts-expect-error name cannot be found?
      endloopAddrsOffset = 0,
      // @ts-expect-error name cannot be found?
      endloopAddrsCoarseOffset = 0,
      // @ts-expect-error name cannot be found?
      delayVolEnv = -12000,
      // @ts-expect-error name cannot be found?
      attackVolEnv = -12000,
      // @ts-expect-error name cannot be found?
      holdVolEnv = -12000,
      // @ts-expect-error name cannot be found?
      decayVolEnv = -12000,
      // @ts-expect-error name cannot be found?
      sustainVolEnv = -12000,
      // @ts-expect-error name cannot be found?
      releaseVolEnv = -12000,
      // @ts-expect-error name cannot be found?
      sampleModes = 0,
      // @ts-expect-error name cannot be found?
      initialAttenuation = 0,
    } = zone.mergedGenerators;

    // get the playback rate
    const rootKey =
      overridingRootKey !== undefined && overridingRootKey !== -1
        ? overridingRootKey
        : originalPitch;
    const baseDetune = 100 * rootKey + pitchCorrection - fineTune;  //sine wave test shows pitch correction to be wrong on the sine wave 
    // const baseDetune = 100 * rootKey - fineTune;
    const cents = pitchValue * 100 - baseDetune - 45;

    // combining the instrument's sampleRate with the playbackRate
    const playbackRate = 1.0 * Math.pow(2, cents / 1200);
    const sampleRate: number = instrumentSampleRate;
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
    } else if (sampleModes == 0) {
      loop = false;
    }

    // get the end times for the amplitude envelope, handling the diabling of the delay/attack phase
    const delayEnd: number = gen.attackEnabled
      ? precision(tc2s(delayVolEnv), 3)
      : 0;
    const attackEnd: number =
      delayEnd + (gen.attackEnabled ? precision(tc2s(attackVolEnv), 3) : 0);
    const holdEnd: number = attackEnd + precision(tc2s(holdVolEnv), 3);
    const decayEnd: number = holdEnd + precision(tc2s(decayVolEnv), 3);
    // this last two number may be less than the others
    // the end of the note may be cutoff if not looping
    const noteEnd: number = loop
      ? duration
      : Math.min(instrumentSample.length / instrumentSampleRate, duration);
    // release is cutoff if this is a staccatto or the sample is not looping
    const releaseEnd: number =
      loop && Math.abs(duration - interval) < 0.0001
        ? noteEnd + precision(tc2s(releaseVolEnv), 3)
        : noteEnd;
    const totalTime: number = releaseEnd;

    const volumeGain: number = dBToGain(generatorVolume);
    const volumeValue: number = generatorVolume;
    const attenuationdB: number = initialAttenuation / 10;
    //TODO never could get soundofnt attenutation to work properly
    // const attenuation: number = attenuate(1.0, attenuationdB);
    const attenuation: number = 1;
    const sustainGain: number = attenuate(
      volumeGain * attenuation,
      sustainVolEnv / 10
    );

    // build the gain envelope
    const { envelope, noteEndGain } = buildEnvelope(
      delayEnd,
      attackEnd,
      holdEnd,
      decayEnd,
      noteEnd,
      releaseEnd,
      volumeGain,
      sustainGain,
      attenuation
    );

    // build the sample using resampling
    const sample: Float32Array = buildSampleArray(
      time,
      gen,
      pitchValue,
      instrumentSample,
      sampleRate,
      cents,
      loop,
      loopStart,
      loopEnd,
      totalTime,
      volumeGain,
      envelope,
      attenuation
    );

    // apply pan to the sample
    const { left, right } = pantoLeftRight(panValue);
    const panSample:Float32Array[] = [new Float32Array(sample), new Float32Array(sample)];
    for (let i = 0; i < sample.length; i++) {
      panSample[0][i] = panSample[0][i] * left;
      panSample[1][i] = panSample[1][i] * right;
    }

    const aResult: RawSourceData = {
      gen,
      index: sourceCount,
      source: {
        note: pitchValue,
        sample: panSample,
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
        attackEnabled: gen.attackEnabled,
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
