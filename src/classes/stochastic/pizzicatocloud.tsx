import { AlgorithmValues } from "classes/algorithms/algorithmvalues";
import { ALGORITHMTYPE, TimbreAttribute } from "types";
import Cloud from "./cloud";
import Pizzicato from "./pizzicato";

// represents a cloud of pizzicato notes
export default class PizzicatoCloud extends Cloud {
    override values: {
        duration: number;
        frequency: TimbreAttribute;
    } = {
        duration: 0,
        frequency: {mean: 0, lo: 0, hi: 0, type: ALGORITHMTYPE.None, algorithm: new AlgorithmValues(ALGORITHMTYPE.None)},
    };
    cloud: Pizzicato[] = [];

}

