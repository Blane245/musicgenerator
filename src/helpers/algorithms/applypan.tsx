import { PanAlgorithm, PANALGORITHM, PanParameters } from 'types';
import panGlide from './panglide';
import panWalk from './panwalk';
import RandomNumber from 'classes/randomnumber';


// execute the selected pan algorithm
// only called when pan option is composition
export default function applyPan(sample: number[][], algorithm: PanAlgorithm, parameters: PanParameters, rN: RandomNumber): number[][] {
	// newSample.push(new Array(sample.length)); // left
	// newSample.push(new Array(sample.length)); // right
	switch (algorithm) {
		case PANALGORITHM.walk: {
            const newSample = panWalk({sample, parameters, rN});
            return newSample;
		}
		case PANALGORITHM.glide: {
            const newSample = panGlide({sample, parameters, rN});
			return newSample;
		}
		default:
			return [sample[0], sample[1]];
	}
}
