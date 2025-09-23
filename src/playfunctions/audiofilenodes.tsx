// this prepares for playing a loaded audiofile without any modulation other than
// a volume setting

import { dBToGain } from "sfcomponents/util";
import { AudioFile } from "../classes/generators";
import { RawSourceData } from "../types";
import CMGFile from "classes/cmgfile";
import findGeneratorParent from "utils/findgeneratorparent";
import Track from "classes/track";

export function getBufferSourceNodesFromAudioFile(
  fileContents: CMGFile,
  gen: AudioFile,
  sourceCount: number
): RawSourceData[] {
  const { startTime, stopTime, volume, samples, duration, sampleRate } = gen;
  const sourceData: RawSourceData[] = [];

  const holdInterval = duration;

  // apply the volume to all channels of the audiofile sample
  const track: Track | null = findGeneratorParent(gen.name, fileContents);

  const volumeGain: number = track? dBToGain(volume + track.volume): dBToGain(volume);
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
