import RandomNumber from "classes/randomnumber";
import { gaussianRandom } from "utils/probability/gaussianrandom";

export function getSampleWithNoise(
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

