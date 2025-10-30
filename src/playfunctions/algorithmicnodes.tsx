import { ALGORITHMTYPE, RawSourceData } from "types";
import { Algorithmic } from "classes/generators";
import { getPresetNote } from "playfunctions/getpresetnote";
import SequenceValues, { AlgorithmValues } from "classes/algorithmvalues";
import RandomNumber from "../classes/randomnumber";
import CMGFile from "classes/cmgfile";
import { SequenceItem } from "types";
import { dBToGain } from "sfcomponents/util";

export function getBufferSourceNodesFromAlgorithmic(
  fileContents: CMGFile,
  gen: Algorithmic,
  sourceCount: number
): RawSourceData[] {
  const { startTime, stopTime, preset } = gen;
  if (!preset)
    throw new Error(`Preset not defined for generator '${gen.name}'`);
  let time: number = startTime;
  const sourceData: RawSourceData[] = [];

  const noteP: AlgorithmValues = gen.noteP;
  const attackP: AlgorithmValues = gen.attackP;
  const speedP: AlgorithmValues = gen.speedP;
  const volumeP: AlgorithmValues = gen.volumeP;
  const durationP: AlgorithmValues = gen.durationP;
  const panP: AlgorithmValues = gen.panP;

  // seed the random number generators for the algorithms that use randon numbers
  if (noteP.values && noteP.values['rn']) noteP.values['rn'] = new RandomNumber(noteP.values['seed']);
  if (speedP.values && speedP.values['rn']) speedP.values['rn'] = new RandomNumber(speedP.values['seed']);
  if (attackP.values && attackP.values['rn']) attackP.values['rn'] = new RandomNumber(attackP.values['seed']);
  if (durationP.values && durationP.values['rn']) durationP.values['rn'] = new RandomNumber(durationP.values['seed']);
  if (volumeP.values && volumeP.values['rn']) volumeP.values['rn'] = new RandomNumber(volumeP.values['seed']);
  if (panP.values && panP.values['rn']) panP.values['rn'] = new RandomNumber(panP.values['seed']);

  // set the start values for each attributes
  gen.initialSequence();

  // get the noise parameters
  const noiseAmplitude: number = gen.noiseAmplitude;
  const noiseFrequency: number = gen.noiseFrequency;

  let nextSource: number = sourceCount;

  if (noteP.algorithmType != ALGORITHMTYPE.Sequencer) {
  // looping will either be on time or beats depending on whether the 
  // not algorithm is a sequencer or not
  // loop through time from start to stop
  let { beat: hitBeat, note, speed, duration: noteDuration, attack, volume, pan } = gen.getCurrentValues(time - startTime, 0 );
  while (time < stopTime) {
    const interval: number = Math.min(60.0 / speed, stopTime - time) 
    const duration = noteDuration == 100? interval: interval * noteDuration / 100;
    if (hitBeat) {
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
        volume, // in dB
        pan,
        time,
        nextSource
      );
      sourceData.push(...connections);
      nextSource+=connections.length;
    }
    time += interval;
    ({ beat: hitBeat, note, speed, duration:noteDuration, attack, volume, pan } = gen.getCurrentValues(time - startTime, 0));
  }

  return sourceData;
} else {
  // sequencing based on note beats
  let time: number = startTime;
  let beats: number = 1;
  const items: SequenceItem[] = (gen.noteP as SequenceValues).values.items;
  const transpose: number = (gen.noteP as SequenceValues).values.transpose;
   for (let iItem = 0; iItem < items.length && time <= stopTime; iItem++) {
    const note = (items[iItem].value > 0)? items[iItem].value + transpose: -1;
    let beat: number = items[iItem].beats;
    let {
      speed,
      duration: noteDuration,
      attack,
      volume,
      pan,
    } = gen.getCurrentValues(time - startTime, beats);
    const interval: number = (beat * 60.0) / speed;
    const duration = (interval * noteDuration) / 100;
    // console.log(`build connects for note, beat, speed, noteDuration, attack, volume, pan, interval, duration`, note,beat,speed,noteDuration,attack,volume,pan, interval, duration)
    if (note >= 0) {
      // Note a rest
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
        volume, // in dB
        pan,
        time,
        nextSource
      );
      sourceData.push(...connections);
      // console.log('connections', connections);
      nextSource += connections.length;
    }
    time += interval;
    beats += beat;
  }

  return sourceData;
 
}
}
