// determine if everything is ready for generation

import AudioFile from "../classes/audiofile";
import CMGFile from "../classes/cmgfile";
import Noise from "../classes/noise";
import SFPG from "../classes/sfpg";
import SFRG from "../classes/sfrg";
import {
  CMGeneratorType,
  GENERATIONMODE,
  GENERATORTYPE,
  TimelineInterval,
} from "../types";

function isSelected(
  generator: CMGeneratorType,
  startTime: number,
  endTime: number
): boolean {
  if (generator.startTime >= startTime && generator.stopTime <= endTime) {
    return true;
  } else return false;
}

// find the selected generator that has the earliest start time
function findEarliestSelected(
  fileContents: CMGFile,
  startTime: number,
  endTime: number
): number {
  let earliest: number = 1e65;
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
  generator: CMGeneratorType | null;
  fileContents: CMGFile;
  timeInterval: TimelineInterval;
}
// build the list of generators to the used
export default function ReadyGenerate(props: ReadyGenerateProps): {
  SFPGenerators: SFPG[];
  SFRGenerators: SFRG[];
  NoiseGenerators: Noise[];
  AudioFileGenerators: AudioFile[];
  playbackLength: number;
  offsetTime: number;
  error: string;
} {
  const { mode, generator, fileContents, timeInterval } = props;
  const SFPGenerators: SFPG[] = [];
  const SFRGenerators: SFRG[] = [];
  const NoiseGenerators: Noise[] = [];
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
            const thisG = g.copy();
            thisG.startTime = thisG.startTime - firstGeneratorTime;
            thisG.stopTime = thisG.stopTime - firstGeneratorTime;
            if (g.type == GENERATORTYPE.SFPG) SFPGenerators.push(thisG as SFPG);
            if (g.type == GENERATORTYPE.SFRG) SFRGenerators.push(thisG as SFRG);
            if (g.type == GENERATORTYPE.Noise)
              NoiseGenerators.push(thisG as Noise);
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
            t.generators.forEach((g: CMGeneratorType) => {
              if (!g.mute) {
                if (g.type == GENERATORTYPE.SFPG) {
                  if (!(g as SFPG).preset) {
                    error = `Generator '${g.name}' on track '${t.name}' does not have a preset assigned.`;
                    return;
                  } else {
                    SFPGenerators.push(g as SFPG);
                  }
                }
                if (g.type == GENERATORTYPE.SFRG) {
                  if (!(g as SFRG).preset) {
                    error = `Generator '${g.name}' on track '${t.name}' does not have a preset assigned.`;
                    return;
                  } else {
                    SFRGenerators.push(g as SFRG);
                  }
                }
                if (g.type == GENERATORTYPE.Noise) {
                  NoiseGenerators.push(g as Noise);
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
      if (generator.type == GENERATORTYPE.SFPG) {
        const tempGen: SFPG = (generator as SFPG).copy();
        tempGen.stopTime = tempGen.stopTime - tempGen.startTime;
        tempGen.startTime = 0;
        SFPGenerators.push(tempGen);
        playbackLength = tempGen.stopTime + 1;
      } else if (generator.type == GENERATORTYPE.SFRG) {
        const tempGen: SFRG = (generator as SFRG).copy();
        tempGen.stopTime = tempGen.stopTime - tempGen.startTime;
        tempGen.startTime = 0;
        SFRGenerators.push(tempGen);
        playbackLength = tempGen.stopTime + 1;
      } else if (generator.type == GENERATORTYPE.Noise) {
        const tempGen: Noise = (generator as Noise).copy();
        tempGen.stopTime = tempGen.stopTime - tempGen.startTime;
        tempGen.startTime = 0;
        NoiseGenerators.push(tempGen);
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
    SFPGenerators.length == 0 &&
    SFRGenerators.length == 0 &&
    NoiseGenerators.length == 0 &&
    error == ""
  ) {
    error = "No generators are available to produce any sound";
  }
  return {
    SFPGenerators,
    SFRGenerators,
    NoiseGenerators,
    AudioFileGenerators,
    playbackLength,
    offsetTime,
    error: "",
  };
}
