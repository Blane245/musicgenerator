import Algorithmic from "classes/generators/algorithmic";
import { dBToGain, midiToFrequency } from "sfcomponents/util";
import { GainEnvelope, SAMPLERATE } from "types";
import { linearInterpolate } from "utils/interpolation";
import { getSampleWithNoise } from "./applynoise";
import { debug } from "utils/debug";

export default function buildSampleArray(
  sampleStartTime: number,
  generator: Algorithmic,
  pitchValue: number,
  inputSample: Float32Array,
  inputRate: number,
  inputCents: number,
  looping: boolean,
  loopStart: number,
  loopEnd: number,
  totalTime: number,
  volumeGain: number,
  envelope: GainEnvelope,
  attenuation: number
): Float32Array {
  debug.info("buildSample: building sample with envelope", envelope);
  const basePlaybackRate = 1.0 * Math.pow(2, (inputCents) / 1200) * SAMPLERATE / inputRate;
  const inputCount: number = Math.ceil(inputRate * totalTime);
  const result: Float32Array = new Float32Array(inputCount);
  const deltaT: number = 1 / inputRate; // time spacing between input samples
  let currentIndex: number = 0;
  const lastSample: number = looping ? loopEnd : inputCount;
  let t: number = 0;
  let iEnvelope: number = 0;
  const maxEnvelope: number = envelope.length - 1;
  let envelopeGain: number = 1.0;
  for (let iSample: number = 0; iSample < inputCount; iSample++) {
    let thisIndex: number = Math.trunc(currentIndex);

    if (looping && thisIndex >= lastSample - 1) {
      currentIndex = loopStart;
      thisIndex = loopStart;
    }

    // get the sample value by interpolation
    let value: number = 0;
    if (!looping && thisIndex >= lastSample - 1) {
      value = 0;
    } else {
      value = linearInterpolate(
        currentIndex,
        thisIndex,
        thisIndex + 1,
        inputSample[thisIndex],
        inputSample[thisIndex + 1]
      );
    }

    // first apply noise
    if (
      generator.noiseEnabled &&
      generator.noiseFrequency != 0
    ) {
      value = getSampleWithNoise(
        value,
        t,
        midiToFrequency(pitchValue),
        generator.noiseFrequency,
        dBToGain(generator.noiseAmplitude),
        generator.rn
      );
    }

    // apply the envelope
    if (t >= envelope[iEnvelope].t && iEnvelope < maxEnvelope) iEnvelope++;
    envelopeGain =
      envelope[iEnvelope].g != envelope[iEnvelope - 1].g
        ? linearInterpolate(
            t,
            envelope[iEnvelope - 1].t,
            envelope[iEnvelope].t,
            envelope[iEnvelope - 1].g,
            envelope[iEnvelope].g
          )
        : envelope[iEnvelope].g;
    value *= envelopeGain;

    // apply the generator volume, track volume, and instrument attenuation
    value *= 
        volumeGain *
        attenuation *
        dBToGain(generator.parent.volume);

    // apply tremolo
    if (
      generator.tremoloEnabled &&
      generator.tremolo.values.depth != 0 &&
      generator.tremolo.values.speed != 0
    ) {
      const tremoloGain: number = dBToGain(
        generator.tremolo.getCurrentValue(t)
      );
      value *= tremoloGain;
    }
    result[iSample] = value;

    // increment to next sample index and time, modifying the playback rate with the vibrato if present
    if (
      !generator.vibratoEnabled ||
      generator.vibrato.values.depth == 0 ||
      generator.vibrato.values.speed == 0
    )
      currentIndex += basePlaybackRate;
    else {
      const newCents: number =
        inputCents + generator.vibrato.getCurrentValue(t, 0);
      const playbackRate: number = 1.0 * Math.pow(2, newCents / 1200);
      currentIndex += playbackRate;
    }
    t += deltaT;
  }
  return new Float32Array(result); // an array of size sampleCount to accomodate the entire sound
}
