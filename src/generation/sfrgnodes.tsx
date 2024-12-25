import { getPresetNote } from "../sfcomponents/loadpresetnote";
import SFRG from "../classes/sfrg";
import { RawSourceData } from "../types";
import { setRandomSeed } from "../utils/seededrandom";

// get all of the webaudio nodes for all of the SFPG generators
export function getBufferSourceNodesFromSFRG(
  gen: SFRG,
): RawSourceData[] {
  const { startTime, stopTime, preset } = gen;
  if (!preset)
    throw new Error(`Preset not defined for generator '${gen.name}'`);

  let time: number = startTime;
  const sourceData: RawSourceData[] = [];

  // initialize the current values of the generator
  setRandomSeed(gen.seed);
  gen.midiT.currentValue = gen.midiT.startValue;
  gen.speedT.currentValue = gen.speedT.startValue;
  gen.volumeT.currentValue = gen.volumeT.startValue;
  gen.panT.currentValue = gen.panT.startValue;
  let midi: number = gen.midiT.startValue;
  let speed: number = gen.speedT.startValue;
  let volume: number = gen.volumeT.startValue;
  let pan: number = gen.panT.startValue;
  while (time < stopTime) {
    // determine how long this note will play from the new speed and set its start and stop times
    const duration = 60.0 / speed;
    const connections: RawSourceData[] = getPresetNote(
      gen,
      preset,
      duration,
      midi,
      volume,
      pan,
      time,
      );

    // and add it to the accumulated sources
    sourceData.push(...connections);
    time += duration;
    ({ midi, speed, volume, pan } = gen.getCurrentValues());
  }

  return sourceData;
}
