// buil teh SFRG nodes from playing
import Euclidean from "../classes/euclidean";
import { getPresetNote } from "../sfcomponents/loadpresetnote";
import { RawSourceData } from "../types";
import { setRandomSeed } from "../utils/seededrandom";
//TODO work in progress
// get all of the webaudio nodes for all of the SFPG generators
export function getBufferSourceNodesFromEuclidean(
  gen: Euclidean
): RawSourceData[] {
  const { startTime, stopTime, preset } = gen;
  const duration = stopTime - startTime
  if (!preset)
    throw new Error(`Preset not defined for generator '${gen.name}'`);

  let time: number = 0;
  const sourceData: RawSourceData[] = [];

  // initialize the current values of the generator
  setRandomSeed(gen.seed);
  gen.initialSequences();
  let { midi, speed, volume, pan } = gen.getCurrentValues(time);
  while (time < duration) {
    // determine how long this note will play from the new speed and set its start and stop times
    const duration = 60.0 / speed;
    const connections: RawSourceData[] = getPresetNote(
      gen,
      preset,
      duration,
      midi,
      volume,
      pan,
      time
    );

    // and add it to the accumulated sources
    sourceData.push(...connections);

    // bump to the next set of values and time
    time += 60.0 / speed;
    ({ midi, speed, volume, pan } = gen.getCurrentValues(time));
  }

  return sourceData;
}
