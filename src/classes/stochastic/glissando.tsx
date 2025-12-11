import ConstantValues from "classes/algorithms/constantvalues";
import { ALGORITHMTYPE, AlgorithmType, TIMBRE, TimbreAttribute } from "types";
import Timbre from "./timbre";
import RandomNumber from "classes/randomnumber";

export default class Glissando extends Timbre {
    override values: {
        duration: number;
        frequency: TimbreAttribute;
        speed: number
    } = {
        duration: 0,
        frequency: {mean: 0, hi: 0, lo: 0, type: ALGORITHMTYPE.Constant, algorithm: new ConstantValues(0)},
        speed: 0,
    };
    constructor() {super(TIMBRE.Sustained);}
    override copy(): Glissando {
        const n: Glissando = new Glissando();
        n.values = {...this.values}
        return n;
    }
    override setAttribute(name: string, value: string): boolean {
        return false;
    }
    override async appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
    return Promise.resolve(elem);
  }
  static override async getXML(_elem: Element, _version: string): Promise<Timbre> {
    return Promise.resolve(new Timbre(TIMBRE.None));
  }

  static override validate(timbre: Timbre): string[] {
    const errors: string[] = [];
    if (timbre.type === TIMBRE.None) errors.push("Timbre must be specified");
    return errors;
  }

}