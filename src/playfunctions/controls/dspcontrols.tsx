// activate and process controls that affect signal processing of the
// sources

import SequenceValues from "classes/algorithms/sequencevalues";
import CMGFile from "classes/cmgfile";
import {
  Control,
  EFFECTTYPE,
  GeneratorEffect,
  TrackEffect,
} from "classes/control";
import Algorithmic from "classes/generators/algorithmic";
import Track from "classes/track";
import { ALGORITHMTYPE } from "types";
import findGeneratorParent from "utils/findgeneratorparent";

// activate and process last track or generator control that that proceeds
// the generator startTime. Done when generator processing starts
export function activatePriorControls(
  generator: Algorithmic,
  fileContents: CMGFile
) {
  let trackControl: Control | null = null;
  // find the track control and initialize it
  const track: Track | null = findGeneratorParent(generator.name, fileContents);
  if (track) {
    for (
      let i = fileContents.controls.length - 1;
      i >= 0 && !trackControl;
      i--
    ) {
      if (
        fileContents.controls[i].type == EFFECTTYPE.Track &&
        fileContents.controls[i].time <= generator.startTime &&
        fileContents.controls[i].list.findIndex(
          (name: string) => name == track.name
        )
      ) {
        trackControl = fileContents.controls[i];
      }
    }
    if (trackControl) {
      track.initializeVolumeRamp(
        trackControl.time,
        trackControl.effect as TrackEffect
      );
    }

    // find the generator control preceding the start time and initialize it
    let generatorControl: Control | null = null;
    for (
      let i = fileContents.controls.length - 1;
      i >= 0 && !generatorControl;
      i--
    ) {
      if (
        fileContents.controls[i].type == EFFECTTYPE.Generator &&
        fileContents.controls[i].time <= generator.startTime
      ) {
        generatorControl = fileContents.controls[i];
      }
    }
    if (generatorControl) {
      generator.tremeloEnabled = (
        generatorControl.effect as GeneratorEffect
      ).tremoloEnable;
      generator.vibratoEnabled = (
        generatorControl.effect as GeneratorEffect
      ).vibratoEnable;
      generator.noiseEnabled = (
        generatorControl.effect as GeneratorEffect
      ).noiseEnable;
      if (generator.noteP.algorithmType == ALGORITHMTYPE.Sequencer) {
        const noteP: SequenceValues = generator.noteP as SequenceValues;
        noteP.setReverse(
          (generatorControl.effect as GeneratorEffect).reverseSequence
        );
        noteP.setReflect(
          (generatorControl.effect as GeneratorEffect).reflectSequence
        );
        noteP.setReflectPitch(
          (generatorControl.effect as GeneratorEffect).reflectPitch
        );
      }
    }
  }
}

// find out if there is a sequence control for the current generator that occurs on or before the
// generator's stop time and then set the sequence for reversal and or reflection
// this only finds the first such control in time. Others are ignored
// export function processSequenceControls(
//   time: number,
//   fileContents: CMGFile,
//   generator: GeneratorType
// ) {
//   let control: Control | undefined = fileContents.controls.find((c) => {
//     if (c.time <= time + generator.stopTime && c.type == EFFECTTYPE.Generator) {
//       if (
//         c.list.findIndex(
//           (name) =>
//             name == generator.name &&
//             generator.type == GENERATORTYPE.Algorithmic &&
//             (generator as Algorithmic).noteP.algorithmType ==
//               ALGORITHMTYPE.Sequencer
//         )
//       ) {
//         return true;
//       }
//     }
//     return false;
//   });

//   if (control) {
//     const noteP: SequenceValues = (generator as Algorithmic)
//       .noteP as SequenceValues;
//     noteP.setReverse((control.effect as GeneratorEffect).reverseSequence);
//     noteP.setReflect((control.effect as GeneratorEffect).reflectSequence);
//     noteP.setReflectPitch((control.effect as GeneratorEffect).reflectPitch);
//   }
// }

// called during envelop processing to change the state of DSP processing
// during sample processing
// time is from the start of the sample,
// getPreset places the source at time from the generator starttime
export function activateDSPControls(
  time: number, // the real time of the start of the samplesample
  deltaT: number, // the time length of the sample
  generator: Algorithmic,
  fileContents: CMGFile
): void {
  // find any controls that are activated during the interval
  const controls: Control[] = [];
  for (let i = 0; i < fileContents.controls.length; i++) {
    const control: Control = fileContents.controls[i];
    if (
      control.time >= time &&
      control.time <= time + deltaT &&
      control.type != EFFECTTYPE.Global
    )
      controls.push(control);
  };

  // if there are none quite;
  if (controls.length == 0) return;
  console.log('activateDSPControls:', controls);

  // activate the track volume and/or tremolo
  const track: Track | null = findGeneratorParent(generator.name, fileContents);

  if (track) {
    for (let i = 0; i < controls.length; i++) {
      const control: Control = controls[i];
      if (
        control.type == EFFECTTYPE.Track &&
        control.list.findIndex((name) => name == track.name) >= 0
      ) {
        const effect: TrackEffect = control.effect as TrackEffect;
        track.initializeVolumeRamp(control.time, effect);
      }
    };
  }

  // activate the tremolo effect control
    for (let i = 0; i < controls.length; i++) {
      const control: Control = controls[i];
    if (
      control.type == EFFECTTYPE.Generator &&
      control.list.findIndex((name) => name == generator.name) >= 0
    ) {
      generator.tremeloEnabled = (
        control.effect as GeneratorEffect
      ).tremoloEnable;
      generator.vibratoEnabled = (
        control.effect as GeneratorEffect
      ).vibratoEnable;
      generator.noiseEnabled = (
        control.effect as GeneratorEffect
      ).noiseEnable;
    }
  };
}

// // 
// export function activateSampleControls (

// ): void {

// }
// // get the track volume, and generator noise, tremolo, and vibrato flags
// // from any active controller that addresses them
// // the volume ramp is when current time matches the track control's time
// export function processDSPControls(
//   time: number,
//   generator: GeneratorType,
//   activeControls: Control[],
//   fileContents: CMGFile
// ): void {
//   if (activeControls.length == 0) return;

//   // process a track volume control if there is one
//   const track: Track | null = findGeneratorParent(generator.name, fileContents);
//   if (track) {
//     const trackControl: Control | undefined = activeControls.find(
//       (c) =>
//         c.type == EFFECTTYPE.Track &&
//         c.list.findIndex((name) => name == track.name) >= 0
//     );
//     if (trackControl != undefined) {
//       if (trackControl.time <= time) {
//         // this will set the start time for the ramp at every time interval
//         // until the time bypasses the control's start time
//         track.initializeVolumeRamp(
//           trackControl.time,
//           trackControl.effect as TrackEffect
//         );
//       }
//     }
//   }

//   // process the DSP controls for the generator.
//   // all active controls are processed as they all have times
//   // less than the generators stopTime
//   activeControls.forEach((control) => {
//     if (
//       generator.type == GENERATORTYPE.Algorithmic &&
//       control.type == EFFECTTYPE.Generator &&
//       control.list.findIndex((name) => name == generator.name) >= 0
//     ) {
//       const effect: GeneratorEffect = control.effect as GeneratorEffect;
//       (generator as Algorithmic).setControlState(
//         effect.noiseEnable,
//         effect.tremoloEnable,
//         effect.vibratoEnable
//       );
//     }
//   });
// }
