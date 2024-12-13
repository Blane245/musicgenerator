import Noise from "../classes/noise";
import SFPG from "../classes/sfpg";
import SFRG from "../classes/sfrg";
import { sourceData } from "../types";
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
function buildSources(params: buildSourcesProps) : sourceData[] {
  const {context, roomConcentrator, SFPGenerators, SFRGenerators, NoiseGenerators} = params;
  const sourceData: sourceData[] = [];
  SFPGenerators.forEach((g) => {
    const SFPGData: sourceData[] = getBufferSourceNodesFromSFPG(
      context,
      g,
      roomConcentrator
    );
    sourceData.push(...SFPGData);
    // generatorStarted.push(...Array(SFPGData.length).fill(false));
  });

  // build the buffers for the SFRGs
  SFRGenerators.forEach((g) => {
    setRandomSeed(g.seed);
    const SFRGData: sourceData[] = getBufferSourceNodesFromSFRG(
      context,
      g,
      roomConcentrator
    );
    sourceData.push(...SFRGData);
    // generatorStarted.push(...Array(SFRGData.length).fill(false));
  });

  // build the buffers for the SFRGs
  NoiseGenerators.forEach((g) => {
    setRandomSeed(g.seed);
    const noiseData: sourceData[] = getBufferSourceNodesFromNoise(
      context,
      g,
      roomConcentrator
    );
    sourceData.push(...noiseData);
    // generatorStarted.push(...Array(noiseData.length).fill(false));
  });
  return sourceData;
}
