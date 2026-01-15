import CMGFile from "classes/cmgfile";
import Stochastic from "classes/generators/stochastic";
import RandomNumber from "classes/randomnumber";
import buildSamples from "helpers/buildsamples";
import { RawSourceData, SAMPLERATE, StochasticValues, Voices } from "types";

// convert all of the stochastic elements in all clouds to audio samples
// and put them in the source data
export function getBufferSourceNodesFromStochastic(
  _fileContents: CMGFile,
  gen: Stochastic,
  sourceCount: number
): RawSourceData[] {
  const { startTime, stopTime } = gen;
  const v: StochasticValues = gen.values;

  // select only the voices that are not muted
  const muted: boolean[] = [...v.muted];
  const selectedVoices: Voices = [];
  for (let i = 0; i < v.voices.length; i++) {
    if (!muted[i]) selectedVoices.push(v.voices[i]);
  }
  // restart the random number genertor every time the composition samples are restarted
  v.rN = new RandomNumber(v.seed);
  const stereo = buildSamples ({
    delta: v.delta,
    Ne: gen.getNe(),
    Nt: v.Nt,
    Tc: v.Tc,
    composition: v.composition,
    voices: selectedVoices,
    panOption: v.panOption,
    panAlgorithm: v.panAlgorithm,
    panParameters: v.panParameters,
    intensityOption: v.intensityOption,
    intensityTransitionOption: v.intensityTransitionOption,
    intensityParameters: v.intensityParameters,
    rN: v.rN,
});
  const sample: Float32Array[] = [];
  sample.push(Float32Array.from(stereo[0]));
  sample.push(Float32Array.from(stereo[1]));
  const sourceData: RawSourceData[] = [];
  sourceData.push ({
    gen,
    index: sourceCount,
    source: {
      sample,
      sampleRate: SAMPLERATE,
      note: 0,
      playbackRate: 1.0,
      duration: stereo[0].length / SAMPLERATE,
      startTime,
      stopTime,
      started: false,
    },
    panner: {value: 0},
    vol: {value: 0},
  });
  return sourceData;
}
