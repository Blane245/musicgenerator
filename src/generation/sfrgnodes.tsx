import SFRG from "../classes/sfrg";
import { sourceData, NoteConnection } from "../types";
import { connectPresetNote } from "../sfcomponents/presetnote";

// get all of the webaudio nodes for all of the SFPG generators
export function getBufferSourceNodesFromSFRG(
  context: AudioContext | OfflineAudioContext,
  gen: SFRG,
  roomConcentrator: GainNode
): sourceData[] {
  // get the instrument zone for generator's preset
  const { startTime, stopTime, preset } = gen;
  if (!preset)
    throw new Error(`Preset not defined for generator '${gen.name}'`);

  let time: number = startTime;
  const sourceData: sourceData[] = [];

  // initialize the current values of the generator
  gen.midiT.currentValue = gen.midiT.startValue;
  gen.speedT.currentValue = gen.speedT.startValue;
  gen.volumeT.currentValue = gen.volumeT.startValue;
  gen.panT.currentValue = gen.panT.startValue;
  while (time < stopTime) {
    const { midi, speed, volume, pan } = gen.getCurrentValues();

    // deterime how long this note will play from the new speed and set its start and stop times
    const duration = 60.0 / speed;
    const connections:NoteConnection[] = connectPresetNote(context, roomConcentrator,
      preset, duration, midi, volume, pan, time + startTime);


    // and add it to the accumulated sources
    sourceData.push({
      generator: gen,
      connections: connections,
      started: false,
    });
    time += duration;
  }

  return sourceData;
}
