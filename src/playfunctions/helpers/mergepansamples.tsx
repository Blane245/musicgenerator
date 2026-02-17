// given two pan channels
// merge them in with the audio buffer
// and them place their tones and times in the graphics chart.
// only the start time is needed, as the instrument's sample count will
// determine the end time
// 'time' is relative to the beginning of the composition
// 'sampleTime' is relative to the start of the input sample
// the longest nonzero left/right channel sample determines the length of the chart graphic

import { SAMPLERATE } from "types";
import addBuffer from "utils/addbuffer";
import { debug } from "utils/debug";
import ChartCollector from "workers/chartcollector";
import { pantoLeftRight } from "./algorithms/panutils";

interface MergePanSamplesProps {
  sample: Float32Array; // two channels, both of same length
  pan: number; // the pan value
  pitch1: number;
  pitch2: number;
  sampletime: number; // the time of this sample relative to the output sample
  audioBuffer: Float32Array[]; // the current comnposition sample
  chart: ChartCollector;
  hue: number | undefined;
}
export default function mergePanSamples(props: MergePanSamplesProps) {
  const {
    sample,
    pan,
    pitch1,
    pitch2,
    sampletime,
    audioBuffer,
    chart,
    hue,
  } = props;

  // pan the sample 
  const panSample: Float32Array[] = [new Float32Array(sample.length), new Float32Array(sample.length)];
  const {left, right} = pantoLeftRight(pan);
    for (let i = 0; i < sample.length; i++) {
    panSample[0][i] = sample[i] * left;
    panSample[1][i] = sample[i] * right;
  }

  // add the input sample to the output
  addBuffer(audioBuffer, panSample, Math.trunc(sampletime * SAMPLERATE) )

  // add the sound to the chart by
  // finding the last sound in pan sample that is not zero
  // and using that as the duration of the note
  // NOTE: this could extend past the end of the composition. So be it.
  let endSample: number = -1;
  for (let i = panSample[0].length - 1; i >= 0 && endSample < 0; i--) {
    if (panSample[0][i] != 0 || panSample[0][i] != 0) {
      endSample = i;
    }
  }
  const sampleLength: number =
    (endSample < 0 ? panSample[0].length : endSample) / SAMPLERATE;
  chart.addSource({
    from: { midi: pitch1, time: sampletime, hue: hue ? hue : 0 },
    to: {
      midi: pitch2,
      time: sampletime + sampleLength,
      hue: hue ? hue : 0,
    },
  });
  debug.info(
    "mergePanSamples: added source to audio and to chart @ time1, time2, midi1, midi2, hue",
    sampletime,
    sampletime + sampleLength,
    pitch1,
    pitch2,
    hue,
  );
}
