import RandomNumber from 'classes/randomnumber';
import {
	CloudState,
	CloudStates,
	Composition,
	INTENSITYOPTION,
	IntensityOption,
	IntensityParameters,
	IntensityTransitionOption,
	PanAlgorithm,
	PANOPTION,
	PanOption,
	PanParameters,
	SAMPLERATE,
	Voice,
} from 'types';
import cloudSample from './cloudsample';
import applyIntensity from './algorithms/applyintensity';
import applyPan from './algorithms/applypan';

interface BuildSampleProps {
	delta: number;
	Ne: number;
	Nt: number;
	Tc: number;
	composition: Composition;
	voices: Voice[];
	panOption: PanOption;
	panAlgorithm: PanAlgorithm;
	panParameters: PanParameters;
	intensityOption: IntensityOption;
	intensityTransitionOption: IntensityTransitionOption;
	intensityParameters: IntensityParameters;
	rN: RandomNumber;
}
export default function buildSamples(props: BuildSampleProps): number[][] {
	const {
		delta,
		Ne,
		Nt,
		Tc,
		composition,
		voices,
		panOption,
		panAlgorithm,
		panParameters,
		intensityOption,
		intensityTransitionOption,
		intensityParameters,
		rN,
	} = props;

	let samples: number[][] = [];
	if (Nt == 0) return samples;
	if (Tc == 0) return samples;
	if (Ne == 0) return samples;
	const sampleCount: number = SAMPLERATE * Tc;

	// initialize left and right channels
	samples.push(Array<number>(sampleCount).fill(0));
	samples.push(Array<number>(sampleCount).fill(0));

	// number of samples in each time cell and the time duratio of the cell
	const deltaSample: number = sampleCount / Nt;
	const deltaT: number = Tc / Nt;

	// build the stereo sample from the composition and its characteristics
	// loop through each voice

	for (let iVoice = 0; iVoice < Ne; iVoice++) {
		// initialize the cloud states for this voice
		let voiceSamples: number[][] = [];
		voiceSamples.push(Array<number>(sampleCount).fill(0));
		voiceSamples.push(Array<number>(sampleCount).fill(0));
		let maxCloud: number = 0;
		for (let iTime = 0; iTime < Nt; iTime++) {
			maxCloud = Math.max(maxCloud, composition[iTime][iVoice]);
		}
		const cloudStates: CloudStates = Array<CloudState>(maxCloud).fill({ offset: -1, pitch: 0 });
		if (maxCloud != 0) {
			let sampleStart: number = 0;
			for (let iTime = 0; iTime < Nt; iTime++) {
				const nClouds: number = composition[iTime][iVoice];
				for (let iCloud = 0; iCloud < nClouds; iCloud++) {
					const { cloud, cloudState } = cloudSample({
						delta,
						voice: voices[iVoice],
						cloudDuration: deltaT,
						cloudState: cloudStates[iCloud],
						intensityOption,
						intensityTransitionOption,
						intensityParameters,
						panOption,
						panAlgorithm,
						panParameters,
						rN,
					});
					cloudStates[iCloud] = { ...cloudState };

					// add the clouds to the full sample with possible extension
					for (let iSample = sampleStart; iSample < sampleStart + cloud[0].length; iSample++) {
						voiceSamples[0][iSample] = voiceSamples[0][iSample] != undefined?voiceSamples[0][iSample] + cloud[0][iSample - sampleStart]:cloud[0][iSample - sampleStart];
						voiceSamples[1][iSample] = voiceSamples[1][iSample] != undefined?voiceSamples[1][iSample] + cloud[1][iSample - sampleStart]:cloud[0][iSample - sampleStart];
					}
				}
				// if (nClouds != 0)
					// console.log(
					// 	`${nClouds} clouds built for cells at time ${
					// 		iTime * deltaT
					// 	}, sample start ${sampleStart}`
					// );
				// bump to next time
				sampleStart += deltaSample;
			}
			// console.log(`All samples built for voice ${voices[iVoice].name}`);

			// do the voice level pan and intensity
			if (intensityOption == INTENSITYOPTION.voice)
				voiceSamples = applyIntensity(
					voiceSamples,
					intensityTransitionOption,
					intensityParameters,
					rN
				);
			if (panOption == PANOPTION.voice)
				voiceSamples = applyPan(voiceSamples, panAlgorithm, panParameters, rN);

			// add the voice samples to the full samples with possible extension
			for (let i = 0; i < voiceSamples[0].length; i++) {
				samples[0][i] =
					samples[0][i] != undefined ? samples[0][i] + voiceSamples[0][i] : voiceSamples[0][i];
				samples[1][i] =
					samples[1][i] != undefined ? samples[1][i] + voiceSamples[1][i] : voiceSamples[1][i];
			}
		}
	}

	// do the composition level pan and intensity
	if (intensityOption == INTENSITYOPTION.composition)
		samples = applyIntensity(samples, intensityTransitionOption, intensityParameters, rN);
	if (panOption == PANOPTION.composition)
		samples = applyPan(samples, panAlgorithm, panParameters, rN);
	// normalize the samples
	samples = normalize(samples);
	// console.log(`${voices.length} voices built, sample length = ${samples[0].length}`);
	return samples;
}
function normalize(stereo: number[][]): number[][] {
	let max: number = 0;
	// let rms: number = 0;
	// let sum: number = 0;
	// let count: number = 0;
	for (let i = 0; i < stereo[0].length; i++) {
		if (stereo[0][i] != 0 || stereo[1][i] != 0) {
			// count++;
			max = Math.max(max, Math.abs(stereo[0][i]), Math.abs(stereo[1][i]));
			if (Number.isNaN(max)) {
				throw new Error(`buffer processing error in normalize at sample ${i}`);
			}
			// sum += Math.abs(stereo[0][i]) + Math.abs(stereo[1][i]);
			// rms += stereo[0][i] * stereo[0][i] + stereo[1][i] * stereo[1][i];
		}
	}
	// const average: number = sum / (2 * count);
	// rms = Math.sqrt(rms / (2 * count));
	for (let i = 0; i < stereo[0].length; i++) {
		stereo[0][i] /= max;
		stereo[1][i] /= max;
	}
	return stereo;
}
