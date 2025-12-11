
import { AlgorithmValues } from "classes/algorithms/algorithmvalues";
import RandomNumber from "classes/randomnumber";
import { ALGORITHMTYPE, TimbreAttribute } from "types";
import Cloud from "./cloud";
import Glissando from "./glissando";

// represents a cloud of glassandi
export default class GlissandoCloud extends Cloud {
    override values: {
        duration: TimbreAttribute;
        frequency: TimbreAttribute;
        density: number;
    } = {
        duration: {mean: 0, lo: 0, hi: 0, type: ALGORITHMTYPE.None, algorithm: new AlgorithmValues(ALGORITHMTYPE.None)},
        frequency: {mean: 0, lo: 0, hi: 0, type: ALGORITHMTYPE.None, algorithm: new AlgorithmValues(ALGORITHMTYPE.None)},
        density: 0,
    };
    cloud: Glissando[] = [];
        #rn: RandomNumber = new RandomNumber('');
    

}

