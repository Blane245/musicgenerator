// create a cloud of sound elements that follow stochastic principles.
// A cloud is defined to have to have a number of elements of a specific type
// and a specific duration
// Each element is assigned a start time
// the end time is from the first law of continous probability except in the percussion and pizz cases
// where it a fixed duration ahead of t1.
// the pitch is determined by the second law of continuous probability
// in the case of glissando, a second pitch is drawn

import Stochastic from "classes/generators/stochastic";
import { getPresetNote } from "playfunctions/presetProcessing/getpresetnote";
import {
  CloudState,
  CloudStates,
  INTENSITYOPTION,
  PANOPTION,
  RMSFACTOR,
  SAMPLERATE,
  TIMBRE,
  UNIT,
  Voice,
  VoiceHues,
} from "types";
import addBuffer from "utils/addbuffer";
import { debug } from "utils/debug";
import continuousProbability from "utils/probability/continuousprobability";
import { gaussianRandom } from "utils/probability/gaussianrandom";
import intervalProbabilty from "utils/probability/intervalprobability";
import probabilityLookup from "utils/probability/probabilitylookup";
import ChartCollector from "workers/chartcollector";
import applyIntensity from "./algorithms/applyintensity";
import applyPan from "./algorithms/applypan";

/**
 * Construct a cloud of samples for a voice in a time cell, tracking the state of the cloud elements
 * @param {Stochastic} generator - a Stochastic generator containing dynamic parameters
 * @param {Voice} voice - the voice for which the cloud is being constructed
 * @param {number} cloudDuration - the length (seconds) of the time cell conatining the cloud
 * @param {CloudState} cloudState - the initial state of the cloud from the previous cloud
 * @param {ChartCollector} chart - the graphic object that will contain the visible representation of each element in the cloud
 * @param {VoiceHues} voiceHues - the map of hues setting for all voices
 * @param {number} cloudTime - the start time (seconds) of the cloud in the composition
 * @returns {Float32Array[], CloudState} - the cloud sample as a two channel Float32Array and the final state of the cloud
 */
export default function buildCloud(props: {
  generator: Stochastic;
  voice: Voice;
  cloudDuration: number;
  cloudState: CloudState;
  chart: ChartCollector;
  voiceHues: VoiceHues;
  cloudTime: number;
}): { cloudBuffer: Float32Array[]; cloudState: CloudState } {
  const {
    generator,
    voice,
    cloudDuration,
    cloudState,
    chart,
    voiceHues,
    cloudTime,
  } = props;
  const {
    delta,
    intensityOption,
    intensityTransitionOption,
    intensityParameters,
    panOption,
    panAlgorithm,
    panParameters,
    dynamicsRN: rN,
  } = { ...generator.values };

  const newCloudState: CloudState = { ...cloudState };
  const cloudCount = Math.ceil(SAMPLERATE * cloudDuration);
  const cloudBuffer: Float32Array[] = [];
  // initialize size bigger than necessary to handle element extensions
  cloudBuffer.push(new Float32Array(2 * cloudCount).fill(0));
  cloudBuffer.push(new Float32Array(2 * cloudCount).fill(0));
  const lo: number = voice.registerLo;
  const hi: number = voice.registerHi;

  // create the duration table for these elements
  const [Pd, Nd] = continuousProbability(
    cloudDuration * delta,
    cloudDuration,
    cloudDuration / UNIT,
  );

  // check that not all of the durations are 0
  if (Pd.length == 1) {
    debug.error(
      `buildCloud: duration table for timbre=${voice.timbre}, delta=${delta}, cloud duration=${cloudDuration} has only zero elements`,
    );
    return { cloudBuffer: [], cloudState: { offset: -1, pitch: 0 } };
  }

  // initialize the starting time and starting pitch based for the current cloud state
  let t1: number =
    cloudState.offset < 0
      ? probabilityLookup(Pd, Nd, rN.rand())
      : cloudState.offset;
  let pitch1: number =
    cloudState.offset < 0
      ? intervalProbabilty(hi - lo, rN) + lo
      : cloudState.pitch;
  if (!generator.values.microtones) pitch1 = Math.round(pitch1);

  let t2: number = 0;
  let pitch2: number = 0;
  let finished: boolean = false;

  // get the duration of the sound, ignoring zero
  let interval: number = 0; // get the initial, throwing out all zeroes
  do {
    interval = probabilityLookup(Pd, Nd, rN.rand()); // the initial duration
  } while (interval == 0);
  debug.info(
    `buildCloud: initial conditions for voice ${voice.timbre}, t1=${t1}, pitch1=${pitch1}, interval=${interval}`,
  );

  // loop until we are finished (t2 > cloud duration)
  do {
    t2 = t1 + interval; // the time of the end of the sound
    if (voice.timbre == TIMBRE.Glissando) {
      // process glissando
      // get a speed and pitch2
      const speed: number = gaussianRandom(0, delta * RMSFACTOR, rN);
      // restrict the glissando to remain in the range of the voice
      pitch2 = Math.min(hi, Math.max(lo, pitch1 + speed * interval));
      if (!generator.values.microtones) pitch2 = Math.round(pitch2);
      debug.info(
        `buildCloud: glissando for voice ${voice.name}, pitch1=${pitch1}, pitch2=${pitch2}, speed=${speed}, interval=${interval}, t1=${t1}, t2=${t2}`,
      );
    } else {
      // timbre is Sustained
      pitch2 = pitch1;
    }

    // get the samples for the instruments that make up this voice
    // this is single channel
    // stochastic genertors have no noise, vibrato, or tremolo
    const eSample =
      voice.preset != undefined
        ? getPresetNote({
            preset: voice.preset,
            pitch: { startPitch: pitch1, endPitch: pitch2 },
            interval: interval,
            duration: voice.duration == 0 ? interval : voice.duration,
            volume: voice.volume + generator.parent.volume,
            velocity: voice.velocity,
          })
        : new Float32Array(0);

    // put the element sample in the cloud sample,
    addBuffer(cloudBuffer, [eSample, eSample], Math.trunc(t1 * SAMPLERATE));
    debug.info(
      `buildCloud: cloud element added to cloud @ time=${t1}, sample=${Math.trunc(t1 * SAMPLERATE)}`,
    );

    // add the source to the chart

    // determine the true length of the sound from all of the instrument's samples
    let endElementSample: number = -1;
    for (let i = eSample.length - 1; i > 0 && endElementSample < 0; i--) {
      if (Math.abs(eSample[i]) != 0) {
        endElementSample = i;
      }
    }
    const tDuration: number =
      (endElementSample < 0 ? eSample.length - 1 : endElementSample) /
      SAMPLERATE;

    // pick up the hue
    const hue: number | undefined = voiceHues.get(
      voice.soundFontFile + "|" + voice.presetName,
    );

    chart.addSource({
      from: {
        time: generator.startTime + cloudTime + t1,
        midi: pitch1,
        hue: hue ? hue : 0,
      },
      to: {
        time: generator.startTime + cloudTime + t1 + tDuration,
        midi: pitch2,
        hue: hue ? hue : 0,
      },
    });
    debug.info(
      "buildCloud: added chart source t1, t2, n1, n2",
      cloudTime + t1,
      cloudTime + t1 + tDuration,
      pitch1,
      pitch2,
    );

    // move forward unless we are finished
    if (t1 >= cloudDuration)
      finished = true; // allow one segment past the end of the cloud
    else {
      t1 = t2; // move to the next time

      // and the next pitch depending on timbre type
      pitch1 =
        voice.timbre == TIMBRE.Glissando
          ? pitch2
          : intervalProbabilty(hi - lo, rN) + lo;
      if (!generator.values.microtones) pitch1 = Math.round(pitch1);

      // get a new interval
      do {
        interval = probabilityLookup(Pd, Nd, rN.rand()); // the initial duration
      } while (interval == 0);
    }
  } while (!finished);

  // update the element state
  newCloudState.offset = t2 - cloudDuration;
  newCloudState.pitch = pitch2;

  // apply the cloud level intensity
  if (intensityOption == INTENSITYOPTION.cloud) {
    applyIntensity(
      cloudBuffer,
      intensityTransitionOption,
      intensityParameters,
      rN,
    );
  }
  // apply cloud level pan
  if (panOption == PANOPTION.cloud)
    applyPan(cloudBuffer, panAlgorithm, panParameters, rN);
  debug.info(
    `buildCloud: cloud for timbre type ${voice.timbre}, cloud size ${cloudBuffer[0].length}`,
  );
  return { cloudBuffer, cloudState: newCloudState };
}
