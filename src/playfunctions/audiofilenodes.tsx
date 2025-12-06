// this prepares for playing a loaded audiofile without any modulation other than
// a volume setting

import AudioFile from "classes/generators/audiofile";
import { dBToGain } from "sfcomponents/util";
import { RawSourceData } from "../types";

export function getBufferSourceNodesFromAudioFile(
  gen: AudioFile,
  sourceCount: number
): RawSourceData[] {
  const { startTime, stopTime, volume, samples, duration, sampleRate } = gen;
  const sourceData: RawSourceData[] = [];

  const holdInterval = duration;

  const volumeGain: number = dBToGain(volume);
  const theseSamples: Float32Array[] = [];
  samples.forEach((c: Float32Array) => {
    const thisSample: Float32Array = new Float32Array(c);
    thisSample.forEach((s) => {
      s = s * volumeGain;
    });
    theseSamples.push(thisSample);
  });
  sourceData.push({
    gen,
    index: sourceCount,
    source: {
      sample: theseSamples,
      sampleRate,
      note: 0,
      playbackRate: 1.0,
      startTime,
      duration: holdInterval,
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
