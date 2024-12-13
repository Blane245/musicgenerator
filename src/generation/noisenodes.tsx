//
// this genertors a random sample for the duration the generator
// and the modulated the volume and pan rules similarly to
// the SFPG generatr
// each node time starts when the last one stops as determined by the spped attribute

import Noise from "../classes/noise";
import { sourceData } from "../types";

// the node's midi, volume, and pan values is plugged in from their respective chains
export function getBufferSourceNodesFromNoise(
  context: AudioContext | OfflineAudioContext,
  gen: Noise,
  roomConcentrator: GainNode
): sourceData[] {

  const { startTime, stopTime, duration } = gen;
  const sourceData: sourceData[] = [];

  // move the chunk into the audio node
  const steps = Math.ceil((stopTime - startTime) / duration);
  for (let i = 0; i < steps; i++) {
    const time: number = i * duration + startTime;
    const { sample, volume, pan } = gen.getCurrentValues(time, duration);

    // set the samples, pan, volume
    const buffer: AudioBuffer = context.createBuffer(
      1,
      sample.length,
      gen.sampleRate
    );
    const channelData: Float32Array = buffer.getChannelData(0);
    channelData.set(sample);
    const source: AudioBufferSourceNode = context.createBufferSource();
    source.buffer = buffer;
    source.loopEnd = sample.length;
    source.loopStart = 0;
    source.playbackRate.value = 1.0;
    const vol: GainNode = context.createGain();
    vol.gain.value = volume / 100;
    const panner: StereoPannerNode = context.createStereoPanner();
    panner.pan.value = pan;

    // connect make the path source->vol->panner->concentrator
    source.connect(vol);
    vol.connect(panner);
    panner.connect(roomConcentrator);
    sourceData.push({
      generator: gen,
      connections: [{ source, vol, panner }],
      started: false,
    });
  }
  return sourceData;
}
