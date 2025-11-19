// this prepares for playing a loaded audiofile without any modulation other than
// a volume setting

import Silent from "classes/generators/silent";
import { RawSourceData } from "../types";

export function getBufferSourceNodesFromSilent(gen: Silent, sourceCount: number): RawSourceData[] {
  const { startTime, stopTime } = gen;
  const sourceData: RawSourceData[] = [];

  sourceData.push({
    gen,
    index: sourceCount,
    source: {
      sample: [new Float32Array(0), new Float32Array(0)],
      sampleRate: 0,
      note: 0,
      playbackRate: 0,
      startTime: startTime,
      duration: stopTime - startTime,
      stopTime: stopTime,
      started: false,
    },
    panner: {
      value: 0,
    },
    vol: {value: 0},
  });
  return sourceData;
}
