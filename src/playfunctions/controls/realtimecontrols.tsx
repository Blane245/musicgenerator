// activate a globalcontrol for review and record

import CMGFile from "classes/cmgfile";
import {
  Control,
  EFFECTTYPE,
  GeneratorEffect,
  GlobalEffect,
  TrackEffect,
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
    if (control.time > currentTime && control.time < aheadTime) {
      result.push(control);
      switch (control.type) {
        case EFFECTTYPE.Global: {
          const effect: GlobalEffect = control.effect as GlobalEffect;
          // replace a current global control or add a new one
          const index: number = currentControls.findIndex(
            (c: Control) => c.type == EFFECTTYPE.Global
          );
          if (index < 0) {
            result.push(control);
          } else {
            result.splice(index, 0, control);
          }
          effect.initializeVolumeRamp(control.time);
          const { reverbEnable, compressorEnable, equalizerEnable, volume } =
            effect.getCurrentValues(control.time);
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
          fileContents.volume.setVolume(volume);
          break;
        }
        case EFFECTTYPE.Track: {
          const effect: TrackEffect = control.effect as TrackEffect;
          fileContents.tracks.forEach((track: Track) => {
            const trackIndex: number = control.list.findIndex(
              (name: string) => name == track.name
            );
            if (trackIndex >= 0) {
              // replace an current track control or add a new one
              const currentIndex: number = result.findIndex(
                (c: Control) =>
                  c.type == EFFECTTYPE.Track && c.list[trackIndex] == track.name
              );
              if (currentIndex < 0) {
                result.push(control);
              } else {
                result.splice(currentIndex, 0, control);
              }
              track.initializeVolumeRamp(control.time, effect);
            }
          });
          break;
        }
        case EFFECTTYPE.Generator: {
          const effect: GeneratorEffect = control.effect as GeneratorEffect;
          fileContents.tracks.forEach((track: Track) => {
            track.generators.forEach((generator) => {
              const generatorIndex: number = control.list.findIndex(
                (name: string) => name == generator.name
              );
              if (generatorIndex >= 0) {
                // replace an current track control or add a new one
                const currentIndex: number = result.findIndex(
                  (c: Control) =>
                    c.type == EFFECTTYPE.Generator &&
                    c.list[generatorIndex] == generator.name
                );
                if (currentIndex < 0) {
                  console.log('added new generator control', control)
                  result.push(control);
                } else {
                  console.log('replaced generator control with new one', result[currentIndex], control);
                  result.splice(currentIndex, 0, control);
                }
                // only generator reverb is processed in realtime
                // other effects are handled during source DSP
                (generator as Algorithmic).reverbEnabled = effect.reverbEnable;
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
  for (let i: number = 0; i < controls.length; i++) {
    if (controls[i].type == EFFECTTYPE.Global) {
      const { volume } = (controls[i].effect as GlobalEffect).getCurrentValues(
        time
      );
      fileContents.volume.setVolume(volume);
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
        controls[j].type == EFFECTTYPE.Generator &&
        controls[j].list.findIndex((name: string) => name == genName) >= 0
      ) {
        // change the reverb setting when it updates
        const effect: GeneratorEffect = controls[j].effect as GeneratorEffect;
        const gen: Algorithmic = source.gen as Algorithmic;
        if (gen.reverbEnabled != effect.reverbEnable) {
          gen.setReverbEnabled(effect.reverbEnable);
            // console.log(
            //   "processActiveSources: generator reverb enable changed",
            //   gen
            // );
        }
      }
    }
  }
}
