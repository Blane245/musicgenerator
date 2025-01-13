// Construct the data from each active generator that will be used to
// realize them when they are inserted into the audio node graph
import AudioFile from "../classes/audiofile";
import Noise from "../classes/noise";
import SFPG from "../classes/sfpg";
import SFRG from "../classes/sfrg";
import { RawSourceData } from "../types";
import { setRandomSeed } from "../utils/seededrandom";
import { getBufferSourceNodesFromAudioFile } from "./audiofilenodes";
import { getBufferSourceNodesFromNoise } from "./noisenodes";
import { getBufferSourceNodesFromSFPG } from "./sfpgnodes";
import { getBufferSourceNodesFromSFRG } from "./sfrgnodes";

export interface buildSourcesProps {
  SFPGenerators: SFPG[];
  SFRGenerators: SFRG[];
  NoiseGenerators: Noise[];
  AudioFileGenerators: AudioFile[];
}
export function buildSources(params: buildSourcesProps): RawSourceData[] {
  const { SFPGenerators, SFRGenerators, NoiseGenerators, AudioFileGenerators } =
    params;
  const sourceData: RawSourceData[] = [];
  SFPGenerators.forEach((g) => {
    const SFPGData: RawSourceData[] = getBufferSourceNodesFromSFPG(g);
    sourceData.push(...SFPGData);
  });

  // build the buffers for the SFRGs
  SFRGenerators.forEach((g) => {
    setRandomSeed(g.seed);
    const SFRGData: RawSourceData[] = getBufferSourceNodesFromSFRG(g);
    sourceData.push(...SFRGData);
  });

  // build the buffers for the Noises
  NoiseGenerators.forEach((g) => {
    setRandomSeed(g.seed);
    const noiseData: RawSourceData[] = getBufferSourceNodesFromNoise(g);
    sourceData.push(...noiseData);
  });

  // build the buffers for the AudioFiles
  AudioFileGenerators.forEach((g) => {
    const AudioFileData: RawSourceData[] = getBufferSourceNodesFromAudioFile(g);
    sourceData.push(...AudioFileData);
  });
  // console.log("raw source count", sourceData.length);
  return sourceData;
}
