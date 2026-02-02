import { IntensityParameters, INTENSITYTRANSITIONOPTION, IntensityTransitionOption } from 'types';
import { intensityPersist, intensityRandom } from './intensitymethods';
import RandomNumber from 'classes/randomnumber';


// execute the selected intensity transition option
export default function applyIntensity(sample: Float32Array[], option: IntensityTransitionOption , parameters: IntensityParameters, rN: RandomNumber) {
    // newSample.push(new Array(sample.length)); // left
    // newSample.push(new Array(sample.length)); // right
    switch (option) {
        case INTENSITYTRANSITIONOPTION.persistent: {
            intensityPersist({sample: sample, parameters: parameters, rN: rN});
            return;
        }
        case INTENSITYTRANSITIONOPTION.random: {
            intensityRandom({sample: sample, parameters: parameters, rN: rN});
            return;
        }
        default:
            return;
    }
}
