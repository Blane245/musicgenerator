// Construct the data from each active generator that will be used to
// realize them when they are inserted into the audio node graph
import { RawSourceData } from "../types";
import { getBufferSourceNodesFromAudioFile } from "./audiofilenodes";
import { getBufferSourceNodesFromAlgorithmic } from "./algorithmicnodes";
import { Algorithmic, CMG, AudioFile } from "../classes/generators";
import { getBufferSourceNodesFromCMG } from "./cmgnodes";

export interface buildSourcesProps {
  AlgorithmicGenerators: Algorithmic[];
  AudioFileGenerators: AudioFile[];
  CMGenerators: CMG[];
}
export function buildSources(params: buildSourcesProps): {sources: RawSourceData[], error: string} {
  const {
    AlgorithmicGenerators,
    AudioFileGenerators,
    CMGenerators,
  } = params;
  let error:string = "";
  const sourceData: RawSourceData[] = [];
  try {
  AlgorithmicGenerators.forEach((g) => {
    const AlgorithmicData: RawSourceData[] = getBufferSourceNodesFromAlgorithmic(g);
    sourceData.push(...AlgorithmicData);
  });

  AudioFileGenerators.forEach((g) => {
    const AudioFileData: RawSourceData[] = getBufferSourceNodesFromAudioFile(g);
    sourceData.push(...AudioFileData);
  });

  CMGenerators.forEach((g) => {
    const CMGData: RawSourceData[] = getBufferSourceNodesFromCMG(g);
    sourceData.push(...CMGData);
  });

  // console.log("raw source count", sourceData.length);
  return ({sources: sourceData.sort((a:RawSourceData, b: RawSourceData) => a.source.startTime - b.source.startTime), error: error});
} catch (e: any) {
  error = (e as Error).message;
  return ({sources: sourceData, error: error});
}
}
