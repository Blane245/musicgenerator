import { RawSourceData } from "../types";
import { Algorithmic } from "../classes/generators";
import { getPresetNote } from "../sfcomponents/loadpresetnote";
import { AlgorithmValues } from "../classes/algorithmvalues";
import RandomNumber from "../classes/randomnumber";

export function getBufferSourceNodesFromAlgorithmic(
  gen: Algorithmic,
  sourceCount: number
): RawSourceData[] {
  const { startTime, stopTime, preset } = gen;
  if (!preset)
    throw new Error(`Preset not defined for generator '${gen.name}'`);
  if (!gen.noteP || !gen.speedP || !gen.durationP ||  !gen.volumeP || !gen.panP)
    throw new Error(
      `Parameter definition incomplete for generator '${gen.name}'`
    );
  let time: number = startTime;
  const sourceData: RawSourceData[] = [];

  const noteP: AlgorithmValues = gen.noteP;
  const speedP: AlgorithmValues = gen.speedP;
  const volumeP: AlgorithmValues = gen.volumeP;
  const durationP: AlgorithmValues = gen.durationP;
  const panP: AlgorithmValues = gen.panP;

  // seed the random number generators for the algorithms that use randon numbers
  if (noteP.values) noteP.values.rn = new RandomNumber(noteP.values.seed);
  if (speedP.values) speedP.values.rn = new RandomNumber(speedP.values.seed);
  if (durationP.values) durationP.values.rn = new RandomNumber(durationP.values.seed);
  if (volumeP.values) volumeP.values.rn = new RandomNumber(volumeP.values.seed);
  if (panP.values) panP.values.rn = new RandomNumber(panP.values.seed);

  // set the start values for each attributes
  gen.initialSequence();
  let { beat, note, speed, duration: noteDuration, velocity, volume, pan } = gen.getCurrentValues(time);

  // get the noise parameters
  const noiseAmplitude: number = gen.noiseAmplitude;
  const noiseDispersion: number = gen.noiseDispersion;

  let nextSource: number = sourceCount;

  // loop through time from start to stop
  while (time < stopTime) {
    const initialDuration: number = Math.min(60.0 / speed, stopTime - time) 
    const interval = noteDuration == 0? initialDuration: noteDuration;
    if (beat) {
      const connections: RawSourceData[] = getPresetNote(
        gen,
        preset,
        noiseAmplitude,
        noiseDispersion,
        initialDuration,
        interval,
        note,
        velocity,
        volume,
        pan,
        time,
        nextSource
      );
      sourceData.push(...connections);
      nextSource+=connections.length;
    }
    time += initialDuration;
    ({ beat, note, speed, duration:noteDuration, velocity, volume, pan } = gen.getCurrentValues(time));
  }

  return sourceData;
}
