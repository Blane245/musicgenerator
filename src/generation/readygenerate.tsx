// determine what is to be scheduled for generator based on
// proper definition and selection filters

import AudioFile from "../classes/audiofile";
import CMGFile from "../classes/cmgfile";
import { Algorithmic } from "../classes/generators";
import {
  GeneratorType,
  GENERATIONMODE,
  GENERATORTYPE,
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

// find the selected generator that has the earliest start time
// used to shift all generators to the left in time
function findEarliestSelected(
  fileContents: CMGFile,
  startTime: number,
  endTime: number
): number {
  let earliest: number = Number.MAX_VALUE;
  fileContents.tracks.forEach((t) => {
    t.generators.forEach((g) => {
      if (isSelected(g, startTime, endTime))
        earliest = Math.min(earliest, g.startTime);
    });
  });
  return earliest;
}

export interface ReadyGenerateProps {
  mode: GENERATIONMODE;
  generator: GeneratorType | null;
  fileContents: CMGFile;
  timeInterval: TimelineInterval;
}
// build the list of generators to the used
export default function ReadyGenerate(props: ReadyGenerateProps): {
  AlgorithmicGenerators: Algorithmic[];
  AudioFileGenerators: AudioFile[];
  playbackLength: number;
  offsetTime: number;
  error: string;
} {
  const { mode, generator, fileContents, timeInterval } = props;
  const AlgorithmicGenerators: Algorithmic[] = [];
  const AudioFileGenerators: AudioFile[] = [];
  let playbackLength: number = 0;
  let error: string = "";
  let offsetTime: number = 0;

  // get the active generators for the entire rendering
  if (mode == GENERATIONMODE.preview || mode == GENERATIONMODE.record) {
    // the timeline interval overrides other filters
    if (
      timeInterval.startTime != undefined &&
      timeInterval.endTime != undefined
    ) {
      const startTime: number = timeInterval.startTime;
      const endTime: number = timeInterval.endTime;

      // find the slected generator with the earliest start time
      const firstGeneratorTime: number = findEarliestSelected(
        fileContents,
        startTime,
        endTime
      );
      offsetTime = firstGeneratorTime;
      fileContents.tracks.forEach((t) => {
        t.generators.forEach((g) => {
          if (isSelected(g, startTime, endTime)) {
            // move the generators time back to zero with the
            // earliest selected as zero and the others following
            const thisG: GeneratorType = g.copy();
            thisG.startTime = thisG.startTime - firstGeneratorTime;
            thisG.stopTime = thisG.stopTime - firstGeneratorTime;
            if (g.type == GENERATORTYPE.Algorithmic)
              AlgorithmicGenerators.push(thisG as Algorithmic);
            if (g.type == GENERATORTYPE.AudioFile)
              AudioFileGenerators.push(thisG as AudioFile);
            playbackLength = Math.max(thisG.stopTime + 1, playbackLength);
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
                playbackLength = Math.max(playbackLength, g.stopTime + 1);
              }
            });
          }
        }
      });
    }
    // get the generator being soloed and shift its start time to zero
  } else if (mode == GENERATIONMODE.solo && generator) {
    offsetTime = generator.startTime;
    if (!generator.mute) {
      if (generator.type == GENERATORTYPE.Algorithmic) {
        const tempGen: Algorithmic = (generator as Algorithmic).copy();
        tempGen.stopTime = tempGen.stopTime - tempGen.startTime;
        tempGen.startTime = 0;
        AlgorithmicGenerators.push(tempGen);
        playbackLength = tempGen.stopTime + 1;
      } else if (generator.type == GENERATORTYPE.AudioFile) {
        const tempGen: AudioFile = (generator as AudioFile).copy();
        tempGen.stopTime = tempGen.stopTime - tempGen.startTime;
        tempGen.startTime = 0;
        AudioFileGenerators.push(tempGen);
        playbackLength = tempGen.stopTime + 1;
      }
    }
  }
  if (
    AlgorithmicGenerators.length == 0 &&
    AudioFileGenerators.length == 0 &&
    error == ""
  ) {
    error = "No generators are available to produce any sound";
  }
  return {
    AlgorithmicGenerators,
    AudioFileGenerators,
    playbackLength,
    offsetTime,
    error: "",
  };
}
