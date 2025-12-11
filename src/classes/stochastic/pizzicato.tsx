import ConstantValues from "classes/algorithms/constantvalues";
import { AlgorithmType, TIMBRE } from "types";
import Timbre from "./timbre";

export default class Pizzicato extends Timbre {
    override values: {
        duration: number;
        frequency: AlgorithmType;
    } = {
        duration: 0.05,
        frequency: new ConstantValues(440)
    };
    constructor() {super(TIMBRE.Sustained);}
    override copy(): Pizzicato {
        const n: Pizzicato = new Pizzicato();
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