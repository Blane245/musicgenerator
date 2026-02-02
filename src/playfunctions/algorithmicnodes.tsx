// import { AlgorithmValues } from "classes/algorithms/algorithmvalues";
// import SequenceValues from "classes/algorithms/sequencevalues";
// import Algorithmic from "classes/generators/algorithmic";
// import { getPresetNote } from "playfunctions/presetProcessing/getpresetnote";
// import { ALGORITHMTYPE, RawSourceData, SequenceItem } from "types";
// import RandomNumber from "../classes/randomnumber";
// import { debug } from "utils/debug";

// export function getBufferSourceNodesFromAlgorithmic(
//   gen: Algorithmic,
//   sourceCount: number
// ): RawSourceData[] {
//   const { startTime, stopTime, preset } = gen;
//   if (!preset)
//     throw new Error(`Preset not defined for generator '${gen.name}'`);

//   let time: number = startTime;
//   const sourceData: RawSourceData[] = [];

//   const noteP: AlgorithmValues = gen.noteP;
//   const attackP: AlgorithmValues = gen.attackP;
//   const speedP: AlgorithmValues = gen.speedP;
//   const volumeP: AlgorithmValues = gen.volumeP;
//   const durationP: AlgorithmValues = gen.durationP;
//   const panP: AlgorithmValues = gen.panP;

//   // seed the random number generators for the algorithms that use randon numbers
//   if (noteP.values && noteP.values["rn"])
//     noteP.values["rn"] = new RandomNumber(noteP.values["seed"]);
//   if (speedP.values && speedP.values["rn"])
//     speedP.values["rn"] = new RandomNumber(speedP.values["seed"]);
//   if (attackP.values && attackP.values["rn"])
//     attackP.values["rn"] = new RandomNumber(attackP.values["seed"]);
//   if (durationP.values && durationP.values["rn"])
//     durationP.values["rn"] = new RandomNumber(durationP.values["seed"]);
//   if (volumeP.values && volumeP.values["rn"])
//     volumeP.values["rn"] = new RandomNumber(volumeP.values["seed"]);
//   if (panP.values && panP.values["rn"])
//     panP.values["rn"] = new RandomNumber(panP.values["seed"]);

//   // set the start values for each attributes
//   gen.initialSequence();

//   let nextSource: number = sourceCount;

//   if (noteP.algorithmType != ALGORITHMTYPE.Sequencer) {
//     // looping will either be on time or beats depending on whether the
//     // not algorithm is a sequencer or not
//     // loop through time from start to stop

//     let {
//       beat: hitBeat,
//       note,
//       speed,
//       duration: noteDuration,
//       attack,
//       volume,
//       pan,
//     } = gen.getCurrentValues(time - startTime, 0);
//     volume = volume + gen.parent.volume;

//     while (time < stopTime - 0.001) {
//       const interval: number = Math.min(60.0 / speed, stopTime - time);

//       const duration = (interval * noteDuration) / 100;
//       if (hitBeat) {
//         const connections: RawSourceData[] = getPresetNote(
//           gen,
//           preset,
//           interval,
//           duration,
//           note,
//           attack,
//           volume, // in dB
//           pan,
//           time,
//           nextSource
//         );
//         sourceData.push(...connections);
//         nextSource += connections.length;
//       }
//       time += interval;

//       ({
//         beat: hitBeat,
//         note,
//         speed,
//         duration: noteDuration,
//         attack,
//         volume,
//         pan,
//       } = gen.getCurrentValues(time - startTime, 0));
//       volume = volume + gen.parent.volume;

//     }

//     return sourceData;
//   } else {
//     // sequencing based on note beats
//     let time: number = startTime;

//     // and initialze them
//     const noteP: SequenceValues = gen.noteP as SequenceValues;
//     let beats: number = 1;
//     const transpose: number = noteP.values.transpose;
//     // hold the original items so they can be restored
//     const items: SequenceItem[] = [...noteP.values.items];
//     noteP.setReverse();
//     noteP.setReflect();

//     for (
//       let iItem = 0;
//       iItem < noteP.values.items.length && time <= stopTime;
//       iItem++
//     ) {
//       const note =
//         noteP.values.items[iItem].value > 0
//           ? noteP.values.items[iItem].value + transpose
//           : -1;
//       const beat: number = noteP.values.items[iItem].beats;
//       let {
//         speed,
//         duration: noteDuration,
//         attack,
//         volume,
//         pan,
//       } = gen.getCurrentValues(time - startTime, beats);

//       const totalVolume:number = volume + gen.parent.volume;
//       const interval: number = (beat * 60.0) / speed;
//       const duration = (interval * noteDuration) / 100;
//       debug.info(`getBufferSourceNodesFromAlgorithmic: build connects for note, beat, speed, noteDuration, attack, volume, pan, interval, duration`, note,beat,speed,noteDuration,attack,volume,pan, interval, duration)
//       if (note >= 0) {
//         // Note a rest
//         const connections: RawSourceData[] = getPresetNote(
//           gen,
//           preset,
//           interval,
//           duration,
//           note,
//           attack,
//           totalVolume, // in dB
//           pan,
//           time,
//           nextSource
//         );
//         sourceData.push(...connections);
//         nextSource += connections.length;
//       }
//       time += interval;
//       beats += beat;
//     }

//     // restore the sequencer items
//     noteP.values.items = [...items];
//     return sourceData;
//   }
// }
