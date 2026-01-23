import Stochastic from "classes/generators/stochastic";
import RandomNumber from "classes/randomnumber";
import buildSamples from "helpers/buildsamples";
import { dBToGain } from "sfcomponents/util";
import { RawSourceData, SAMPLERATE, StochasticValues, Voices } from "types";

// convert all of the stochastic elements in all clouds to audio samples
// and put them in the source data
export function getBufferSourceNodesFromStochastic(
  gen: Stochastic,
  sourceCount: number
): RawSourceData[] {
  const { startTime, stopTime } = gen;
  const v: StochasticValues = gen.values;

  // select only the voices that are not muted
  const selectedVoices: Voices = [];
  for (let i = 0; i < v.voices.length; i++) {
    if (!v.voices[i].muted) selectedVoices.push(v.voices[i]);
  }

  // restart the random number genertor every time the composition dynamics are restarted
  v.dynamicsRN = new RandomNumber(v.dynamicsSeed);
  const stereo = buildSamples ({
    generator: gen,
    voices: selectedVoices,
    trackGain: dBToGain(gen.parent.volume),
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
