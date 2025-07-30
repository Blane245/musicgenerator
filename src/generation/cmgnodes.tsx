// this prepares for playing a loaded audiofile without any modulation other than
// a volume setting

import { Silent } from "../classes/generators";
import { RawSourceData } from "../types";

export function getBufferSourceNodesFromSilent(gen: Silent, sourceCount: number): RawSourceData[] {
  const { startTime, stopTime } = gen;
  const sourceData: RawSourceData[] = [];

  sourceData.push({
    gen,
    index: sourceCount,
    source: {
      sample: [new Float32Array(0)],
      sampleRate: 0,
      note: 0,
      playbackRate: 0,
      loopStart: 0,
      loopEnd: 0,
      loop: false,
      startTime: startTime,
      duration: stopTime - startTime,
      stopTime: stopTime,
      started: false,
    },
    panner: {
      value: 0,
    },
    vol: {
      attackInterval: 0,
      holdInterval: 0,
      releaseInterval:0,
      delayInterval: 0,
      decayInterval: 0,
      sustainInterval: 0,
      sustainLevel: 0,
      value: 0,
      initialAttenuation: 0,

    },
  });
  return sourceData;
}
