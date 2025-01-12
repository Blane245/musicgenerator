//
// this genertors a random sample for the duration the generator
// and the modulated the volume and pan rules similarly to
// the SFPG generatr
// each node time starts when the last one stops as determined by the spped attribute

import AudioFile from "../classes/audiofile";
import { RawSourceData } from "../types";

// the node's midi, volume, and pan values is plugged in from their respective chains
export function getBufferSourceNodesFromAudioFile(gen: AudioFile): RawSourceData[] {
  const { startTime, stopTime, volume, samples, duration, sampleRate } = gen;
  const sourceData: RawSourceData[] = [];

  const holdInterval = duration;
  sourceData.push({
    gen,
    source: {
      sample: samples,
      sampleRate: sampleRate,
      playbackRate: 1.0,
      loopStart: 0,
      loopEnd: 0,
      loop: false,
      startTime: startTime,
      duration: holdInterval,
      stopTime: stopTime,
      started: false,
    },
    panner: {
      value: 0,
    },
    vol: {
      attackInterval: 0,
      holdInterval,
      releaseInterval:0,
      value: volume,
    },
  });
  return sourceData;
}
