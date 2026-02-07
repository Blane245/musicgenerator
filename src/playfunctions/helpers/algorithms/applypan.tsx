import { PanAlgorithm, PANALGORITHM, PanParameters } from 'types';
import RandomNumber from 'classes/randomnumber';
import { panGlide, panWalk } from 'playfunctions/helpers/algorithms/panmethods';


// execute the selected pan algorithm
// only called when pan option is composition
export default function applyPan(sample: Float32Array[], algorithm: PanAlgorithm, parameters: PanParameters, rN: RandomNumber) {
	switch (algorithm) {
		case PANALGORITHM.walk: {
            panWalk({sample, parameters, rN});
            return;
		}
		case PANALGORITHM.glide: {
            panGlide({sample, parameters, rN});
			return;
		}
		default:
			return;
	}
}
