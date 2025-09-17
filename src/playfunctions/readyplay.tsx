// determine what is to be scheduled for generator based on
// proper definition and selection filters
import CMGFile from "../classes/cmgfile";
import { Algorithmic, AudioFile, Silent } from "../classes/generators";
import {
  GeneratorType,
  GENERATORTYPE,
  PLAYMODE,
  TimelineInterval,
} from "../types";

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

      // // find the selected generator with the earliest start time
      // const firstGeneratorTime: number = findEarliestSelected(
      //   fileContents,
      //   startTime,
      //   endTime
      // );
      // if (firstGeneratorTime == Number.MAX_VALUE) {
      //   return {
      //     AlgorithmicGenerators,
      //     AudioFileGenerators,
      //     SilentGenerators,
      //     error: "No generator found to play",
      //   };
      // }
      fileContents.tracks.forEach((t) => {
        t.generators.forEach((g) => {
          if (isSelected(g, startTime, endTime)) {
            // move the generators time back to zero with the
            // earliest selected as zero and the others following
            // const thisG: GeneratorType = g.copy();
            // thisG.startTime = thisG.startTime - firstGeneratorTime;
            // thisG.stopTime = thisG.stopTime - firstGeneratorTime;
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

      // // adjust the active generators start and stop time based on the
      // // offset
      // if (offsetTime > 0) {
      //   AlgorithmicGenerators = AlgorithmicGenerators.map((g) => {
      //     const n = g.copy();
      //     n.startTime -= offsetTime;
      //     n.stopTime -= offsetTime;
      //     return n;
      //   });
      //   AudioFileGenerators = AudioFileGenerators.map((g) => {
      //     const n = g.copy();
      //     n.startTime -= offsetTime;
      //     n.stopTime -= offsetTime;
      //     return n;
      //   });
      //   SilentGenerators = SilentGenerators.map((g) => {
      //     const n = g.copy();
      //     n.startTime -= offsetTime;
      //     n.stopTime -= offsetTime;
      //     return n;
      //   });
      //   playbackLength -= offsetTime;
      // }
    }
    // get the generator being soloed and shift its start time to zero
  } else if (mode == PLAYMODE.solo && generator) {
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
