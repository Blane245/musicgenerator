
import SFPG from "../classes/sfpg";
import { sourceData, NoteConnection } from "../types";
import { connectPresetNote } from "../sfcomponents/presetnote";

// get all of the webaudio nodes for all of the SFPG generators
export function getBufferSourceNodesFromSFPG(
  context: AudioContext | OfflineAudioContext,
  gen: SFPG,
  roomConcentrator: GainNode
): sourceData[] {

  // the generator has a start and stop time, and a note duration
  const { startTime, stopTime, duration, preset } = gen;
  if (!preset) throw new Error(`Preset not defined for generator '${gen.name}`);

  // A generator will need a number of #chucks = (stoptime-start)/CHUCKSIZE
  const steps = Math.ceil((stopTime - startTime) / duration);

  // loop through each time chunks to get the current pitch, volume, and pan
  // for each chunk and apply them to the chunk
  const sourceData: sourceData[] = [];
  for (let i: number = 0; i < steps; i += 1) {
    const time = i * duration;

    // get the current pitch, volume, and pan at this time
    const { pitch, volume, pan } = gen.getCurrentValues(time);
     
    const connections:NoteConnection[] = connectPresetNote(context, roomConcentrator,
      preset, duration, pitch, volume, pan, time + startTime);
    
    // and add it to the accumulated sources
    sourceData.push({
      generator: gen,
      connections: connections,
      started: false,
    });
  }

  return sourceData;
}
