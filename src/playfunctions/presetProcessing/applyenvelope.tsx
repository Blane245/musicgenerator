import { GainEnvelope } from "types";
import { linearInterpolate } from "utils/interpolation";

// test : remove envelope and see how things sound
export function applyEnvelope(
  sample: Float32Array,
  sampleRate: number,
  envelope: GainEnvelope,
): Float32Array {
  const newSample: Float32Array = new Float32Array(sample.length);
  const deltaT: number = 1 / sampleRate;
  let ti: number = 0;
  let iEnvelope: number = 0;
  const maxI: number = envelope.length - 1;
  let g: number = 1;
  for (let i = 0; i < sample.length; i++) {
    if (ti >= envelope[iEnvelope].t && iEnvelope < maxI) iEnvelope++;
    g =
      envelope[iEnvelope].g != envelope[iEnvelope - 1].g
        ? linearInterpolate(
            ti,
            envelope[iEnvelope - 1].t,
            envelope[iEnvelope].t,
            envelope[iEnvelope - 1].g,
            envelope[iEnvelope].g
          )
        : envelope[iEnvelope].g;
    newSample[i] = sample[i] * g;
    ti += deltaT;
  }
  return newSample;
}
