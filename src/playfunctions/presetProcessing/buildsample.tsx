// the sample array contains the instrument samples resampled at the playbackrate with the looping option applied
// the playback rate is modulated by the vibrato effect as applied to the pitch cents.
// when vibrato is present the size of the sample array is not know until it is complete built.
// TODO the current implementation does not include vibrato
// construct the sample array from the original sample and the total time and sample rate

import Tremelo from "classes/algorithms/tremelo";
import { linearInterpolate } from "utils/interpolation";

// add zeroes for any delay. Add noise and adsjust the volume
export default function buildSampleArray(
  inputSample: Float32Array,
  inputRate: number,
  inputCents: number,
  looping: boolean,
  loopStart: number,
  loopEnd: number,
  totalTime: number,
  volumeGain: number,
  attenuation: number,
  vibrato: Tremelo
): Float32Array {
  const basePlaybackRate = 1.0 * Math.pow(2, inputCents / 1200);
  const inputCount: number = Math.ceil(inputRate * totalTime);
  const result: Float32Array = new Float32Array(inputCount);
  const deltaT: number = 1 / inputRate; // time spacing between input samples
  let currentIndex: number = 0;
  const lastSample: number = looping ? loopEnd : inputCount;
  let t: number = 0;
  for (let iSample: number = 0; iSample < inputCount; iSample++) {
    let thisIndex: number = Math.trunc(currentIndex);

    if (looping && thisIndex >= lastSample - 1) {
      currentIndex = loopStart;
      thisIndex = loopStart;
    }
    if (!looping && thisIndex >= lastSample - 1) {
      result[iSample] = inputSample[lastSample - 1] * volumeGain * attenuation;
    } else {
      if (isFinite(inputSample[thisIndex])) {
        const value: number = linearInterpolate(
          currentIndex,
          thisIndex,
          thisIndex + 1,
          inputSample[thisIndex],
          inputSample[thisIndex + 1]
        );
        result[iSample] = value * volumeGain * attenuation;
      } else {
        if (iSample == 0) result[iSample] = 0;
        else result[iSample - 1]* volumeGain * attenuation;
      }
    }

    // increment to next sample index and time, modifying the playback rate with the vibrato if present
    if (vibrato.values.depth == 0 || vibrato.values.speed == 0)
      currentIndex += basePlaybackRate;
    else {
      const newCents: number = inputCents + vibrato.getCurrentValue(t, 0);
      const playbackRate: number = 1.0 * Math.pow(2, newCents / 1200);
      currentIndex += playbackRate;
    }
    t += deltaT;
  }
  return new Float32Array(result); // an array of size sampleCount to accomodate the entire sound
}
