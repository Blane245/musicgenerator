import Noise from "../classes/noise";
import SFPG from "../classes/sfpg";
import SFRG from "../classes/sfrg";
import { SourceData } from "../types";
import { setRandomSeed } from "../utils/seededrandom";
import { getBufferSourceNodesFromNoise } from "./noisenodes";
import { getBufferSourceNodesFromSFPG } from "./sfpgnodes";
import { getBufferSourceNodesFromSFRG } from "./sfrgnodes";

export interface buildSourcesProps {
  context: AudioContext | OfflineAudioContext;
  SFPGenerators: SFPG[];
  SFRGenerators: SFRG[];
  NoiseGenerators: Noise[];
}
export function buildSources(params: buildSourcesProps): SourceData[] {
  const {
    context,
    SFPGenerators,
    SFRGenerators,
    NoiseGenerators,
  } = params;
  const sourceData: SourceData[] = [];
  SFPGenerators.forEach((g) => {
    const SFPGData: SourceData[] = getBufferSourceNodesFromSFPG(
      context,
      g,
    );
    sourceData.push(...SFPGData);
  });

  // build the buffers for the SFRGs
  SFRGenerators.forEach((g) => {
    setRandomSeed(g.seed);
    const SFRGData: SourceData[] = getBufferSourceNodesFromSFRG(
      context,
      g,
    );
    sourceData.push(...SFRGData);
  });

  // build the buffers for the SFRGs
  NoiseGenerators.forEach((g) => {
    setRandomSeed(g.seed);
    const noiseData: SourceData[] = getBufferSourceNodesFromNoise(
      context,
      g,
    );
    sourceData.push(...noiseData);
  });
  console.log('course count', sourceData.length);
  return sourceData;
}
