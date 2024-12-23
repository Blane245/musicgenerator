import SFPG from "../classes/sfpg";
import { connectPresetNote } from "../sfcomponents/presetnote";
import { SourceData } from "../types";

// get all of the webaudio nodes for all of the SFPG generators
export function getBufferSourceNodesFromSFPG(
  context: AudioContext | OfflineAudioContext,
  gen: SFPG,
): SourceData[] {
  const sourceData: SourceData[] = [];
  // the generator has a start and stop time, and a note duration
  const { startTime, stopTime, duration, preset } = gen;
  if (!preset) throw new Error(`Preset not defined for generator '${gen.name}`);

  // A generator will need a number of steps = (stoptime-start)/duration
  const steps = Math.ceil((stopTime - startTime) / duration);

  // loop through each time step to get the current pitch, volume, and pan
  // for each step and apply them to the sources
  for (let i: number = 0; i < steps; i += 1) {
    const time = i * duration;

    // get the current pitch, volume, and pan at this time
    const { pitch, volume, pan } = gen.getCurrentValues(time);

    const connections: SourceData[] = connectPresetNote(
      context,
      gen,
      preset,
      duration,
      pitch,
      volume,
      pan,
      time + startTime
    );
    sourceData.push(...connections);
  }

  return sourceData;
}
