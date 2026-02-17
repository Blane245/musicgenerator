import CMGFile from "classes/cmgfile";
import Track from "classes/track";
import { GeneratorType, TimelineInterval } from "types";

interface ReadyPlayProps {
  generator: GeneratorType | null;
  fileContents: CMGFile;
  timeInterval: TimelineInterval;
}
/**
 * determine which generators are selected. Get the total duration
 */
export default function readyPlay(props: ReadyPlayProps): {
  generators?: GeneratorType[];
  duration?: number;
  error: string;
} {
  const { generator, fileContents, timeInterval } = props;

  const generators: GeneratorType[] = [];
  let error: string = "";
  let duration: number = 0;

  // if a generator is not provided, use the timeinterval, track solo/mute, and generator
  // mute properties to select the generators.
  if (!generator) {
    // timinterval overrides track solo/mute and generator mute
    if (
      timeInterval.startTime != undefined &&
      timeInterval.endTime != undefined &&
      timeInterval.startTime != timeInterval.endTime
    ) {
      const startTime: number = timeInterval.startTime;
      const endTime: number = timeInterval.endTime;

      fileContents.tracks.forEach((t: Track) => {
        t.generators.forEach((g: GeneratorType) => {
          if (g.startTime >= startTime && g.stopTime <= endTime) {
            generators.push(g);
          }
        });
      });
    } else {
      // handle track solo/mute and generator mute
      const isSolo: boolean = fileContents.tracks.findIndex((t) => t.solo) >= 0;
      fileContents.tracks.forEach((t: Track) => {
        if (!t.mute) {
          if ((isSolo && t.solo) || !isSolo) {
            t.generators.forEach((g: GeneratorType) => {
              if (!g.mute) {
                generators.push(g);
                duration = Math.max(duration, g.stopTime);
              }
            });
          }
        }
      });
    }
  } else {
    // get the generator being soloed
    generators.push(generator);
    duration = generator.stopTime;
  }

  // make sure we have at least 1 generator to realize and the duration is nonzero
  if (generators.length == 0) {
    error = "No generators are available to produce any sound";
    return { error };
  }
  if (duration == 0) {
    return { error: "Composition duration is zero" };
  }

  return { generators, duration, error: "" };
}
