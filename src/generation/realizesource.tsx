// create a source/gain/pan set from the raw source data and

import { ActiveSource, RawSourceData } from "../types";

// convert volume setting to gain
// volume of 10 has a unity gain
const v2g = (v: number): number => {
  return Math.max(Math.pow(2, v - 10), 0.001);
}
// connect it to the destination
export function realizeSource(
  ctx: AudioContext | OfflineAudioContext,
  RawSourceData: RawSourceData,
  sourceIndex: number,
  destination: AudioNode
): ActiveSource {
  // build source
  const source: AudioBufferSourceNode = ctx.createBufferSource();
  source.buffer = ctx.createBuffer(
    1,
    RawSourceData.source.sample.length,
    RawSourceData.source.sampleRate
  );
  const cD: Float32Array = source.buffer.getChannelData(0);
  cD.set(RawSourceData.source.sample);
  source.loopStart =
    RawSourceData.source.loopStart / RawSourceData.source.sampleRate;
  source.loopEnd =
    RawSourceData.source.loopEnd / RawSourceData.source.sampleRate;
  source.loop = RawSourceData.source.loop;
  source.playbackRate.value = RawSourceData.source.playbackRate;
//   console.log(RawSourceData.source);
  // build gain
  const vol: GainNode = ctx.createGain();
  const min = 0.001;
  const max: number = v2g(RawSourceData.vol.value);
  const t0: number = RawSourceData.source.startTime;
  const t1: number = RawSourceData.vol.attackInterval + t0;
  const t2: number = RawSourceData.vol.holdInterval + t1;
  const t3: number = RawSourceData.vol.releaseInterval + t2;

  vol.gain.setValueAtTime(0.001, t0);
  vol.gain.exponentialRampToValueAtTime(max, t1);
  vol.gain.setValueAtTime(max, t1);
  vol.gain.setValueAtTime(max, t2);
  vol.gain.exponentialRampToValueAtTime(min, t3);

  // build pan
  const panner: StereoPannerNode = ctx.createStereoPanner();
  panner.pan.value = RawSourceData.panner.value;
  // connect everything
  source.connect(vol).connect(panner).connect(destination);
  return {
    gen: RawSourceData.gen,
    source,
    sourceIndex,
    vol,
    panner,
    stopTime: RawSourceData.source.stopTime,
  };
}
