import RandomNumber from 'classes/randomnumber';
import { PanParameters, RMSFACTOR, SAMPLERATE } from 'types';
import { linearInterpolate } from 'utils/interpolation';
import continuousProbability from 'utils/probability/continuousprobability';
import { gaussianRandom } from 'utils/probability/gaussianrandom';
import intervalProbabilty from 'utils/probability/intervalprobability';
import probabilityLookup from 'utils/probability/probabilitylookup';
import { bounce, pantoLeftRight } from './panutils';

interface PanGlideProps {
	sample: number[][];
    parameters: PanParameters;
	rN: RandomNumber;
}

// apply the pan glide algorithm to the samples
// pan segment durations are defined by the parameter cycleTime
// the number of points on this time line is 10
export default function panGlide(props: PanGlideProps): number[][] {
	const { sample, parameters, rN } = props;
    const length: number = sample[0].length;
	const newSample: number[][] = [...sample];
	const deltaT: number = 1.0 / SAMPLERATE;

	// get the distribution of pan transistion, 10 intervals on a span of 2 with 0.01 resolution
	const [Pd, Nd] = continuousProbability(10, parameters.cycleTime, 0.01); // d=10 points, length=2 (-1, +1), v=20/200 
	let currentInterval: number = 0;

    // random first pan
	let pan1: number = intervalProbabilty(2, rN) - 1; // between -1 and +1
	let duration: number = 0;
	while ((duration == 0)) {
		duration = probabilityLookup(Pd, Nd, rN.rand()); // length (sec) of this glissando
	}
	let speed: number = gaussianRandom(0, RMSFACTOR * duration, rN); // pan units/sec
	let pan2: number = bounce(pan1, duration * speed, -1, 1);
	for (let i = 0; i < length; i++) {
		if (currentInterval >= duration) {
			currentInterval = 0;
			pan1 = pan2;
			duration = 0;
			while (duration == 0) {
				duration = probabilityLookup(Pd, Nd, rN.rand());
			}
			speed = gaussianRandom(0, RMSFACTOR * duration, rN);
			pan2 = bounce(pan1, duration * speed, -1, 1);
		}
		const pan = linearInterpolate(currentInterval, 0, duration, pan1, pan2);
		const { left, right } = pantoLeftRight(pan);
		newSample[0][i] = sample[0][i] * left;
		newSample[1][i] = sample[1][i] * right;
		currentInterval += deltaT;
	}
	return newSample;
}
