import {
	IntensityParameters,
	IntensityProfile,
	IntensityTransition,
	IntensityTransitions,
	SAMPLERATE,
} from 'types';
import { linearInterpolate } from 'utils/interpolation';
import continuousProbability from 'utils/probability/continuousprobability';
import { dBToGain } from 'sfcomponents/util';
import probabilityLookup from 'utils/probability/probabilitylookup';
import RandomNumber from 'classes/randomnumber';

interface IntensityProps {
	sample: number[][];
	parameters: IntensityParameters;
	rN: RandomNumber;
}

// the duration of each transition is based on continus probably where
// the cycle time is used to determine the average number of transitions over the sample (sample duration / cycle time)

// intensity transitions are randomly selected from pool of transition
// based on the end intensity of the last transition
// the first intensity is selected at random
export function intensityPersist(props: IntensityProps): number[][] {
	const { sample, parameters, rN } = props;

	const newSample: number[][] = [...sample];
	const cycleTime: number = parameters.cycleTime;
	const deltaT = 1 / SAMPLERATE;
	const sampleDuration: number = sample[0].length / SAMPLERATE;
	const sampleLength: number = sample[0].length;
	const nPoints = Math.round(sampleDuration / cycleTime);
	const [Pd, Nd] = continuousProbability(nPoints, sampleDuration, sampleDuration / 100);
	if (Pd.length == 1) return sample;

	// pick a random intensity
	const nTransitions: number = IntensityTransitions.length;
	let index: number = Math.round(rN.rand() * (nTransitions - 1));
	let transition: IntensityTransition = IntensityTransitions[index];
	// console.log('transition picked', transition);
	// get the gain profile that is to be applied over this duration
	let [start, middle, end] = getIntensityGainProfile(transition);
	// set ending intensity
	let endIntensity: string = transition.end;

	// determine the duration from Pd
	let duration: number = 0;
	while (duration == 0) duration = probabilityLookup(Pd, Nd, rN.rand());

	let currentDuration: number = 0;
	// loop though all of the samples
	for (let i = 0; i < sampleLength; i++) {
		// when currentduration > duration pick a random transition that has the ending transition as starting and reset current duration
		if (currentDuration >= duration) {
			currentDuration = 0;

			// get a random transition that starts with the end intensity of the last one
			index = Math.round(rN.rand() * (nTransitions - 1));
			while (endIntensity != IntensityTransitions[index].start)
				index = Math.round(rN.rand() * (nTransitions - 1));
			transition = IntensityTransitions[index];
			[start, middle, end] = getIntensityGainProfile(transition);
			endIntensity = transition.end;
			// console.log('transition picked', transition, 'new end', endIntensity);
			// get a new duration
			duration = 0;
			while (duration == 0) duration = probabilityLookup(Pd, Nd, rN.rand());
		}

		// process the intensity transition based on the currentduration, duration, intensity transition provide
		const gain: number =
			currentDuration < duration / 2
				? linearInterpolate(currentDuration, 0, duration / 2, start, middle)
				: linearInterpolate(currentDuration, duration / 2, duration, middle, end);
		newSample[0][i] *= gain;
		newSample[1][i] *= gain;
		// bump to next current duration
		currentDuration += deltaT;
	}
	return newSample;
}

// intensity transitions are randomly selected from the entire pool of transition
export function intensityRandom(props: IntensityProps): number[][] {
	const { sample, parameters, rN } = props;

	const newSample: number[][] = [...sample];
	const cycleTime: number = parameters.cycleTime;
	const deltaT = 1 / SAMPLERATE;
	const sampleDuration: number = sample[0].length / SAMPLERATE;
	const sampleLength: number = sample[0].length;
	const nPoints = Math.round(sampleDuration / cycleTime);
	const [Pd, Nd] = continuousProbability(nPoints, sampleDuration, sampleDuration / 100);
	if (Pd.length == 1) return sample;

	// pick a random intensity
	const nTransitions: number = IntensityTransitions.length;
	let index: number = Math.round(rN.rand() * (nTransitions - 1));
	let transition: IntensityTransition = IntensityTransitions[index];
	// console.log('transition picked', transition);
	// get the gain profile that is to be applied over this duration
	let [start, middle, end] = getIntensityGainProfile(transition);

	// determine the duration from Pd
	let duration: number = 0;
	while (duration == 0) duration = probabilityLookup(Pd, Nd, rN.rand());

	let currentDuration: number = 0;
	// loop though all of the samples
	for (let i = 0; i < sampleLength; i++) {
		// when currentduration > duration pick a random transition that has the ending transition as starting and reset current duration
		if (currentDuration >= duration) {
			currentDuration = 0;

			// get a random transition that starts the the end intensity of the last one
			index = Math.round(rN.rand() * (nTransitions - 1));
			transition = IntensityTransitions[index];
			// console.log('transition picked', transition);

			// get a new duration
			duration = 0;
			while (duration == 0) duration = probabilityLookup(Pd, Nd, rN.rand());
			[start, middle, end] = getIntensityGainProfile(transition);
		}

		// process the intensity transition based on the currentduration, duration, and gain profile
		const gain: number =
			currentDuration < duration / 2
				? linearInterpolate(currentDuration, 0, duration / 2, start, middle)
				: linearInterpolate(currentDuration, duration / 2, duration, middle, end);
		newSample[0][i] *= gain;
		newSample[1][i] *= gain;
		// bump to next current duration
		currentDuration += deltaT;
	}
	return newSample;
}

function getIntensityGainProfile(
	intensityTransition: IntensityTransition
): [number, number, number] {
	const start: number | undefined = IntensityProfile.get(intensityTransition.start)?.dB;
	const end: number | undefined = IntensityProfile.get(intensityTransition.end)?.dB;
	let middle: number | undefined =
		intensityTransition.middle != undefined &&
		IntensityProfile.get(intensityTransition.middle) != undefined
			? IntensityProfile.get(intensityTransition.middle)?.dB
			: 0;
	if (start == undefined) return [1, 1, 1];
	if (end == undefined) return [1, 1, 1];
	if (middle == undefined) middle = (start + end) / 2;
	return [dBToGain(start), dBToGain(middle), dBToGain(end)];
}
