import RandomNumber from "classes/randomnumber";
// import { samplePool } from "sfcomponents/samplepool";
import { Preset } from "sfcomponents/types";
import { attenuate, dBToGain, precision, tc2s } from "sfcomponents/util";
import { EPS, ReportInstrument, ReportSourceData } from "types";
import getActiveZones from "./getactivezones";
import buildEnvelope from "./buildenvelope";

interface GetPresetReportProps {
  generatorName: string;
  startTime: number;
  stopTime: number;
  soundFontName: string;
  presetName: string;
  preset: Preset;
  isLooping?: boolean;
  pitch: number | { startPitch: number; endPitch: number };
  interval: number;
  duration: number;
  attackEnabled?: boolean;
  velocity: number;
  volume: number;
  vibrato?: { getCurrentValue(t: number): number };
  tremolo?: { getCurrentValue(t: number): number };
  noise?: {
    enabled: boolean;
    frequency: number;
    amplitude: number;
    rn: RandomNumber;
  };
}

export const getPresetReport = ({
  generatorName,
  startTime,
  stopTime,
  soundFontName,
  presetName,
  preset,
  isLooping,
  pitch,
  interval,
  duration,
  attackEnabled,
  velocity,
  volume,
}: GetPresetReportProps): ReportSourceData => {
  attackEnabled = attackEnabled != undefined ? attackEnabled : true;
  const glissandoStart: number =
    typeof pitch === "object" ? pitch.startPitch : pitch;
  const glissandoEnd: number =
    typeof pitch === "object" ? pitch.endPitch : pitch;
  const volumeGain: number = dBToGain(volume);

  // get all of the instruments for the preset and merge their samples into
  // a single array
  const zones = getActiveZones(preset, Math.round(glissandoStart), velocity);
  const instrument: ReportInstrument[] = [];
  zones.map((zone) => {
    // get the instrument's sample
    // const { sample: inputSample, header } = samplePool(soundFontName, zone.sample);
    const sample = zone.sample.data;
    const header = zone.sample.header;
    const inputSample: Float32Array = new Float32Array(sample.length);
    for (let i = 0; i < sample.length; i++) inputSample[i] = sample[i]/ 32768;

    // get the preset merged generator attributes
    const {
      name: instrumentName,
      startLoop,
      endLoop,
      originalPitch,
      pitchCorrection,
      sampleRate: inputRate,
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
      // @ts-expect-error name cannot be found?
      CoarseTune = 0,
      // @ts-expect-error name cannot be found?
      ScaleTuning = 100,
    } = zone.mergedGenerators;

    // get the start and end cents
    const rootKey =
      overridingRootKey !== undefined && overridingRootKey !== -1
        ? overridingRootKey
        : originalPitch;
    const baseDetune = 100 * rootKey - pitchCorrection - fineTune;

    // get the cents for the starting and ending pitch
    // NOTE: the ending pitch may be out of tune if the glissando is
    // far from the starting one since the zones are based on the starting pitch
    // the alternative is to use a pitch half way between the two.
    const glissandoCents = {
      startCents: glissandoStart * 100 - baseDetune,
      endCents: glissandoEnd * 100 - baseDetune,
    };
    // console.log(`${toNote(glissandoStart)}zone generators:`, zone.mergedGenerators);
    // get the sample looping parameters and override looping if requested
    let loopStart: number = 0;
    let loopEnd: number = 0;
    let loop = false;
    if (sampleModes == 1) {
      loopStart =
        startLoop + startloopAddrsOffset + startloopAddrsCoarseOffset * 32768;
      loopEnd = endLoop + endloopAddrsOffset + endloopAddrsCoarseOffset * 32768;
      // optionally override the sample's loop setting
      loop = isLooping != undefined ? isLooping : true;
    } else if (sampleModes == 0) {
      loop = false;
    }
    const looping = { enabled: loop, start: loopStart, end: loopEnd };

    // get the end times for the amplitude envelope,
    // handling the disabling of the delay/attack phase
    const delayEnd: number = attackEnabled
      ? precision(tc2s(delayVolEnv), 3)
      : 0;
    const attackEnd: number =
      delayEnd + (attackEnabled ? precision(tc2s(attackVolEnv), 3) : 0);
    const holdEnd: number = attackEnd + precision(tc2s(holdVolEnv), 3);
    const decayEnd: number = holdEnd + precision(tc2s(decayVolEnv), 3);
    // this last two number may be less than the others
    // the end of the note may be cutoff if not looping
    const noteEnd: number = duration;
    // release is cutoff if this is a staccatto or the sample is not looping
    const releaseEnd: number =
      Math.abs(duration - interval) < EPS
        ? noteEnd + precision(tc2s(releaseVolEnv), 3)
        : noteEnd;

    //TODO never could get soundfont attenutation to work properly
    // const attenuation: number = attenuate(1.0, attenuationdB);
    const attenuation: number = 1;
    const sustainGain: number = attenuate(
      volumeGain * attenuation,
      sustainVolEnv / 10,
    );
    // build the gain envelope
    const { envelope } = buildEnvelope(
      delayEnd,
      attackEnd,
      holdEnd,
      decayEnd,
      noteEnd,
      releaseEnd,
      volumeGain,
      sustainGain,
      attenuation,
    );

    instrument.push({
      name: instrumentName,
      loopEnabled: looping.enabled,
      loopStart: looping.start,
      loopEnd: looping.end,
      rootKey,
      sampleRate: inputRate,
      sampleCount: inputSample.length,
      attackEnabled,
      startCents: glissandoCents.startCents,
      endCents: glissandoCents.endCents,
      envelope,
    });
  });

  return {
    generatorName,
    startTime,
    stopTime,
    soundFontName,
    presetName,
    startPitch: glissandoStart,
    endPitch: glissandoEnd,
    instrument,
  };
};
