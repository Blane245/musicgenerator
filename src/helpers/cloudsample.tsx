// create a cloud of sound elements that follow stochastic principles.
// A cloud is defined to have to have a number of elements of a specific type
// and a specific duration
// Each element is assigned a start time
// the end time is from the first law of continous probability except in the percussion and pizz cases
// where it a fixed duration ahead of t1.
// the pitch is determined by the second law of continuous probability
// in the case of glissando, a second pitch is drawn

import Stochastic from 'classes/generators/stochastic';
import { gaussianRandom } from 'utils/probability/gaussianrandom';
import {
	CloudState,
	INTENSITYOPTION,
	PANOPTION,
	RMSFACTOR,
	SAMPLERATE,
	TIMBRE,
	Voice
} from '../types';
import continuousProbability from '../utils/probability/continuousprobability';
import intervalProbabilty from '../utils/probability/intervalprobability';
import probabilityLookup from '../utils/probability/probabilitylookup';
import applyIntensity from './algorithms/applyintensity';
import applyPan from './algorithms/applypan';
import buildPresetSample from './buildpresetsample';

const UNIT: number = 100;

// build a cloud of soudns for the given voice
export default function cloudSample(props: {
	generator: Stochastic;
	voice: Voice;
	cloudDuration: number;
	cloudState: CloudState;
}): { cloud: number[][]; cloudState: CloudState } {
	const {generator, voice, cloudDuration, cloudState} = props
	const {
		delta,
		intensityOption,
		intensityTransitionOption,
		intensityParameters,
		panOption,
		panAlgorithm,
		panParameters,
		dynamicsRN:rN,
	} = {...generator.values};
	const newCloudState: CloudState = { ...cloudState };
	const sampleCount = Math.ceil(SAMPLERATE * cloudDuration);
	const sample: number[] = Array(sampleCount).fill(0); // initialize size, may grow
	const lo: number = voice.registerLo;
	const hi: number = voice.registerHi;

	// create the duration table for these elements
	const [Pd, Nd] = continuousProbability(
		cloudDuration * delta,
		cloudDuration,
		cloudDuration / UNIT
	);
	// console.log(`duration density table for voice ${voice.name}, delta=${delta}, cloud duration=${cloudDuration}, Pd=${Pd}, Nd=${Nd}`);
	// check that not all of the durations are 0
	if (Pd.length == 1) {
		// console.log(
		// 	`duration table for timbre=${voice.timbre}, delta=${delta}, cloud duration=${cloudDuration} has only zero elements`
		// );
		return { cloud: [], cloudState: { offset: -1, pitch: 0 } };
	}

	// initialize the starting time and starting pitch based for the current element state
	let t1: number = cloudState.offset < 0 ? probabilityLookup(Pd, Nd, rN.rand()) : cloudState.offset;
	let pitch1: number =
		cloudState.offset < 0 ? Math.round(intervalProbabilty(hi - lo, rN) + lo) : cloudState.pitch;

	let t2: number = 0;
	let pitch2: number = 0;
	let finished: boolean = false;
	// get the duration of the sound, ignoring zero
	let interval: number = 0; // get the initial, throwing out all zeroes
	do {
		interval = probabilityLookup(Pd, Nd, rN.rand()); // the initial duration
	} while (interval == 0);
	// console.log(
	// 	`initial conditions for voice ${voice.timbre}, element ${i}, t1=${t1}, pitch1=${pitch1}, duration=${duration}`
	// );
	do {
		t2 = t1 + interval; // the time of the end of the sound
		if (voice.timbre == TIMBRE.Glissando) {
			// process glissando
			// get a speed and pitch2
			const speed: number = gaussianRandom(0, delta * RMSFACTOR, rN);
			// restrict the glissando to remain in the range of the voice
			pitch2 = Math.round(Math.min(hi, Math.max(lo, pitch1 + speed * interval)));
			// console.log(
			// 	`glissando for voice ${voice.name}, pitch1=${pitch1}, pitch2=${pitch2}, speed=${speed}, interval=${interval}, t1=${t1}, t2=${t2}`
			// );
		} else {
			// timbre is Sustained
			pitch2 = pitch1;
		}

		// get the samples for the instruments that make up this voice
		// console.log(
		// 	`build preset sample of ${voice.preset?.header.name}, pitchs=(${pitch1}, ${pitch2}) starting at ${t1}, with interval ${interval}`
		// );
		const eSample = buildPresetSample({
			preset: voice.preset,
			interval: interval,
			duration: voice.duration,
			pitch1: pitch1,
			pitch2: pitch2,
			volume: voice.volume,
			velocity: voice.velocity,
		});

		// put the instrument samples in the cloud sample,
		// with possible extension
		for (let instr = 0; instr < eSample.length; instr++) {
			const iStart = Math.floor(sampleCount * (t1 / cloudDuration));
			const iEnd = iStart + eSample[instr].length;
			for (let j = iStart; j < iEnd; j++) {
				sample[j] = eSample[instr][j - iStart];
			}
		}

		// move forward unless we are finished
		if (t2 >= cloudDuration) finished = true; // allow one segment past the end of the cloud
		else {
			t1 = t2; // move to the next time

			// and the next pitch depending on timbre type
			pitch1 = voice.timbre == TIMBRE.Glissando ? pitch2 : intervalProbabilty(hi - lo, rN) + lo;

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
	let stereo: number[][] = [[...sample], [...sample]];
	if (intensityOption == INTENSITYOPTION.cloud) {
		stereo = applyIntensity(stereo, intensityTransitionOption, intensityParameters, rN);
	}
	// apply cloud level pan
	if (panOption == PANOPTION.cloud) stereo = applyPan(stereo, panAlgorithm, panParameters, rN);
	// console.log(`Generated ${sequenceCount} segments
	// 	for timbre type ${voice.timbre},
	// 	 cloud size ${sample.length}`);
	return { cloud: stereo, cloudState: newCloudState };
}
