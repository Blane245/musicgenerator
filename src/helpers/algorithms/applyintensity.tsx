import { IntensityParameters, INTENSITYTRANSITIONOPTION, IntensityTransitionOption } from 'types';
import { intensityPersist, intensityRandom } from './intensitymethods';
import RandomNumber from 'classes/randomnumber';


// execute the selected intensity transition option
export default function applyIntensity(sample: number[][], option: IntensityTransitionOption , parameters: IntensityParameters, rN: RandomNumber): number[][] {
    // newSample.push(new Array(sample.length)); // left
    // newSample.push(new Array(sample.length)); // right
    switch (option) {
        case INTENSITYTRANSITIONOPTION.persistent: {
            const newSample = intensityPersist({sample: sample, parameters: parameters, rN: rN});
            return newSample;
        }
        case INTENSITYTRANSITIONOPTION.random: {
            const newSample = intensityRandom({sample: sample, parameters: parameters, rN: rN});
            return newSample;
        }
        default:
            return [sample[0], sample[1]];
    }
}
