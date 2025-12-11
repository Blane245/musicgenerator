import { sineModulator } from "modulators";
import { midiToFrequency } from "sfcomponents/util";
import { SAMPLERATE } from "types";
import { linearInterpolate } from "utils/interpolation";

// generate a sine wave sample at pitch1 that runs for duration seconds
// if pitch2 is specified and not pitch1, the sample is resampled to 
// create a glissando from pitch1 to pitch2 over the duration
export default function elementSample (props:{pitch1: number, pitch2: number, duration: number}): number[] {
    const {pitch1, pitch2, duration} = props;
        const sampleCount = SAMPLERATE * duration;
        const buffer: number[] = Array(sampleCount);
        const frequency1: number = midiToFrequency(pitch1) * 1000;
        const amplitude: number = 1;
        const phase: number = 0;
        let t = 0;
        const deltaT: number = 1/ SAMPLERATE;
        for (let i = 0; i < sampleCount; i++) {
            buffer[i] = sineModulator(t, 0, frequency1, amplitude, phase);
            t+=deltaT;
        }
    if (pitch2 == pitch1) return buffer;
    
  // resample the sample using a linearly changing frequency
  let frequency: number = frequency1;
  const frequency2: number = midiToFrequency(pitch2) * 1000;
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