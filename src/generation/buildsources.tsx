// Construct the data from each active generator that will be used to
// realize them when they are inserted into the audio node graph
import AudioFile from "../classes/audiofile";
import { RawSourceData } from "../types";
import { getBufferSourceNodesFromAudioFile } from "./audiofilenodes";
import { getBufferSourceNodesFromAlgorithmic } from "./algorithmicnodes";
import { Algorithmic } from "../classes/generators";

export interface buildSourcesProps {
  AlgorithmicGenerators: Algorithmic[];
  AudioFileGenerators: AudioFile[];
}
export function buildSources(params: buildSourcesProps): RawSourceData[] {
  const {
    AlgorithmicGenerators,
    AudioFileGenerators,
  } = params;
  const sourceData: RawSourceData[] = [];
  AlgorithmicGenerators.forEach((g) => {
    const AlgorithmicData: RawSourceData[] = getBufferSourceNodesFromAlgorithmic(g);
    sourceData.push(...AlgorithmicData);
  });

  AudioFileGenerators.forEach((g) => {
    const AudioFileData: RawSourceData[] = getBufferSourceNodesFromAudioFile(g);
    sourceData.push(...AudioFileData);
  });

  // console.log("raw source count", sourceData.length);
  return sourceData;
}
