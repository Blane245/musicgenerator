import RandomNumber from "classes/randomnumber";
import { ALGORITHMTYPE, WienerType } from "types";
import { gaussianRandom } from "utils/gaussianrandom";
import { getAttributeValueWithDefault } from "utils/xmlfunctions";
import { AlgorithmValues } from "./algorithmvalues";

export default class WienerValues extends AlgorithmValues {
  override values: WienerType;

  constructor(
    values: WienerType = {
      seed: "",
      rn: new RandomNumber(""),
      initialValue: 0,
      alpha: 0,
      sigma: 0,
      lo: 0,
      hi: 0,
    }
  ) {
    super(ALGORITHMTYPE.Wiener);
    this.values = { ...values };
    this.values.rn = new RandomNumber(this.values.seed);
  }

  override copy(): WienerValues {
    const n: WienerValues = new WienerValues(this.values);
    n.values.rn = new RandomNumber(this.values.seed);
    return n;
  }

  override isEqual(newAlgorithm: WienerValues): boolean {
    if (!(newAlgorithm instanceof WienerValues)) return false;
    return (
      newAlgorithm.values.seed == this.values.seed &&
      newAlgorithm.values.initialValue == this.values.initialValue &&
      newAlgorithm.values.alpha == this.values.alpha &&
      newAlgorithm.values.sigma == this.values.sigma &&
      newAlgorithm.values.lo == this.values.lo &&
      newAlgorithm.values.hi == this.values.hi
    );
  }

  override setAttribute(name: string, value: string): boolean {
    switch (name) {
      case "algorithmType":
        this.algorithmType = ALGORITHMTYPE[value];
        return true;
      case "seed":
        this.values.seed = value;
        this.values.rn = new RandomNumber(value);
        return true;
      case "initialValue":
        this.values.initialValue = parseFloat(value);
        return true;
      case "alpha":
        this.values.alpha = parseFloat(value);
        return true;
      case "sigma":
        this.values.sigma = parseFloat(value);
        return true;
      case "lo":
        this.values.lo = parseFloat(value);
        return true;
      case "hi":
        this.values.hi = parseFloat(value);
        return true;
    }
    return false;
  }

  override getCurrentValue(time: number, _beat?: number): number {
    // determine the next Wiener series value and bound it between lo and hi
    // reverse the trend if the value goes too high or too low
    if (time == 0 || (this.values.sigma == 0 && this.values.alpha))
      return this.values.initialValue;

    const random: number =
      this.values.sigma == 0
        ? 0
        : gaussianRandom(
            0,
            this.values.sigma * Math.sqrt(time),
            this.values.rn
          );
    const result = this.values.initialValue + this.values.alpha * time + random;
    return Math.min(this.values.hi, Math.max(this.values.lo, result));
  }

  override async appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      const returnElem: Element = elem;
      returnElem.setAttribute("algorithmType", ALGORITHMTYPE.Wiener);
      returnElem.setAttribute("seed", this.values.seed);
      returnElem.setAttribute(
        "initialValue",
        this.values.initialValue.toString()
      );
      returnElem.setAttribute("alpha", this.values.alpha.toString());
      returnElem.setAttribute("sigma", this.values.sigma.toString());
      returnElem.setAttribute("lo", this.values.lo.toString());
      returnElem.setAttribute("hi", this.values.hi.toString());
      return Promise.resolve(returnElem);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }

  static override async getXML(
    elem: Element,
    _version: string
  ): Promise<WienerValues> {
    try {
      const g: WienerValues = new WienerValues();
      g.values.seed = getAttributeValueWithDefault(
        elem,
        "seed",
        "string",
        "seed"
      ) as string;
      g.values.rn = new RandomNumber(g.values.seed);
      g.values.initialValue = getAttributeValueWithDefault(
        elem,
        "initialValue",
        "float",
        0
      ) as number;
      g.values.alpha = getAttributeValueWithDefault(
        elem,
        "alpha",
        "float",
        0
      ) as number;
      g.values.sigma = getAttributeValueWithDefault(
        elem,
        "sigma",
        "float",
        0
      ) as number;
      g.values.lo = getAttributeValueWithDefault(
        elem,
        "lo",
        "float",
        0
      ) as number;
      g.values.hi = getAttributeValueWithDefault(
        elem,
        "hi",
        "float",
        0
      ) as number;
      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  static override validate(algorithm: WienerValues): string[] {
    const errors: string[] = [];
    const values: WienerType = algorithm.values;
    if (values.sigma < 0) errors.push("Sigma must be nonnegative");
    if (values.lo < -10 || values.hi <= values.lo)
      errors.push("Lo greater than -10 and hi must be greater than lo");
    return errors;
  }
}
