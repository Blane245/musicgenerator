import { SAMPLERATE } from "types";
import { debug } from "utils/debug";

// third, if using glizzando, apply the variable playback rate
export default function buildElementSamples(props: {
  interval: number;
  duration: number;
  instrumentSample: Float32Array;
  instrumentSampleRate: number;
  cents1: number;
  cents2: number;
  loop: boolean;
  loopStart: number;
  loopEnd: number;
  gain: number;
}): number[] {
  const {
    interval,
    duration,
    instrumentSample,
    instrumentSampleRate,
    cents1,
    cents2,
    loop,
    loopStart,
    loopEnd,
    gain,
  } = props;

  // resample the instrument sample to SAMPLERATE
  // if pitch 2 is not pitch 1 adjust the playbackrate as we go
  if (interval == 0) return [];
  if (instrumentSample.length == 0) return [];
  const playbackRate1: number = 1.0 * Math.pow(2, cents1 / 1200);
  const playbackRate2: number =
    cents1 == cents2 ? playbackRate1 : 1.0 * Math.pow(2, cents2 / 1200);
  const sampleDuration: number =
    duration == 0 ? interval : Math.min(interval, duration);
  const outputCount: number = Math.trunc(SAMPLERATE * sampleDuration);
  const resampleRatio: number = instrumentSampleRate / SAMPLERATE;
  let j: number = 0;
  let t: number = 0;
  const deltaT: number = 1 / SAMPLERATE;
  let currentIndex: number = 0;
  const slope: number = (cents2 - cents1) / interval;
  const result: number[] = Array<number>(outputCount).fill(0);
  debug.info(`buildElementSamples: resampling out size=${outputCount}, playbackrate 1 = ${playbackRate1}, playbackrate 2 = ${playbackRate2}, instrument same rate=${instrumentSampleRate}, resampleratio=${resampleRatio}, duration=${sampleDuration}`)
  for (let i = 0; i < outputCount; i++) {
    j = Math.trunc(currentIndex);
    if (loop) {
      if (j >= loopEnd - 1) {
        j = loopStart;
        currentIndex = loopStart;
      }
      result[i] = instrumentSample[j] * gain;
    } else if (j <= instrumentSample.length - 1) {
      result[i] = instrumentSample[j];
    } else result[i] = 0;

    // now need to determine the index of the input sample
    // based on the output sample rate, and the two playback rates
    let playbackRate: number = playbackRate1;
    if (playbackRate1 != playbackRate2) {
      const newCents: number = cents1 + t * slope;
      playbackRate = 1.0 * Math.pow(2, newCents / 1200);
    }
    const compositeRate: number = playbackRate * resampleRatio;
    currentIndex += compositeRate;
    if (currentIndex > instrumentSample.length - 1) {
      if (loop) currentIndex = loopStart;
      else currentIndex -= instrumentSample.length - 1;
    }
    t += deltaT;
  }

  // apply a short attack filter to kill some of the popping
  // trying 50ms
  // TODO not working for bass in SMW.
  const attackCount: number = Math.min(outputCount, Math.trunc(SAMPLERATE * 0.05));
  for (let i = 0; i < attackCount; i++) {
    result[i] = result[i] * i / attackCount;
  }

  return result;
}
