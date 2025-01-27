// Construct the data from each active generator that will be used to
// realize them when they are inserted into the audio node graph
import Euclidean from "classes/euclidean";
import AudioFile from "../classes/audiofile";
import Noise from "../classes/noise";
import SFPG from "../classes/sfpg";
import SFRG from "../classes/sfrg";
import Wiener from "../classes/wiener";
import { RawSourceData } from "../types";
import { setRandomSeed } from "../utils/seededrandom";
import { getBufferSourceNodesFromAudioFile } from "./audiofilenodes";
import { getBufferSourceNodesFromEuclidean } from "./euclideannodes";
import { getBufferSourceNodesFromNoise } from "./noisenodes";
import { getBufferSourceNodesFromSFPG } from "./sfpgnodes";
import { getBufferSourceNodesFromSFRG } from "./sfrgnodes";
import { getBufferSourceNodesFromWiener } from "./weinernodes";

export interface buildSourcesProps {
  SFPGenerators: SFPG[];
  SFRGenerators: SFRG[];
  NoiseGenerators: Noise[];
  AudioFileGenerators: AudioFile[];
  WienerGenerators: Wiener[];
  EuclideanGenerators: Euclidean[];
}
export function buildSources(params: buildSourcesProps): RawSourceData[] {
  const {
    SFPGenerators,
    SFRGenerators,
    NoiseGenerators,
    AudioFileGenerators,
    WienerGenerators,
    EuclideanGenerators,
  } = params;
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

  // build the buffers for the Wiener
  WienerGenerators.forEach((g) => {
    const WienerData: RawSourceData[] = getBufferSourceNodesFromWiener(g);
    sourceData.push(...WienerData);
  });

  // build the buffers for the Euclidean
  EuclideanGenerators.forEach((g) => {
    const EuclideanData: RawSourceData[] = getBufferSourceNodesFromEuclidean(g);
    sourceData.push(...EuclideanData);
  });
  // console.log("raw source count", sourceData.length);
  return sourceData;
}
