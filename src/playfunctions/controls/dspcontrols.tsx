// activate and process controls that affect signal processing of the
// sources

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

// activate and process last track or generator control that proceeds
// the generator startTime. Done when generator processing starts source processing
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
      generator.setReverbEnabled(
        (generatorControl.effect as GeneratorEffect).reverbEnable
      );
      if (generator.noteP.algorithmType == ALGORITHMTYPE.Sequencer) {
      }
    }
  }
}

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
  }

  // if there are none quite;
  if (controls.length == 0) return;
  console.log(
    "activateDSPControls: activating controls at time",
    controls,
    time
  );

  // activate the track volume
  const track: Track = generator.parent;

  for (let i = 0; i < controls.length; i++) {
    const control: Control = controls[i];
    if (
      control.type == EFFECTTYPE.Track &&
      control.list.findIndex((name) => name == track.name) >= 0
    ) {
      const effect: TrackEffect = control.effect as TrackEffect;
      track.initializeVolumeRamp(control.time, effect);
      console.log(
        "activateDSPControls: track volume initialized for track at time ",
        track.name,
        time
      );
    }
  }

  // activate the generator controls
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
      generator.noiseEnabled = (control.effect as GeneratorEffect).noiseEnable;
      console.log(
        "activateDSPControls: generator controls changed for generator at time ",
        generator,
        time
      );
    }
  }
}
