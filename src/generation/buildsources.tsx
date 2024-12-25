import Noise from "../classes/noise";
import SFPG from "../classes/sfpg";
import SFRG from "../classes/sfrg";
import { RawSourceData } from "../types";
import { setRandomSeed } from "../utils/seededrandom";
import { getBufferSourceNodesFromNoise } from "./noisenodes";
import { getBufferSourceNodesFromSFPG } from "./sfpgnodes";
import { getBufferSourceNodesFromSFRG } from "./sfrgnodes";

export interface buildSourcesProps {
  SFPGenerators: SFPG[];
  SFRGenerators: SFRG[];
  NoiseGenerators: Noise[];
}
export function buildSources(params: buildSourcesProps): RawSourceData[] {
  const { SFPGenerators, SFRGenerators, NoiseGenerators } = params;
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

  // build the buffers for the SFRGs
  NoiseGenerators.forEach((g) => {
    setRandomSeed(g.seed);
    const noiseData: RawSourceData[] = getBufferSourceNodesFromNoise(g);
    sourceData.push(...noiseData);
  });
  console.log("raw source count", sourceData.length);
  return sourceData;
}
