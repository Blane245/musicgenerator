import Stochastic from "classes/generators/stochastic";
import { getPresetReport } from "playfunctions/presetProcessing/getpresetreport";
import { Preset } from "sfcomponents/types";
import {
  CloudState,
  CloudStates,
  ReportSourceData,
  RMSFACTOR,
  TIMBRE,
  UNIT,
  Voice,
} from "types";
import continuousProbability from "utils/probability/continuousprobability";
import { gaussianRandom } from "utils/probability/gaussianrandom";
import intervalProbabilty from "utils/probability/intervalprobability";
import probabilityLookup from "utils/probability/probabilitylookup";

export default function getStochasticSources(
  generator: Stochastic,
): ReportSourceData[] {
  // mimic the build sources from stochastic
  const { Nt, Tc, voices, composition } = { ...generator.values };
  const { startTime } = generator;
  if (Nt == 0 && Tc == 0) return [];

  const deltaT: number = Tc / Nt; // size of a time cell
  const result: ReportSourceData[] = [];

  // build the samples from the composition and its characteristics
  // by looping through each voice and then through each time cell
  for (let iVoice = 0; iVoice < voices.length; iVoice++) {
    const preset: Preset | undefined = voices[iVoice].preset;
    if (!preset) return [];
    // skip the muted voices or ones with no preset
    if (!voices[iVoice].muted) {
      // initialize the cloud states so that clouds can extend
      // from one time cell to the next.
      let maxCloud: number = 0;
      for (let iCell = 0; iCell < Nt; iCell++) {
        maxCloud = Math.max(maxCloud, composition[iCell][iVoice]);
      }
      const cloudStates: CloudStates = Array<CloudState>(maxCloud).fill({
        offset: -1,
        pitch: 0,
      });

      if (maxCloud != 0) {
        for (let iCell = 0; iCell < Nt; iCell++) {
          const nClouds: number = composition[iCell][iVoice];
          for (let iCloud = 0; iCloud < nClouds; iCloud++) {
            // generate the elements of the cloud, add the chart graphics, and track the cloud state
            const { cloudSources, cloudState } = getCloud({
              generator,
              startTime,
              soundFontName: voices[iVoice].soundFontFile,
              presetName: voices[iVoice].presetName,
              preset,
              voice: voices[iVoice],
              cloudDuration: deltaT,
              cloudState: cloudStates[iCloud],
            });
            cloudStates[iCloud] = { ...cloudState };
            // add the clouds sources to the rest of the generator sources
            result.push(...cloudSources);
          }
        }
      }
    }
  }

  return result;
}

interface GetCloudProps {
  generator: Stochastic;
  startTime: number;
  soundFontName: string;
  presetName: string;
  preset: Preset;
  voice: Voice;
  cloudDuration: number;
  cloudState: CloudState;
}
const getCloud = (
  props: GetCloudProps,
): { cloudSources: ReportSourceData[]; cloudState: CloudState } => {
  const {
    generator,
    startTime,
    soundFontName,
    presetName,
    preset,
    voice,
    cloudDuration,
    cloudState,
  } = props;
  const { delta, dynamicsRN: rN } = generator.values;

  const newCloudState: CloudState = { ...cloudState };
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
    return { cloudSources: [], cloudState: { offset: -1, pitch: 0 } };
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

  // loop until we are finished (t2 > cloud duration)
  const result: ReportSourceData[] = [];
  do {
    t2 = t1 + interval; // the time of the end of the sound
    if (voice.timbre == TIMBRE.Glissando) {
      // process glissando
      // get a speed and pitch2
      const speed: number = gaussianRandom(0, delta * RMSFACTOR, rN);
      // restrict the glissando to remain in the range of the voice
      pitch2 = Math.min(hi, Math.max(lo, pitch1 + speed * interval));
      if (!generator.values.microtones) pitch2 = Math.round(pitch2);
    } else {
      // timbre is Sustained
      pitch2 = pitch1;
    }

    // get the samples for the instruments that make up this voice
    // this is single channel
    // stochastic genertors have no noise, vibrato, or tremolo
    const duration: number = voice.duration == 0 ? interval : voice.duration;
    const theReport = getPresetReport({
      generatorName: generator.name,
      startTime: startTime + t1,
      stopTime: startTime + duration,
      soundFontName,
      presetName,
      preset,
      pitch: { startPitch: pitch1, endPitch: pitch2 },
      interval,
      duration,
      volume: voice.volume + generator.parent.volume,
      velocity: voice.velocity,
    });
    result.push(theReport);
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
  return { cloudSources: result, cloudState: newCloudState };
};
