import { sineModulator } from "modulators";
import { midiToFrequency } from "sfcomponents/util";
import { SAMPLERATE } from "types";
import { linearInterpolate } from "utils/interpolation";

// create a glissando sound sample starting at pitch1 (midi) and ending a pitch2 (midi)
// for a specific duration (sec)
export default function glissandoSample(
  pitch1: number,
  pitch2: number,
  duration: number
): number[] {
  
  // construct the sample at pitch1 that is long enough to resample at pitch2
  const sampleCount = Math.ceil(SAMPLERATE * duration);
  const frequency1: number = midiToFrequency(pitch1) * 1000;
  const frequency2: number = midiToFrequency(pitch2) * 1000;
  const bufferCount = Math.ceil(sampleCount * Math.max(frequency1, frequency2) / Math.min(frequency1, frequency2));
  console.log('freqs counts', frequency1, frequency2, bufferCount, sampleCount);
  const buffer: number[] = Array(bufferCount);
  const amplitude: number = 1;
  const phase: number = 0;
  let t = 0;
  const deltaT: number = 1 / SAMPLERATE;
  for (let i = 0; i < bufferCount; i++) {
    buffer[i] = sineModulator(t, 0, frequency1, amplitude, phase);
    t += deltaT;
  }
  console.log('initial buffer', buffer);

  // resample the sample using a linearly changing frequency
  let frequency: number = frequency1;
  const slope: number = (frequency2 - frequency1) / duration;
  t = 0;
  let currentIndex: number = 0;
  const sample: number[] = Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    let thisIndex: number = Math.trunc(currentIndex);
    const value: number = linearInterpolate(
      currentIndex,
      thisIndex,
      thisIndex + 1,
      buffer[thisIndex],
      buffer[thisIndex + 1]
    );
    sample[i] = value;
    frequency += slope * deltaT;
    currentIndex += frequency / frequency1;
    t += deltaT;
  }
  return sample;
}