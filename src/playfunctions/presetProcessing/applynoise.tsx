import RandomNumber from "classes/randomnumber";
import { gaussianRandom } from "utils/gaussianrandom";

export default function applyNoise(
  sample: Float32Array,
  sampleRate: number,
  centerFrequency: number,
  frequency: number,
  amplitude: number,
  rn: RandomNumber
): Float32Array {
  const newSample: Float32Array = new Float32Array(sample.length);
  const deltaT: number = 1 / sampleRate;
  let t: number = 0;
  for (let i = 0; i < sample.length; i++) {
    newSample[i] = getSampleWithNoise(
      sample[i],
      t,
      centerFrequency,
      frequency,
      amplitude,
      rn
    );
    t += deltaT;
  }
  return newSample;
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
      (thisSample +
        noiseAmplitude * Math.sin(2 * Math.PI * (frequency + noise) * t)) /
      (1 + noiseAmplitude);
  }
  return thisSample;
}

