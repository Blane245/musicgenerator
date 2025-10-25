// import { AlgorithmValues } from "classes/algorithmvalues";
// import CMGFile from "classes/cmgfile";
// import Sequencer from "classes/sequencegenerator";
// import { SequenceItem } from "classes/sequenceitems";
// import SequenceValues from "classes/sequencevalues";
// import { getPresetNote } from "playfunctions/getpresetnote";
// import { RawSourceData } from "types";
// import RandomNumber from "../classes/randomnumber";

// export function getBufferSourceNodesFromSequencer(
//   fileContents: CMGFile,
//   gen: Sequencer,
//   sourceCount: number
// ): RawSourceData[] {
//   const { startTime, stopTime, preset } = gen;
//   if (!preset)
//     throw new Error(`Preset not defined for generator '${gen.name}'`);
//   if (gen.note.values.items.length == 0)
//     throw new Error(`Note sequence is null`);
//   if (!gen.speedP || !gen.volumeP || !gen.panP)
//     throw new Error(
//       `Parameter definition incomplete for generator '${gen.name}'`
//     );
//   const sourceData: RawSourceData[] = [];

//   const attackP: AlgorithmValues | SequenceValues = gen.attackP;
//   const speedP: AlgorithmValues | SequenceValues = gen.speedP;
//   const volumeP: AlgorithmValues | SequenceValues = gen.volumeP;
//   const durationP: AlgorithmValues | SequenceValues = gen.durationP;
//   const panP: AlgorithmValues | SequenceValues = gen.panP;

//   // seed the random number generators for the algorithms that use randon numbers
//   if (speedP.values["rn"])
//     speedP.values["rn"] = new RandomNumber(speedP.values["seed"]);
//   if (attackP.values["rn"])
//     attackP.values["rn"] = new RandomNumber(attackP.values["seed"]);
//   if (durationP.values["rn"])
//     durationP.values["rn"] = new RandomNumber(durationP.values["seed"]);
//   if (volumeP.values["rn"])
//     volumeP.values["rn"] = new RandomNumber(volumeP.values["seed"]);
//   if (panP.values["rn"])
//     panP.values["rn"] = new RandomNumber(panP.values["seed"]);

//   const items: SequenceItem[] = gen.note.values.items;

//   // get the noise parameters
//   const noiseAmplitude: number = gen.noiseAmplitude;
//   const noiseFrequency: number = gen.noiseFrequency;

//   let nextSource: number = sourceCount;

//   let time: number = startTime;
//   let beats: number = 1;
//   // loop through all of the notes in the note sequence
//   for (let iItem = 0; iItem < items.length && time <= stopTime; iItem++) {
//     const note = (items[iItem].value > 0)? items[iItem].value + gen.note.values.transpose: -1;
//     let beat: number = items[iItem].beats;
//     let {
//       speed,
//       duration: noteDuration,
//       attack,
//       volume,
//       pan,
//     } = gen.getCurrentValues(time - startTime, beats);
//     const interval: number = (beat * 60.0) / speed;
//     const duration = (interval * noteDuration) / 100;
//     console.log(`build connects for note, beat, speed, noteDuration, attack, volume, pan, interval, duration`, note,beat,speed,noteDuration,attack,volume,pan, interval, duration)
//     if (note >= 0) {
//       // Note a rest
//       const connections: RawSourceData[] = getPresetNote(
//         fileContents,
//         gen,
//         preset,
//         noiseFrequency,
//         noiseAmplitude,
//         interval,
//         duration,
//         note,
//         attack,
//         volume,
//         pan,
//         time,
//         nextSource
//       );
//       sourceData.push(...connections);
//       console.log('connections', connections);
//       nextSource += connections.length;
//     }
//     time += interval;
//     beats += beat;
//   }

//   return sourceData;
// }
