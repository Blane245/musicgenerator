import Stochastic from "classes/generators/stochastic";
import applyIntensity from "playfunctions/helpers/algorithms/applyintensity";
import applyPan from "playfunctions/helpers/algorithms/applypan";
import buildCloud from "playfunctions/helpers/buildCloud";
import {
  CloudState,
  CloudStates,
  INTENSITYOPTION,
  PANOPTION,
  SAMPLERATE,
  VoiceHues,
  Voices,
} from "types";
import addBuffer from "utils/addbuffer";
import { debug } from "utils/debug";
import ChartCollector from "workers/chartcollector";
interface buildStochasticAudioChartProps {
  generator: Stochastic;
  voices: Voices;
  audioBuffer: Float32Array[];
  chart: ChartCollector;
  voiceHues: VoiceHues;
}
export default function buildStochasticAudioChart(
  props: buildStochasticAudioChartProps,
): string {
  const { generator, voices, chart, voiceHues, audioBuffer } = props;
  const {
    Nt,
    Tc,
    composition,
    panOption,
    panAlgorithm,
    panParameters,
    intensityOption,
    intensityTransitionOption,
    intensityParameters,
    dynamicsRN: rN,
  } = { ...generator.values };
  if (Nt == 0 && Tc == 0)
    return `no composition available in generator ${generator}`;

  // adjust the sample count and number of time cells based on an early stop time
  // let voiceTime: number = Tc;Math.min(
  //   Tc,
  //   generator.stopTime - generator.startTime,
  // );
  // const nTimes: number = Math.ceil(Nt * (voiceTime / Tc));
  // voiceTime = (nTimes * Tc) / Nt;
  const voiceCount: number = Tc * SAMPLERATE;
  const deltaT: number = Tc / Nt; // size of a time cell

  // build the samples from the composition and its characteristics
  // by looping through each voice and then through each time cell
  for (let iVoice = 0; iVoice < voices.length; iVoice++) {
    if (generator.values.voices[iVoice].preset == undefined)
      return `Voice ${generator.values.voices[iVoice].name} is missing its preset`;

    // skip the muted voices
    if (!voices[iVoice].muted) {
      const voiceBuffer: Float32Array[] = [];
      voiceBuffer.push(new Float32Array(voiceCount).fill(0));
      voiceBuffer.push(new Float32Array(voiceCount).fill(0));

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
          debug.info(`buildStochasticAudioChart: build ${nClouds} clouds for voice ${voices[iVoice].name} @ cell ${iCell}, time=${iCell * deltaT}`)
          for (let iCloud = 0; iCloud < nClouds; iCloud++) {

            // generate the elements of the cloud, add the chart graphics, and track the cloud state
            const { cloudBuffer, cloudState } = buildCloud({
              generator,
              cloudTime: iCell * deltaT,
              voice: voices[iVoice],
              cloudDuration: deltaT,
              cloudState: cloudStates[iCloud],
              chart,
              voiceHues,
            });
            cloudStates[iCloud] = { ...cloudState };

            // add the clouds to the full sample
            //NOTE: possible truncation
            addBuffer(voiceBuffer, cloudBuffer, Math.trunc(iCell * deltaT * SAMPLERATE));
            debug.info(`buildStochasticAudioChart: cloud ${iCloud} in time cell ${iCell} added to voice=${voices[iVoice].name} @ t=${iCell * deltaT}, sample=${Math.trunc(iCell * deltaT * SAMPLERATE)}`)
          }
          debug.info(
            `buildStochasticAudioChart: ${nClouds} clouds built for cells at time ${
              iCell * deltaT
            }, sample start ${iCell * deltaT * SAMPLERATE}`,
          );
        }
        debug.info(
          `buildSamples: All samples built for voice ${voices[iVoice].name}`,
        );

        // do the voice level pan and intensity
        if (intensityOption == INTENSITYOPTION.voice)
          applyIntensity(
            voiceBuffer,
            intensityTransitionOption,
            intensityParameters,
            rN,
          );
        if (panOption == PANOPTION.voice)
          applyPan(voiceBuffer, panAlgorithm, panParameters, rN);

        // add the voice samples to the full samples with truncation at the end
        addBuffer(audioBuffer, voiceBuffer, Math.trunc(generator.startTime * SAMPLERATE));
        debug.info(`buildStochasticAudioChart: voice ${voices[iVoice].name} added to audio at time = ${generator.startTime}, sample ${Math.trunc(generator.startTime * SAMPLERATE)} `)
      } 
    }
  }

  // do the composition level pan and intensity
  if (intensityOption == INTENSITYOPTION.composition)
    applyIntensity(
      audioBuffer,
      intensityTransitionOption,
      intensityParameters,
      rN,
    );
  if (panOption == PANOPTION.composition)
    applyPan(audioBuffer, panAlgorithm, panParameters, rN);
  debug.info(
    `buildSamples: ${voices.length} voices built, sample length = ${audioBuffer[0].length}`,
  );
  return "";
}
