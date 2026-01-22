// activate and process controls that affect signal processing of the
// sources

import CMGFile from "classes/cmgfile";
import Control, {
  CONTROLTYPE,
  GeneratorControl,
  TrackControl,
} from "classes/control";
import Algorithmic from "classes/generators/algorithmic";
import Track from "classes/track";

// activate and process last track or generator control that proceeds
// the generator startTime. Done when generator processing starts source processing
export function activatePriorControls(
  generator: Algorithmic,
  fileContents: CMGFile,
) {
  let trackControl: Control | null = null;
  const track: Track = generator.parent;
  for (let i = fileContents.controls.length - 1; i >= 0 && !trackControl; i--) {
    if (
      fileContents.controls[i].type == CONTROLTYPE.Track &&
      (fileContents.controls[i] as TrackControl).time <= generator.startTime &&
      (fileContents.controls[i] as TrackControl).values.list.findIndex(
        (name: string) => name == track.name,
      )
    ) {
      trackControl = fileContents.controls[i];
    }
  }
  if (trackControl) {
    track.initializeVolumeRamp(trackControl.time, trackControl as TrackControl);
  }

  // find the generator control preceding the start time and initialize it
  let generatorControl: GeneratorControl | null = null;
  for (
    let i = fileContents.controls.length - 1;
    i >= 0 && !generatorControl;
    i--
  ) {
    if (
      fileContents.controls[i].type == CONTROLTYPE.Generator &&
      fileContents.controls[i].time <= generator.startTime
    ) {
      generatorControl = fileContents.controls[i] as GeneratorControl;
    }
  }
  if (generatorControl) {
    generator.tremoloEnabled = generatorControl.values.tremoloEnable;
    generator.vibratoEnabled = generatorControl.values.vibratoEnable;
    generator.noiseEnabled = generatorControl.values.noiseEnable;
    generator.setReverbEnabled(generatorControl.values.reverbEnable);
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
  fileContents: CMGFile,
): void {
  // find any controls that are activated during the interval
  const controls: Control[] = [];
  for (let i = 0; i < fileContents.controls.length; i++) {
    const control: Control = fileContents.controls[i];
    if (
      control.time >= time &&
      control.time <= time + deltaT &&
      control.type != CONTROLTYPE.Global
    )
      controls.push(control);
  }

  // if there are none quite;
  if (controls.length == 0) return;
  console.log(
    "activateDSPControls: activating controls at time",
    controls,
    time,
  );

  // activate the track volume
  const track: Track = generator.parent;

  for (let i = 0; i < controls.length; i++) {
    const control: Control = controls[i];
    if (
      control.type == CONTROLTYPE.Track &&
      (control as TrackControl).values.list.findIndex(
        (name) => name == track.name,
      ) >= 0
    ) {
      track.initializeVolumeRamp(control.time, control as TrackControl);
      console.log(
        "activateDSPControls: track volume initialized for track at time ",
        track.name,
        time,
      );
    }
  }

  // activate the generator controls
  for (let i = 0; i < controls.length; i++) {
    const control: Control = controls[i];
    if (
      control.type == CONTROLTYPE.Generator &&
      (control as GeneratorControl).values.list.findIndex(
        (name) => name == generator.name,
      ) >= 0
    ) {
      generator.tremoloEnabled = (
        control as GeneratorControl
      ).values.tremoloEnable;
      generator.vibratoEnabled = (
        control as GeneratorControl
      ).values.vibratoEnable;
      generator.noiseEnabled = (control as GeneratorControl).values.noiseEnable;
      console.log(
        "activateDSPControls: generator controls changed for generator at time ",
        generator,
        time,
      );
    }
  }
}
