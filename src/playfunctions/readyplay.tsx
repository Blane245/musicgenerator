// determine what is to be scheduled for generator based on
// proper definition and selection filters
import { Algorithmic } from "classes/generators/algorithmic";
import CMGFile from "../classes/cmgfile";
import {
  GeneratorType,
  GENERATORTYPE,
  PLAYMODE,
  TimelineInterval,
} from "../types";
import { AudioFile } from "classes/generators/audiofile";
import { Silent } from "classes/generators/silent";

// timeline interval selector
function isSelected(
  generator: GeneratorType,
  startTime: number,
  endTime: number
): boolean {
  if (generator.startTime >= startTime && generator.stopTime <= endTime) {
    return true;
  } else return false;
}

export interface ReadyPlayProps {
  mode: PLAYMODE;
  generator: GeneratorType | null;
  fileContents: CMGFile;
  timeInterval: TimelineInterval;
}
// build the list of generators to the used
export default function ReadyPlay(props: ReadyPlayProps): {
  AlgorithmicGenerators: Algorithmic[];
  AudioFileGenerators: AudioFile[];
  SilentGenerators: Silent[];
  error: string;
} {
  const { mode, generator, fileContents, timeInterval } = props;
  let AlgorithmicGenerators: Algorithmic[] = [];
  let AudioFileGenerators: AudioFile[] = [];
  let SilentGenerators: Silent[] = [];
  let error: string = "";

  // get the active generators for the entire rendering
  if (mode == PLAYMODE.preview || mode == PLAYMODE.record) {
    // the timeline interval overrides other filters
    if (
      timeInterval.startTime != undefined &&
      timeInterval.endTime != undefined &&
      timeInterval.startTime != timeInterval.endTime
    ) {
      const startTime: number = timeInterval.startTime;
      const endTime: number = timeInterval.endTime;

      fileContents.tracks.forEach((t) => {
        t.generators.forEach((g) => {
          if (isSelected(g, startTime, endTime)) {
            if (g.type == GENERATORTYPE.Algorithmic)
              AlgorithmicGenerators.push(g as Algorithmic);
            if (g.type == GENERATORTYPE.AudioFile)
              AudioFileGenerators.push(g as AudioFile);
            if (g.type == GENERATORTYPE.Silent)
              SilentGenerators.push(g as Silent);
          }
        });
      });
    } else {
      // find if there are any solo tracks
      let isSolo: boolean = fileContents.tracks.findIndex((t) => t.solo) >= 0;
      fileContents.tracks.forEach((t) => {
        if (!t.mute) {
          if ((isSolo && t.solo) || !isSolo) {
            t.generators.forEach((g: GeneratorType) => {
              if (!g.mute) {
                if (g.type == GENERATORTYPE.Algorithmic) {
                  if (!(g as Algorithmic).preset) {
                    error = `Generator '${g.name}' on track '${t.name}' does not have a preset assigned.`;
                    return;
                  } else {
                    AlgorithmicGenerators.push(g as Algorithmic);
                  }
                }
                if (g.type == GENERATORTYPE.AudioFile) {
                  AudioFileGenerators.push(g as AudioFile);
                }
                if (g.type == GENERATORTYPE.Silent) {
                  SilentGenerators.push(g as Silent);
                }
              }
            });
          }
        }
      });
    }

  } else if (mode == PLAYMODE.solo && generator) {
    // get the generator being soloed and shift its start time to zero
    if (!generator.mute) {
      if (generator.type == GENERATORTYPE.Algorithmic) {
        AlgorithmicGenerators.push(generator as Algorithmic);
      } else if (generator.type == GENERATORTYPE.AudioFile) {
        AudioFileGenerators.push(generator as AudioFile);
      } else if (generator.type == GENERATORTYPE.Silent) {
        SilentGenerators.push(generator as Silent);
      }
    }
  }
  if (
    AlgorithmicGenerators.length == 0 &&
    AudioFileGenerators.length == 0 &&
    SilentGenerators.length == 0 &&
    error == ""
  ) {
    error = "No generators are available to produce any sound";
  }
  return {
    AlgorithmicGenerators,
    AudioFileGenerators,
    SilentGenerators,
    error,
  };
}
