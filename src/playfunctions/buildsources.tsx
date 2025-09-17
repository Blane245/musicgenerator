// Construct the data from each active generator that will be used to
// realize them when they are inserted into the audio node graph
import { RawSourceData } from "../types";
import { getBufferSourceNodesFromAudioFile } from "./audiofilenodes";
import { getBufferSourceNodesFromAlgorithmic } from "./algorithmicnodes";
import { Algorithmic, Silent, AudioFile } from "../classes/generators";
import { getBufferSourceNodesFromSilent } from "./cmgnodes";

export interface buildSourcesProps {
  AlgorithmicGenerators: Algorithmic[];
  AudioFileGenerators: AudioFile[];
  SilentGenerators: Silent[];
}
export function buildSources(params: buildSourcesProps): {sources: RawSourceData[], error: string} {
  const {
    AlgorithmicGenerators,
    AudioFileGenerators,
    SilentGenerators,
  } = params;
  let sourceCount: number = 0;
  let error:string = "";
  const sourceData: RawSourceData[] = [];
  try {
  AlgorithmicGenerators.forEach((g) => {
    const AlgorithmicData: RawSourceData[] = getBufferSourceNodesFromAlgorithmic(g, sourceCount);
    sourceData.push(...AlgorithmicData);
    sourceCount= sourceData.length;
  });

  AudioFileGenerators.forEach((g) => {
    const AudioFileData: RawSourceData[] = getBufferSourceNodesFromAudioFile(g, sourceCount);
    sourceData.push(...AudioFileData);
    sourceCount = sourceData.length;
  });

  SilentGenerators.forEach((g) => {
    const CMGData: RawSourceData[] = getBufferSourceNodesFromSilent(g, sourceCount);
    sourceData.push(...CMGData);
    sourceCount = sourceData.length;
  });

  return ({sources: sourceData.sort((a:RawSourceData, b: RawSourceData) => a.source.startTime - b.source.startTime), error: error});
} catch (e: any) {
  error = (e as Error).message;
  return ({sources: sourceData, error: error});
}
}
