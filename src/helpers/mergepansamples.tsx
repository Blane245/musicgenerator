// given two pan channels
// merge them in with the audio buffer
// and them place their tones and times in the graphics chart.
// only the start time is needed, as the instrument's sample count will
// determine the end time
// 'time' is relative to the beginning of the composition
// 'sampleTime' is relative to the start of the input sample
// the longest nonzero left/right channel sample determines the length of the chart graphic

import Chart from "classes/chart";
import { SAMPLERATE } from "types";
import { debug } from "utils/debug";

interface MergedPanSamplesProps {
  time: number; // the time of the output sample
  panSamples: Float32Array[]; // two channels, both of same length
  pitch1: number;
  pitch2: number;
  sampletime: number; // the time of this sample relative to the output sample
  audioBuffer: Float32Array[]; // the current comnposition sample
  chart: Chart;
  hue: number | undefined;
}
export default function mergePanSamples(props: MergedPanSamplesProps) {
  const {
    time,
    panSamples,
    pitch1,
    pitch2,
    sampletime,
    audioBuffer,
    chart,
    hue,
  } = props;

  // add the input sample to the output with possible extension
  const startOutput: number = Math.trunc(sampletime * SAMPLERATE);
  // NOTE: this is where sound truncation could occur. see 'buildsourcedata'
  const endOutput: number = Math.min(
    startOutput + panSamples[0].length,
    audioBuffer[0].length,
  );
  for (let i = startOutput; i < endOutput; i++) {
    audioBuffer[0][i] += panSamples[0][i - startOutput];
    audioBuffer[1][i] += panSamples[1][i - startOutput];
  }

  // add the sound to the chart by
  // finding the last sound in pan sample that is not zero
  // and using that as the duration of the note
  // NOTE: this could extend past the end of the composition. So be it.
  let endSample: number = -1;
  for (let i = panSamples[0].length - 1; i >= 0 && endSample < 0; i--) {
    if (panSamples[0][i] != 0 || panSamples[0][i] != 0) {
      endSample = i;
    }
  }
  const sampleLength: number =
    (endSample < 0 ? panSamples[0].length : endSample) / SAMPLERATE;
  chart.addSource({
    from: { midi: pitch1, time: time + sampletime, hue: hue ? hue : 0 },
    to: {
      midi: pitch2,
      time: time + sampletime + sampleLength,
      hue: hue ? hue : 0,
    },
  });
  debug.info(
    "mergePanSamples: added source to audio and to chart @ time1, time2, midi1, midi2, hue",
    time + sampletime,
    time + sampletime + sampleLength,
    pitch1,
    pitch2,
    hue,
  );
}
