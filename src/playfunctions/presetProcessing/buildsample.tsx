import CMGFile from "classes/cmgfile";
import Algorithmic from "classes/generators/algorithmic";
import Track from "classes/track";
import { activateDSPControls } from "playfunctions/controls/dspcontrols";
import { dBToGain, midiToFrequency } from "sfcomponents/util";
import { GainEnvelope } from "types";
import { linearInterpolate } from "utils/interpolation";
import { getSampleWithNoise } from "./applynoise";

// since the introdution of controls, all sample processing has to occur in this
// function. Controls are initiated during the time intervals of signal processing
// This include track volume, tremolo, vibrato, and noise
// Noise is added to each sample
// the delay, attack, hold, sustain, release envelop is provided
// and then processed during the sample.
// tremolo and track volume are added
// finally vibrato controls the time spacing.
// to correlate the control time with the sample time,
// the samplestarttime is needed. Controls are in composition time space
// samples are in source time space
export default function buildSampleArray(
  sampleStartTime: number,
  generator: Algorithmic,
  track: Track | null,
  fileContents: CMGFile,
  pitchValue: number,
  inputSample: Float32Array,
  inputRate: number,
  inputCents: number,
  looping: boolean,
  loopStart: number,
  loopEnd: number,
  totalTime: number,
  volumeGain: number,
  envelope: GainEnvelope,
  attenuation: number
): Float32Array {
  console.log("building sample with envelope", envelope);
  const basePlaybackRate = 1.0 * Math.pow(2, inputCents / 1200);
  const inputCount: number = Math.ceil(inputRate * totalTime);
  const result: Float32Array = new Float32Array(inputCount);
  const deltaT: number = 1 / inputRate; // time spacing between input samples
  let currentIndex: number = 0;
  const lastSample: number = looping ? loopEnd : inputCount;
  let t: number = 0;
  let iEnvelope: number = 0;
  const maxEnvelope: number = envelope.length - 1;
  let envelopeGain: number = 1.0;
  for (let iSample: number = 0; iSample < inputCount; iSample++) {
    let thisIndex: number = Math.trunc(currentIndex);

    if (looping && thisIndex >= lastSample - 1) {
      currentIndex = loopStart;
      thisIndex = loopStart;
    }

    // activate any controls that are present
    activateDSPControls(sampleStartTime + t, deltaT, generator, fileContents);

    // get the sample value by interpolation
    let value: number = 0;
    if (!looping && thisIndex >= lastSample - 1) {
      value = inputSample[lastSample - 1];
    } else {
      // if (isFinite(inputSample[thisIndex])) {
      value = linearInterpolate(
        currentIndex,
        thisIndex,
        thisIndex + 1,
        inputSample[thisIndex],
        inputSample[thisIndex + 1]
      );
    }

    // TODO the miracle of envelope, track volume, tremolo, and noise occurs here
    // first apply noise
    if (
      generator.noiseEnabled &&
      generator.noiseFrequency != 0 &&
      generator.noiseAmplitude != 0
    ) {
      value += getSampleWithNoise(
        value,
        t,
        midiToFrequency(pitchValue),
        generator.noiseFrequency,
        dBToGain(generator.noiseAmplitude),
        generator.rn
      );
    }

    // apply the envelope
    if (t >= envelope[iEnvelope].t && iEnvelope < maxEnvelope) iEnvelope++;
    envelopeGain =
      envelope[iEnvelope].g != envelope[iEnvelope - 1].g
        ? linearInterpolate(
            t,
            envelope[iEnvelope - 1].t,
            envelope[iEnvelope].t,
            envelope[iEnvelope - 1].g,
            envelope[iEnvelope].g
          )
        : envelope[iEnvelope].g;
    value *= envelopeGain;

    // apply the generator volume, track volume, and instrument attenuation
    value = track
      ? value *
        volumeGain *
        attenuation *
        dBToGain(track.getVolume(t + sampleStartTime))
      : value * volumeGain * attenuation;

    // apply tremolo
    if (
      generator.tremeloEnabled &&
      generator.tremolo.values.depth != 0 &&
      generator.tremolo.values.speed != 0
    ) {
      const tremoloGain: number = dBToGain(
        generator.tremolo.getCurrentValue(t)
      );
      value *= tremoloGain;
    }
    result[iSample] = value;
    // } else {
    //   if (iSample == 0) result[iSample] = 0;
    //   else result[iSample] = result[iSample - 1]* volumeGain * attenuation;
    // }

    // increment to next sample index and time, modifying the playback rate with the vibrato if present
    if (
      !generator.vibratoEnabled ||
      generator.vibrato.values.depth == 0 ||
      generator.vibrato.values.speed == 0
    )
      currentIndex += basePlaybackRate;
    else {
      const newCents: number =
        inputCents + generator.vibrato.getCurrentValue(t, 0);
      const playbackRate: number = 1.0 * Math.pow(2, newCents / 1200);
      currentIndex += playbackRate;
    }
    t += deltaT;
  }
  return new Float32Array(result); // an array of size sampleCount to accomodate the entire sound
}
