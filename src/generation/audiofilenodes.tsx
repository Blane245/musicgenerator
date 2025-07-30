// this prepares for playing a loaded audiofile without any modulation other than
// a volume setting

import { AudioFile } from "../classes/generators";
import { RawSourceData } from "../types";

export function getBufferSourceNodesFromAudioFile(gen: AudioFile, sourceCount: number): RawSourceData[] {
  const { startTime, stopTime, volume, samples, duration, sampleRate } = gen;
  const sourceData: RawSourceData[] = [];

  const holdInterval = duration;
  sourceData.push({
    gen,
    index:sourceCount,
    source: {
      sample: samples,
      sampleRate: sampleRate,
      note: 0,
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
      delayInterval: 0.001,
      decayInterval: 0.001,
      sustainInterval: 0.001,
      sustainLevel: 0.001,
      value: volume,
      initialAttenuation: 0,

    },
  });
  return sourceData;
}
