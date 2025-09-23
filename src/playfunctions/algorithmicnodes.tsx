import { RawSourceData } from "types";
import { Algorithmic } from "classes/generators";
import { getPresetNote } from "playfunctions/getpresetnote";
import { AlgorithmValues } from "classes/algorithmvalues";
import RandomNumber from "../classes/randomnumber";
import CMGFile from "classes/cmgfile";

export function getBufferSourceNodesFromAlgorithmic(
  fileContents: CMGFile,
  gen: Algorithmic,
  sourceCount: number
): RawSourceData[] {
  const { startTime, stopTime, preset } = gen;
  if (!preset)
    throw new Error(`Preset not defined for generator '${gen.name}'`);
  if (!gen.noteP || !gen.speedP ||  !gen.volumeP || !gen.panP)
    throw new Error(
      `Parameter definition incomplete for generator '${gen.name}'`
    );
  let time: number = startTime;
  const sourceData: RawSourceData[] = [];

  const noteP: AlgorithmValues = gen.noteP;
  const speedP: AlgorithmValues = gen.speedP;
  const volumeP: AlgorithmValues = gen.volumeP;
  // const durationP: AlgorithmValues = gen.durationP;
  const panP: AlgorithmValues = gen.panP;

  // seed the random number generators for the algorithms that use randon numbers
  if (noteP.values) noteP.values.rn = new RandomNumber(noteP.values.seed);
  if (speedP.values) speedP.values.rn = new RandomNumber(speedP.values.seed);
  // if (durationP.values) durationP.values.rn = new RandomNumber(durationP.values.seed);
  if (volumeP.values) volumeP.values.rn = new RandomNumber(volumeP.values.seed);
  if (panP.values) panP.values.rn = new RandomNumber(panP.values.seed);

  // set the start values for each attributes
  gen.initialSequence();
  let { beat, note, speed, duration: noteDuration, attack, volume, pan } = gen.getCurrentValues(time - startTime);

  // get the noise parameters
  const noiseAmplitude: number = gen.noiseAmplitude;
  const noiseFrequency: number = gen.noiseFrequency;

  let nextSource: number = sourceCount;

  // loop through time from start to stop
  while (time < stopTime) {
    const interval: number = Math.min(60.0 / speed, stopTime - time) 
    const duration = noteDuration == 100? interval: interval * noteDuration / 100;
    if (beat) {
      const connections: RawSourceData[] = getPresetNote(
        fileContents,
        gen,
        preset,
        noiseFrequency,
        noiseAmplitude,
        interval,
        duration,
        note,
        attack,
        volume,
        pan,
        time,
        nextSource
      );
      sourceData.push(...connections);
      nextSource+=connections.length;
    }
    time += interval;
    ({ beat, note, speed, duration:noteDuration, attack, volume, pan } = gen.getCurrentValues(time - startTime));
  }

  return sourceData;
}
