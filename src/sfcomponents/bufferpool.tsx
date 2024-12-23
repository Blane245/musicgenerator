// maintain a sf sample buffer pool to minimize the about of memory needed
// to realize the sounds.

import { Sample } from "./types";
const pool: { name: string; data: AudioBuffer }[] = [];
export function bufferPool(ctx: AudioContext | OfflineAudioContext, desiredSample: Sample): AudioBuffer {
  const { header, data } = desiredSample;
  const index = pool.findIndex(
    (s: {name: string}) => s.name == header.name
  );

  // if the sample is in the pool, return the converted sample
  if (index >= 0) {
    return pool[index].data;
  } else {

    // if the sample is not in the pool, convert it, store it, and return
    const fl: Float32Array = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      fl[i] = data[i] / 32768;
    }
    const buffer: AudioBuffer = ctx.createBuffer (1, fl.length, header.sampleRate);
    const channelData: Float32Array = buffer.getChannelData(0);
    channelData.set(fl);
    pool.push({ name: header.name, data: buffer});
    return buffer;
  }
}
