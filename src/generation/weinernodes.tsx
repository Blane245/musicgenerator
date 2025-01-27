// build the source data from SFPG nodes for playing
import Wiener from "../classes/wiener";
import { getPresetNote } from "../sfcomponents/loadpresetnote";
import { RawSourceData } from "../types";
import { setRandomSeed } from "../utils/seededrandom";

// get all of the webaudio nodes for all of the SFPG generators
export function getBufferSourceNodesFromWiener(gen: Wiener): RawSourceData[] {
  const sourceData: RawSourceData[] = [];
  // the generator has a start and stop time, and a note duration
  const { startTime, stopTime, preset } = gen;
  if (!preset) throw new Error(`Preset not defined for generator '${gen.name}`);

  // this generator loops from start time to stop time taking
  // a step forward in time based on the next value of speed
  let time: number = 0;
  setRandomSeed(gen.seed);
  const duration: number = stopTime - startTime;
  while (time < duration) {
    const values = gen.getCurrentValues(time);

    const connections: RawSourceData[] = getPresetNote(
      gen,
      preset,
      60.0 / values.speed,
      values.pitch,
      values.volume,
      values.pan,
      time + gen.startTime
    );
    sourceData.push(...connections);
    // go to the next time
    time += 60.0 / values.speed;
    console.log('patch at time', values.pitch, time+gen.startTime);
  }

  return sourceData;
}
