import RandomNumber from "classes/randomnumber";
import { ALGORITHMTYPE, AutoregressiveType } from "types";
import { getAttributeValueWithDefault } from "utils/xmlfunctions";
import { AlgorithmValues } from "./algorithmvalues";

export default class AutoregressiveValues extends AlgorithmValues {
  override values: AutoregressiveType;
  constructor(
    values: AutoregressiveType = {
      initialValue: 0,
      seed: "",
      rn: new RandomNumber(""),
      alpha: 0,
      sigma: 0,
      lo: 0,
      hi: 0,
      currentValue: 0,
    }
  ) {
    super(ALGORITHMTYPE.Autoregressive);
    this.values = { ...values };
    this.values.rn = new RandomNumber(this.values.seed);
  }
  override copy(): AutoregressiveValues {
    const n: AutoregressiveValues = new AutoregressiveValues({
      ...this.values,
    });
    n.values.rn = new RandomNumber(this.values.seed);
    return n;
  }
  override isEqual(newAlgorithm: AutoregressiveValues): boolean {
    if (!(newAlgorithm instanceof AutoregressiveValues)) return false;
    return (
      newAlgorithm.values.alpha == newAlgorithm.values.alpha &&
      newAlgorithm.values.hi == newAlgorithm.values.hi &&
      newAlgorithm.values.lo == newAlgorithm.values.lo &&
      newAlgorithm.values.sigma == newAlgorithm.values.sigma &&
      newAlgorithm.values.seed == newAlgorithm.values.seed
    );
  }

  override setAttribute(name: string, value: string): boolean {
    switch (name) {
      case "algorithmType":
        this.algorithmType = ALGORITHMTYPE[value];
        return true;
      case "initialValue":
        this.values.initialValue = parseFloat(value);
        this.values.currentValue = this.values.initialValue;
        return true;
      case "seed":
        this.values.seed = value;
        this.values.rn = new RandomNumber(value);
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
    let epsilon: number = 0;
    if (time == 0) {
      this.values.currentValue = this.values.initialValue;
      return this.values.initialValue;
    } else epsilon = (this.values.rn.rand() - 0.5) * this.values.sigma;
    let newValue: number = Math.min(
      Math.max(
        (this.values.currentValue - this.values.initialValue) *
          this.values.alpha +
          epsilon +
          this.values.initialValue,
        this.values.lo
      ),
      this.values.hi
    );
    this.values.currentValue = newValue;
    return newValue;
  }
  override async appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      elem.setAttribute("algorithmType", ALGORITHMTYPE.Autoregressive);
      elem.setAttribute("seed", this.values.seed);
      elem.setAttribute("initialValue", this.values.initialValue.toString());
      elem.setAttribute("alpha", this.values.alpha.toString());
      elem.setAttribute("sigma", this.values.sigma.toString());
      elem.setAttribute("lo", this.values.lo.toString());
      elem.setAttribute("hi", this.values.hi.toString());
      return Promise.resolve(elem);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }
  static override async getXML(
    elem: Element,
    _version: string
  ): Promise<AutoregressiveValues> {
    try {
      const g: AutoregressiveValues = new AutoregressiveValues();
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
      g.values.currentValue = g.values.initialValue;
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

  static override validate(algorithm: AutoregressiveValues): string[] {
    const errors: string[] = [];
    if (
      algorithm.values.initialValue < algorithm.values.lo ||
      algorithm.values.initialValue > algorithm.values.hi
    )
      errors.push("Initial Value must be between lo and hi, inclusive.");
    if (algorithm.values.lo > algorithm.values.hi)
      errors.push("Hi must be greter than Lo.");
    if (Math.abs(algorithm.values.alpha) > 1)
      errors.push("Alpha value must be tween -1 and 1.");
    return errors;
  }
}
