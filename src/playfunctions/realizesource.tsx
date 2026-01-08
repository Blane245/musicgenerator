// create a source/gain/pan set from the raw source data and
// connect it to the destination
import AudioFile from "classes/generators/audiofile";
import { ActiveSource, GENERATORTYPE, RawSourceData } from "../types";
import Algorithmic from "classes/generators/algorithmic";

export function realizeSource(
  ctx: AudioContext | OfflineAudioContext,
  rawSourceData: RawSourceData,
  sourceIndex: number,
  destination: AudioNode
): ActiveSource {
  // build source
  const source: AudioBufferSourceNode = ctx.createBufferSource();
  // the source will either Silent, Algorithmic, Stochastic, or AudioFile
  if (rawSourceData.gen.type == GENERATORTYPE.Algorithmic ||
    rawSourceData.gen.type == GENERATORTYPE.Stochastic  ) {
    source.buffer = ctx.createBuffer(
      rawSourceData.source.sample.length,
      rawSourceData.source.sample[0].length,
      rawSourceData.source.sampleRate
    );
    rawSourceData.source.sample.forEach((channel: Float32Array, i)=> {
      const cD: Float32Array | undefined = source.buffer?.getChannelData(i);
      if (cD != undefined) cD.set(channel);
    })
    const cD: Float32Array = source.buffer.getChannelData(0);
    cD.set(rawSourceData.source.sample[0]);
    // console.log('source sample for note ', rawSourceData.source.note, 'length', cD.length);
  } else if (rawSourceData.gen.type == GENERATORTYPE.AudioFile) {
    (rawSourceData.gen as AudioFile).getSample(ctx, source);
  }
  if (rawSourceData.gen.type != GENERATORTYPE.Silent) {
    source.loop = false;
    source.playbackRate.value = 1.0;

    // build gain
    const vol: GainNode = ctx.createGain();
    vol.gain.value = 1.0;
    // build pan
    const panner: StereoPannerNode = ctx.createStereoPanner();
    panner.pan.value = rawSourceData.panner.value;
    // connect everything
    source.connect(vol).connect(panner).connect(destination);
    // connect the instrument reverb
    if (rawSourceData.gen.type == GENERATORTYPE.Algorithmic) {
      const gen = rawSourceData.gen as Algorithmic;
        gen.setContext(ctx);
        if (gen.effectIn)
        panner.connect(gen.effectIn);
        gen.connectReverb(destination);
      }
    
    return {
      gen: rawSourceData.gen,
      source,
      sourceIndex,
      vol,
      panner,
      stopTime: rawSourceData.source.stopTime,
    };
  } else {
    return {
      gen: rawSourceData.gen,
      source: ctx.createBufferSource(),
      sourceIndex,
      vol: ctx.createGain(),
      panner: ctx.createStereoPanner(),
      stopTime: rawSourceData.gen.stopTime,
    };
  }
}
// function rampToTime(v0: number, v1: number, t0: number, t1: number, time: number) :number {
//   if (time > t1) return v1;
//   else return (v0 * ((v1/v0)**((time-t0)/(t1-t0))));
// }
