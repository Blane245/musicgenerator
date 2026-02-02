import Chart from "classes/chart";
import CMGFile from "classes/cmgfile";
import Algorithmic from "classes/generators/algorithmic";
import Stochastic from "classes/generators/stochastic";
import {
  GENERATORTYPE,
  GeneratorType,
  PLAYMODE,
  SAMPLERATE,
  SourceData,
  TimelineInterval,
  VoiceHues,
} from "types";
import { bufferToMp3 } from "utils/buffertomp3";
import { bufferToWav } from "utils/buffertowav";
import getSourcesFromAlgorithmic from "./getsourcesfromalgorithmic";
import getSourcesFromStochastic from "./getsourcesfromstochastic";

// perform selection of generators based on the play mode and timeinterval
// then with the selected generators,
//  build their samples and assemble into a composite mpeg (of wav) file
//  place their definition (pitch1, time1, pitch2, time2) in the chart
//  after the chart is completely, convert it to an image for display
interface BuildSourceDataProps {
  mode: PLAYMODE;
  generator: GeneratorType | null;
  fileContents: CMGFile;
  timeInterval: TimelineInterval;
  windowWidth: number;
  windowHeight: number;
  recordFormat: string;
}
export default async function buildSourceData(
  props: BuildSourceDataProps,
): Promise<{
  error: string;
  sourceData?: SourceData;
}> {
  const {
    mode,
    generator,
    fileContents,
    timeInterval,
    windowWidth,
    windowHeight,
    recordFormat,
  } = props;
  // timeline interval selector
  const isSelected = (
    generator: GeneratorType,
    startTime: number,
    endTime: number,
  ): boolean => {
    if (generator.startTime >= startTime && generator.stopTime <= endTime) {
      return true;
    } else return false;
  };
  const generators: GeneratorType[] = [];
  let error: string = "";

  // perform generator filtering

  // first is filter for all generators using the timeInterval
  // or the mute/solo states
  if (mode == PLAYMODE.play) {
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
            generators.push(g);
          }
        });
      });
    } else {
      // find if there are any solo tracks
      const isSolo: boolean = fileContents.tracks.findIndex((t) => t.solo) >= 0;
      fileContents.tracks.forEach((t) => {
        if (!t.mute) {
          if ((isSolo && t.solo) || !isSolo) {
            t.generators.forEach((g: GeneratorType) => {
              if (!g.mute) {
                generators.push(g);
              }
            });
          }
        }
      });
    }
  } else if (mode == PLAYMODE.solo && generator) {
    // get the generator being soloed and shift its start time to zero
    if (!generator.mute) {
      generators.push(generator);
    }
    if (generators.length == 0) {
      error = "No generators are available to produce any sound";
      return { error };
    }
  }
  // we are now error free from filtering
  // first find the length of the composition for the last stop of
  // the selected generators
  let duration: number = 0;
  generators.forEach((g: GeneratorType) => {
    duration = Math.max(duration, g.stopTime);
  });
  if (duration == 0) {
    return { error: "composition duration is zero" };
  }

  // build the voice hues. Each unique combination of soundfontfile/presetname
  // within the algorithmic and stochastic generators gets a unique hue.
  // the unique voices are assembled, counted, and the the hue range
  // from 0-360 is divided evenly
  const voiceHues: VoiceHues = new Map<string, number>();
  for (let generator of generators) {
    if (generator.type == GENERATORTYPE.Algorithmic) {
      voiceHues.set(
        (generator as Algorithmic).soundFontFile +
          "|" +
          (generator as Algorithmic).presetName,
        0,
      );
    } else if (generator.type == GENERATORTYPE.Stochastic) {
      for (let voice of (generator as Stochastic).values.voices) {
        if (!voice.muted)
          voiceHues.set(voice.soundFontFile + "|" + voice.presetName, 0);
      }
    }
  }
  const voiceCount: number = Array.from(voiceHues.keys()).length;
  let iHue: number = 0;
  for (let key of voiceHues.keys()) {
    const hue: number = (360 * iHue) / voiceCount;
    voiceHues.set(key, hue);
    iHue++;
  }

  // construct the audio/chart from each generator
  const chartWidth: number = (Math.trunc(duration / 60) + 1) * windowWidth;
  const chartDuration: number = (Math.trunc(duration / 60) + 1) * 60;
  const chart: Chart = new Chart(chartWidth, windowHeight, chartDuration);
  //NOTE: the audiobuffer has a fixed length based on the initial duration of
  // the composition. In the case of stochastic generators, there could be
  // sound sample generated past this point as the exact end of the composition
  // is not known until it is built. If any sound is generated past the initial duration
  // it will be discarded. It is important that a Silent generator exists that extents past the
  // end of all stochastic generators by at least one time cell to avoid this from
  // happening. In the case where generators or soloed or selected by time interval,
  // it is quite likely that this truncation will occur.
  let audioBuffer: Float32Array[] = [];
  audioBuffer.push(new Float32Array(duration * SAMPLERATE).fill(0));
  audioBuffer.push(new Float32Array(duration * SAMPLERATE).fill(0));
  generators.forEach((g: GeneratorType) => {
    switch (g.type) {
      case GENERATORTYPE.Silent: // nothing to do here
        break;
      case GENERATORTYPE.Algorithmic:
        error = getSourcesFromAlgorithmic({
          generator: g as Algorithmic,
          audioBuffer,
          chart,
          voiceHues,
        });
        break;
      case GENERATORTYPE.Stochastic:
        error = getSourcesFromStochastic({
          generator: g as Stochastic,
          audioBuffer,
          chart,
          voiceHues,
        });
        break;
      // TODO maybe eliminate audiofiles
      //   case GENERATORTYPE.AudioFile:
      //     error = getSourcesFromAudioFile(
      //       g as AudioFile,
      //       audioBuffer,
      //       chart,
      //     );
      //     break;
    }
    if (error != "") return;
  });
  if (error != "") return { error };

  // convert the chart to an image and the audio to an mpeg or wav file
  const audio: Blob =
    recordFormat == "wav"
      ? bufferToWav(audioBuffer, SAMPLERATE)
      : bufferToMp3(audioBuffer, SAMPLERATE);

  const image: HTMLImageElement = await chart.toImgElem();

  return Promise.resolve({
    sourceData: { audio, image, voiceHues },
    error: "",
  });
}
