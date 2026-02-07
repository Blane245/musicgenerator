import RandomNumber from "classes/randomnumber";
import { samplePool } from "sfcomponents/samplepool";
import { Preset } from "sfcomponents/types";
import {
  attenuate,
  dBToGain,
  midiToFrequency,
  precision,
  tc2s
} from "sfcomponents/util";
import { EPS, SAMPLERATE } from "types";
import { linearInterpolate, resampleAudio } from "utils/interpolation";
import { getSampleWithNoise } from "./applynoise";
import buildEnvelope from "./buildenvelope";
import getActiveZones from "./getactivezones";

interface GetPresetNoteProps {
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

/**
 * Generates a preset note with resampling, envelopes, and effects
 * @param preset - The soundfont preset to use
 * @param isLooping? - Optional override to instrument's loop setting. True if omitted
 * @param pitch - MIDI pitch value or glissando range {startPitch, endPitch}
 * @param interval - Note interval in seconds
 * @param duration - Length of note (<=interval) sample within the interval
 * @param attackEnabled - Option flag to enable the attack phase of the envelope (true if omitted)
 * @param velocity - MIDI velocity (0-127)
 * @param volume - Volume level in dB
 * @param vibrato - Optional Vibrato modulation object with getCurrentValue(t) method
 * @param tremolo - Optional Tremolo modulation object with getCurrentValue(t) method
 * @param noise - Optional noise specification
 * @returns Generated audio sample as Float32Array
 */
export const getPresetNote = ({
  preset,
  isLooping,
  pitch,
  interval,
  duration,
  attackEnabled,
  velocity,
  volume,
  vibrato,
  tremolo,
  noise,
}: GetPresetNoteProps): Float32Array => {
  attackEnabled = attackEnabled != undefined ? attackEnabled : true;
  const glissandoStart: number =
    typeof pitch === "object" ? pitch.startPitch : pitch;
  const glissandoEnd: number =
    typeof pitch === "object" ? pitch.endPitch : pitch;
  const volumeGain: number = dBToGain(volume);
  const result: Float32Array = new Float32Array(SAMPLERATE * duration).fill(0);

  // get all of the instruments for the preset and merge their samples into
  // a single array
  const zones = getActiveZones(preset, Math.round(glissandoStart), velocity);
  zones.map((zone) => {
    // get the instrument's sample
    const { sample: inputSample, header } = samplePool(zone.sample);

    // get the preset merged generator attributes
    const {
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

    const instrumentSample = resampleAudio(
      inputSample,
      inputRate,
      SAMPLERATE,
      duration,
      glissandoCents,
      looping,
      vibrato,
    );

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

    // apply the optional noise, required envelope, and optional tremolo
    let envelopeGain: number = 1.0;
    let iEnvelope: number = 0;
    const maxEnvelope: number = envelope.length - 1;

    for (let i = 0; i < instrumentSample.length; i++) {
      const t: number = i / SAMPLERATE;

      // apply noise
      if (noise != undefined && noise.enabled && noise.frequency != 0) {
        instrumentSample[i] = getSampleWithNoise(
          instrumentSample[i],
          t,
          midiToFrequency(glissandoStart),
          noise.frequency,
          dBToGain(noise.amplitude),
          noise.rn,
        );
      }

      // apply envelope
      if (t >= envelope[iEnvelope].t && iEnvelope < maxEnvelope) iEnvelope++;
      envelopeGain = linearInterpolate(
        t,
        envelope[iEnvelope - 1].t,
        envelope[iEnvelope].t,
        envelope[iEnvelope - 1].g,
        envelope[iEnvelope].g,
      );
      instrumentSample[i] *= envelopeGain;

      // apply tremolo
      if (tremolo != undefined) {
        const tremoloGain: number = dBToGain(tremolo.getCurrentValue(t));
        instrumentSample[i] *= tremoloGain;
      }
    }

    // add this sample to the total
    for (let i = 0; i < instrumentSample.length; i++) {
      result[i] += instrumentSample[i];
    }
  });

  return result;
};
