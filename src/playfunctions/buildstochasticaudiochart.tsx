import Chart from "classes/chart";
import Stochastic from "classes/generators/stochastic";
import applyIntensity from "helpers/algorithms/applyintensity";
import applyPan from "helpers/algorithms/applypan";
import cloudSample from "helpers/cloudsample";
import { dBToGain } from "sfcomponents/util";
import { CloudState, CloudStates, INTENSITYOPTION, PANOPTION, SAMPLERATE, VoiceHues, Voices } from "types";
import { debug } from "utils/debug";
interface buildStochasticAudioChartProps {
    generator: Stochastic,
    voices: Voices,
    audioBuffer: Float32Array[],
    chart: Chart,
    voiceHues: VoiceHues,

}
  const normalize = (stereo: Float32Array[]): Float32Array[] => {
    // TODO skipping normalize for now
    // let max: number = 0;
    // // let rms: number = 0;
    // // let sum: number = 0;
    // // let count: number = 0;
    // for (let i = 0; i < stereo[0].length; i++) {
    //   if (stereo[0][i] != 0 || stereo[1][i] != 0) {
    //     // count++;
    //     max = Math.max(max, Math.abs(stereo[0][i]), Math.abs(stereo[1][i]));
    //     if (Number.isNaN(max)) {
    //       throw new Error(`buffer processing error in normalize at sample ${i}`);
    //     }
    //     // sum += Math.abs(stereo[0][i]) + Math.abs(stereo[1][i]);
    //     // rms += stereo[0][i] * stereo[0][i] + stereo[1][i] * stereo[1][i];
    //   }
    // }
    // // const average: number = sum / (2 * count);
    // // rms = Math.sqrt(rms / (2 * count));
    // for (let i = 0; i < stereo[0].length; i++) {
    //   stereo[0][i] /= max;
    //   stereo[1][i] /= max;
    // }
    return stereo;
  }

export default function buildStochasticAudioChart ( props: buildStochasticAudioChartProps
): string {
    const {generator, voices, chart, voiceHues, audioBuffer} = props;
    const { Nt,
    Tc,
    composition,
    panOption,
    panAlgorithm,
    panParameters,
    intensityOption,
    intensityTransitionOption,
    intensityParameters,
    dynamicsRN: rN,
  } = { ...generator.values }
  if (Nt == 0 && Tc == 0) return `no composition available in generator ${generator}`;
  
  // adjust the sample count and number of time cells based on an early stop time
  let sampleTime: number = Math.min(Tc, generator.stopTime - generator.startTime);
  const nTimes: number = Math.ceil(Nt * (sampleTime / Tc));
  sampleTime = nTimes * Tc / Nt;
  const sampleCount: number = sampleTime * SAMPLERATE;
  const deltaT: number = sampleTime / nTimes;
  const deltaSample: number = SAMPLERATE * deltaT;
  const trackGain: number = dBToGain(generator.parent.volume);
  
// build the stereo sample from the composition and its characteristics
// loop through each voice
  
    for (let iVoice = 0; iVoice < voices.length; iVoice++) {
      // skip the muted voices
      if (!voices[iVoice].muted) {

        // initialize the cloud states for this voice
        // NOTE: it is likely likely that at least one or the clouds in 
        // one of the voice will extend past the end of the audiobuffer
        // if there is no generator with a stopTime past this one. In that
        // case, samples generated pat that point are discarded. See 'buildDataSources'.
        let voiceSamples: Float32Array[] = [];
        voiceSamples.push(new Float32Array(sampleCount).fill(0));
        voiceSamples.push(new Float32Array(sampleCount).fill(0));

        // initialize the cloud states so that clouds can extend
        // from one time cell to the next.
        let maxCloud: number = 0;
        for (let iTime = 0; iTime < nTimes; iTime++) {
          maxCloud = Math.max(maxCloud, composition[iTime][iVoice]);
        }
        const cloudStates: CloudStates = Array<CloudState>(maxCloud).fill({
          offset: -1,
          pitch: 0,
        });

        if (maxCloud != 0) {
          let sampleStart: number = 0;
          for (let iTime = 0; iTime < nTimes; iTime++) {
            const nClouds: number = composition[iTime][iVoice];
            for (let iCloud = 0; iCloud < nClouds; iCloud++) {
              const { cloud, cloudState } = cloudSample({
                generator,
                time: iTime * Tc / Nt,
                voice: voices[iVoice],
                cloudDuration: deltaT,
                cloudState: cloudStates[iCloud],
                chart,
                voiceHues,
              });
              cloudStates[iCloud] = { ...cloudState };
  
              // add the clouds to the full sample
              //NOTE: possible truncation
              const sampleEnd = Math.min(sampleStart + cloud[0].length, sampleCount);
              for (
                let iSample = sampleStart;
                iSample < sampleEnd;
                iSample++
              ) {
                voiceSamples[0][iSample] += cloud[0][iSample - sampleStart] * trackGain;
                voiceSamples[1][iSample] += cloud[1][iSample - sampleStart] * trackGain;
              }
            }
            debug.info(
              `buildSamples: ${nClouds} clouds built for cells at time ${
                iTime * deltaT
              }, sample start ${sampleStart}`,
            );
            sampleStart += deltaSample;
          }
          debug.info(
            `buildSamples: All samples built for voice ${voices[iVoice].name}`,
          );
  
          // do the voice level pan and intensity
          if (intensityOption == INTENSITYOPTION.voice)
            applyIntensity(
              voiceSamples,
              intensityTransitionOption,
              intensityParameters,
              rN,
            );
          if (panOption == PANOPTION.voice)
            applyPan(
              voiceSamples,
              panAlgorithm,
              panParameters,
              rN,
            );
  
          // add the voice samples to the full samples with possible extension
          const sampleEnd: number = Math.min(audioBuffer[0].length, voiceSamples[0].length);
          for (let i = 0; i < sampleEnd; i++) {
            audioBuffer[0][i] += voiceSamples[0][i];
            audioBuffer[1][i] += voiceSamples[1][i];
          }
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
    // normalize the samples
    normalize(audioBuffer);
    debug.info(
      `buildSamples: ${voices.length} voices built, sample length = ${audioBuffer[0].length}`,
    );
    return "";
  }
