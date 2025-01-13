// maintain a sf sample pool to minimize the about of memory needed
// to realize the sounds.

import { Sample, SampleHeader } from "./types";
const pool: { sample: Float32Array; header: SampleHeader }[] = [];
export function samplePool(desiredSample: Sample): {
  sample: Float32Array;
  header: SampleHeader;
} {
  const { header, data } = desiredSample;
  const index = pool.findIndex((s) => s.header.name == header.name);

  // if the sample is in the pool, return the converted sample
  if (index >= 0) {
    const item = pool[index];
    return item;
  } else {
    // if the sample is not in the pool, convert it, store it, and return
    const fl: Float32Array = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      fl[i] = data[i] / 32768;
    }
    const item = {
      sample: fl,
      header,
    };
    pool.push(item);
    return item;
  }
}
