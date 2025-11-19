import CMGFile from "classes/cmgfile";
import Algorithmic from "classes/generators/algorithmic";
import Track from "classes/track";
import { samplePool } from "sfcomponents/samplepool";
import { Preset } from "sfcomponents/types";
import {
  attenuate,
  dBToGain,
  midiToFrequency,
  precision,
  tc2s,
} from "sfcomponents/util";
import { RawSourceData } from "types";
import findGeneratorParent from "utils/findgeneratorparent";
import { applyEnvelope } from "./applyenvelope";
import applyNoise from "./applynoise";
import buildEnvelope from "./buildenvelope";
import buildSampleArray from "./buildsample";
import getActiveZones from "./getactivezones";

export const getPresetNote = (
  fileContents: CMGFile,
  gen: Algorithmic,
  preset: Preset,
  noiseFrequency: number,
  noiseAmplitude: number, // in dB
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
    const track: Track | null = findGeneratorParent(gen.name, fileContents);
    const volumeValue: number = track
      ? generatorVolume + track.volume
      : generatorVolume;
    const volumeGain: number = dBToGain(volumeValue);
    let attenuationdB: number = initialAttenuation / 10;
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
      attenuation,
      gen.tremolo,
    );

    // build the sample using resampling
    let sample: Float32Array = buildSampleArray(
      instrumentSample,
      sampleRate,
      cents,
      loop,
      loopStart,
      loopEnd,
      totalTime,
      volumeGain,
      attenuation,
      gen.vibrato
    );

    // apply any noise is present
    if (noiseFrequency != 0)
      sample = applyNoise(
        sample,
        sampleRate,
        midiToFrequency(pitchValue),
        noiseFrequency,
        dBToGain(noiseAmplitude),
        gen.rn
      );

      // modify the sample using the gain envelope
    sample = applyEnvelope(sample, sampleRate, envelope);

    const aResult: RawSourceData = {
      gen,
      index: sourceCount,
      source: {
        note: pitchValue,
        sample: [sample, sample],
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
