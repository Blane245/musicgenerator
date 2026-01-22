// activate a globalcontrol for review and record

import CMGFile from "classes/cmgfile";
import Control, {
  CONTROLTYPE,
  GeneratorControl,
  GlobalControl,
  TrackControl,
} from "classes/control";
import Algorithmic from "classes/generators/algorithmic";
import Track from "classes/track";
import { ActiveSource } from "types";

// activate the controls whose time is between the current time and
// the ahead time. This includes all control types
// only one control of each type can be active at a time
//    either replace the current one or add a new one
export function activateRealtimeControls(
  currentControls: Control[],
  currentTime: number,
  aheadTime: number,
  fileContents: CMGFile
): Control[] {
  const result: Control[] = currentControls;
  for (let i: number = 0; i < fileContents.controls.length; i++) {
    const control: Control = fileContents.controls[i];
    // console.log('locating controls at time, ahead time', currentTime, aheadTime, control.time);
    if (control.time >= currentTime && control.time <= aheadTime) {
      result.push(control);
      // console.log('control located at time', currentTime, control);
      switch (control.type) {
        case CONTROLTYPE.Global: {
          // replace a current global control or add a new one
          const index: number = currentControls.findIndex(
            (c: Control) => c.type == CONTROLTYPE.Global
          );
          if (index < 0) {
            result.push(control);
          } else {
            result.splice(index, 0, control);
          }
          (control as GlobalControl).initializeVolumeRamp(control.time);
          const { reverbEnable, compressorEnable, equalizerEnable, volume } =
            (control as GlobalControl).getCurrentValues(control.time);
          fileContents.reverb.setAttribute(
            "reverb.enabled",
            reverbEnable.toString()
          );
          fileContents.compressor.setAttribute(
            "compressor.enabled",
            compressorEnable.toString()
          );
          fileContents.equalizer.setAttribute(
            "equalizer.enabled",
            equalizerEnable.toString()
          );
          if (volume != undefined) fileContents.volume.setVolume(volume);

          break;
        }
        case CONTROLTYPE.Track: {
          fileContents.tracks.forEach((track: Track) => {
            const trackIndex: number = (control as TrackControl).values.list.findIndex(
              (name: string) => name == track.name
            );
            if (trackIndex >= 0) {
              // replace an current track control or add a new one
              const currentIndex: number = result.findIndex(
                (c: Control) =>
                  c.type == CONTROLTYPE.Track && (c as TrackControl).values.list[trackIndex] == track.name
              );
              if (currentIndex < 0) {
                result.push(control);
              } else {
                result.splice(currentIndex, 0, control);
              }
              track.initializeVolumeRamp(control.time, (control as TrackControl));
            }
          });
          break;
        }
        case CONTROLTYPE.Generator: {
          fileContents.tracks.forEach((track: Track) => {
            track.generators.forEach((generator) => {
              const generatorIndex: number = (control as GeneratorControl).values.list.findIndex(
                (name: string) => name == generator.name
              );
              if (generatorIndex >= 0) {
                // replace an current track control or add a new one
                const currentIndex: number = result.findIndex(
                  (c: Control) =>
                    c.type == CONTROLTYPE.Generator &&
                    (c as GeneratorControl).values.list[generatorIndex] == generator.name
                );
                if (currentIndex < 0) {
                  console.log("added new generator control", control);
                  result.push(control);
                } else {
                  console.log(
                    "replaced generator control with new one",
                    result[currentIndex],
                    control
                  );
                  result.splice(currentIndex, 0, control);
                }
                // only generator reverb is processed in realtime
                // other controls are handled during source DSP
                (generator as Algorithmic).reverbEnabled = (control as GeneratorControl).values.reverbEnable;
              }
            });
          });
          break;
        }
      }
    }
  }

  return result;
}

// update the room volume based on global control settings
export function processGlobalControls(
  time: number,
  controls: Control[],
  fileContents: CMGFile
): void {
  // console.log('controls at time', time, controls);
  for (let i: number = 0; i < controls.length; i++) {
    if (controls[i].type == CONTROLTYPE.Global) {
      const { volume } = (controls[i] as GlobalControl).getCurrentValues(
        time
      );
      // console.log('global controls set volume', volume, time);
      if (volume != undefined) fileContents.volume.setVolume(volume);
    }
  }
}

// handle active source reverb enabling in realtime
export function processActiveSources(
  sources: ActiveSource[],
  controls: Control[]
): void {
  for (let i: number = 0; i < sources.length; i++) {
    const genName: string = sources[i].gen.name;
    const source: ActiveSource = sources[i];
    for (let j: number = 0; j < controls.length; j++) {
      if (
        controls[j].type == CONTROLTYPE.Generator &&
        (controls[j] as GeneratorControl).values.list.findIndex((name: string) => name == genName) >= 0
      ) {
        // change the reverb setting when it updates
        const gen: Algorithmic = source.gen as Algorithmic;
        if (gen.reverbEnabled != (controls[j] as GeneratorControl).values.reverbEnable) {
          gen.setReverbEnabled((controls[j] as GeneratorControl).values.reverbEnable);
          // console.log(
          //   "processActiveSources: generator reverb enable changed",
          //   gen
          // );
        }
      }
    }
  }
}
