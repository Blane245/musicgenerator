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
  roomConcentrator: GainNode;
  SFPGenerators: SFPG[];
  SFRGenerators: SFRG[];
  NoiseGenerators: Noise[];
}
export function buildSources(params: buildSourcesProps): SourceData[] {
  const {
    context,
    roomConcentrator,
    SFPGenerators,
    SFRGenerators,
    NoiseGenerators,
  } = params;
  const sourceData: SourceData[] = [];
  SFPGenerators.forEach((g) => {
    const SFPGData: SourceData[] = getBufferSourceNodesFromSFPG(
      context,
      g,
      roomConcentrator
    );
    sourceData.push(...SFPGData);
  });

  // build the buffers for the SFRGs
  SFRGenerators.forEach((g) => {
    setRandomSeed(g.seed);
    const SFRGData: SourceData[] = getBufferSourceNodesFromSFRG(
      context,
      g,
      roomConcentrator
    );
    sourceData.push(...SFRGData);
  });

  // build the buffers for the SFRGs
  NoiseGenerators.forEach((g) => {
    setRandomSeed(g.seed);
    const noiseData: SourceData[] = getBufferSourceNodesFromNoise(
      context,
      g,
      roomConcentrator
    );
    sourceData.push(...noiseData);
  });
  // console.log(sourceData);
  return sourceData;
}
