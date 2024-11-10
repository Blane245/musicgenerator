//
// this genertors a random sample for the duration the generator
// and the modulated the volume and pan rules similarly to
// the SFPG generatr
// each node time starts when the last one stops as determined by the spped attribute

import Noise from "../../classes/noise";
import { GeneratorData } from "../../types/types";

const CHUNKSIZE: number = 0.1; // seconds
// the node's midi, volume, and pan values is plugged in from their respective chains
export function getBufferSourceNodesFromNoise(
  context: AudioContext | OfflineAudioContext,
  gen: Noise,
  roomConcentrator: GainNode
): GeneratorData[] {
  // console.log(
  //     'in getBufferSourceNodesFromNoise',
  // );

  // setup the instrument concentrator and passthru nodes gain node
  const concentrator: GainNode = context.createGain();

  // the generator has a start and end time
  const { startTime, stopTime } = gen;
  const generatorData: GeneratorData[] = [];

  // move the chunk into the audio node
  const chunkCount = Math.ceil((stopTime - startTime) / CHUNKSIZE);
  for (let i = 0; i < chunkCount; i++) {
    const time: number = i * CHUNKSIZE + startTime;
    const { sample, volume, pan } = gen.getCurrentValue(time, CHUNKSIZE);
    // console.log(
    //     'noise type', gen.noiseType,
    //     'startTime', time,
    //     'stopTime', time + CHUNKSIZE,
    //     'volume', volume,
    //     'pan', pan,
    //     'sample length', sample.length,
    // )
    // setting the samples, pan, volume, start time, and stop time
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
    panner.connect(concentrator);

    generatorData.push({
      source: source,
      start: time,
      stop: time + CHUNKSIZE,
      lastGain: i == chunkCount - 1 ? vol : null,
    });
  }

  // make the connections
  // concentrator->passthru->roomconcentrator
  // optionally concentrator->inst reverb->passthru
  const passThru: GainNode = context.createGain();
  concentrator.connect(passThru);
  passThru.connect(roomConcentrator);
  if (gen.reverb.enabled && gen.reverb.effect) {
    concentrator.connect(gen.reverb.effect);
    gen.reverb.effect.connect(passThru);
  }

  return generatorData;
}
