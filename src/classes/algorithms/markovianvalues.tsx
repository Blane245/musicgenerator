import RandomNumber from "classes/randomnumber";
import { ALGORITHMTYPE, EPS, MarkovianType, MARKOVSTATE } from "types";
import { getAttributeValueWithDefault } from "utils/xmlfunctions";
import { AlgorithmValues } from "./algorithmvalues";

export default class MarkovianValues extends AlgorithmValues {
  override values: MarkovianType;

  constructor(
    values: MarkovianType = {
      seed: "seed",
      rn: new RandomNumber("seed"),
      currentState: MARKOVSTATE.same,
      currentValue: 0,
      startValue: 0,
      range: {
        lo: 0,
        hi: 0,
        step: 0,
      },
      same: { same: 0, up: 0, down: 0 },
      up: { same: 0, up: 0, down: 0 },
      down: { same: 0, up: 0, down: 0 },
    }
  ) {
    super(ALGORITHMTYPE.Markovian);
    this.values = { ...values };
    this.values.rn = new RandomNumber(this.values.seed);
  }

  override copy(): MarkovianValues {
    const n: MarkovianValues = new MarkovianValues(this.values);
    n.values.rn = new RandomNumber(this.values.seed);
    return n;
  }
  override isEqual(newAlgorithm: MarkovianValues): boolean {
    if (!(newAlgorithm instanceof MarkovianValues)) return false;
    return (
      newAlgorithm.values.same.same == newAlgorithm.values.same.same &&
      newAlgorithm.values.same.up == newAlgorithm.values.same.up &&
      newAlgorithm.values.same.down == newAlgorithm.values.same.down &&
      newAlgorithm.values.up.same == newAlgorithm.values.up.same &&
      newAlgorithm.values.up.up == newAlgorithm.values.up.up &&
      newAlgorithm.values.up.down == newAlgorithm.values.up.down &&
      newAlgorithm.values.down.same == newAlgorithm.values.down.same &&
      newAlgorithm.values.down.up == newAlgorithm.values.down.up &&
      newAlgorithm.values.down.down == newAlgorithm.values.down.down &&
      newAlgorithm.values.range.hi == newAlgorithm.values.range.hi &&
      newAlgorithm.values.range.step == newAlgorithm.values.range.step &&
      newAlgorithm.values.range.lo == newAlgorithm.values.range.lo &&
      newAlgorithm.values.seed == this.values.seed &&
      newAlgorithm.values.startValue == this.values.startValue
    );
  }

  override setAttribute(name: string, value: string): boolean {
    switch (name) {
      case "algorithmType":
        this.algorithmType = ALGORITHMTYPE[value];
        return true;
      case "startValue":
        this.values.startValue = parseFloat(value);
        this.values.currentValue = this.values.startValue;
        return true;
      case "seed":
        this.values.seed = value;
        this.values.rn = new RandomNumber(value);
        return true;
      case "range-lo":
        this.values.range.lo = parseFloat(value);
        return true;
      case "range-hi":
        this.values.range.hi = parseFloat(value);
        return true;
      case "range-step":
        this.values.range.step = parseFloat(value);
        return true;
      case "same-same":
        this.values.same.same = parseFloat(value);
        return true;
      case "same-up":
        this.values.same.up = parseFloat(value);
        return true;
      case "same-down":
        this.values.same.down = parseFloat(value);
        return true;
      case "up-same":
        this.values.up.same = parseFloat(value);
        return true;
      case "up-up":
        this.values.up.up = parseFloat(value);
        return true;
      case "up-down":
        this.values.up.down = parseFloat(value);
        return true;
      case "down-same":
        this.values.down.same = parseFloat(value);
        return true;
      case "down-up":
        this.values.down.up = parseFloat(value);
        return true;
      case "down-down":
        this.values.down.down = parseFloat(value);
        return true;
      default:
        return true;
    }
  }

  override getCurrentValue(time: number, _beat?: number): number {
    if (time == 0) {
      this.values.currentState = MARKOVSTATE.same;
      this.values.currentValue = this.values.startValue;
      return this.values.startValue;
    }
    const x: number = this.values.rn.rand();
    let newState: MARKOVSTATE = MARKOVSTATE.same;
    switch (this.values.currentState) {
      case MARKOVSTATE.same:
        if (x <= this.values.same.same) newState = MARKOVSTATE.same;
        else if (x <= this.values.same.same + this.values.same.up)
          newState = MARKOVSTATE.up;
        else newState = MARKOVSTATE.down;
        break;
      case MARKOVSTATE.up:
        if (x <= this.values.up.same) newState = MARKOVSTATE.same;
        else if (x <= this.values.up.same + this.values.up.up)
          newState = MARKOVSTATE.up;
        else newState = MARKOVSTATE.down;
        break;
      case MARKOVSTATE.down:
        if (x <= this.values.down.same) newState = MARKOVSTATE.same;
        else if (x <= this.values.down.same + this.values.down.up)
          newState = MARKOVSTATE.up;
        else newState = MARKOVSTATE.down;
        break;
    }
    this.values.currentState = newState;

    // the next value cannot exceed the lo and hi range
    let value: number = this.values.currentValue;
    switch (newState) {
      case MARKOVSTATE.same:
        break;
      case MARKOVSTATE.up:
        value = Math.min(value + this.values.range.step, this.values.range.hi);
        break;
      case MARKOVSTATE.down:
        value = Math.max(value - this.values.range.step, this.values.range.lo);
        break;
      default:
        break;
    }
    this.values.currentValue = value;
    return value;
  }

  override async appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      elem.setAttribute("algorithmType", ALGORITHMTYPE.Markovian);
      elem.setAttribute("seed", this.values.seed);
      elem.setAttribute("startValue", this.values.startValue.toString());
      elem.setAttribute("range.lo", this.values.range.lo.toString());
      elem.setAttribute("range.hi", this.values.range.hi.toString());
      elem.setAttribute("range.step", this.values.range.step.toString());
      elem.setAttribute("same.same", this.values.same.same.toString());
      elem.setAttribute("same.up", this.values.same.up.toString());
      elem.setAttribute("same.down", this.values.same.down.toString());
      elem.setAttribute("up.same", this.values.up.same.toString());
      elem.setAttribute("up.up", this.values.up.up.toString());
      elem.setAttribute("up.down", this.values.up.down.toString());
      elem.setAttribute("down.same", this.values.down.same.toString());
      elem.setAttribute("down.up", this.values.down.up.toString());
      elem.setAttribute("down.down", this.values.down.down.toString());
      return Promise.resolve(elem);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }

  static override async getXML(
    elem: Element,
    _version: string
  ): Promise<MarkovianValues> {
    try {
      const g: MarkovianValues = new MarkovianValues();
      g.values.seed = getAttributeValueWithDefault(
        elem,
        "seed",
        "string",
        "seed"
      ) as string;
      g.values.rn = new RandomNumber(g.values.seed);
      g.values.startValue = getAttributeValueWithDefault(
        elem,
        "startValue",
        "float",
        0
      ) as number;
      g.values.currentValue = g.values.startValue;
      g.values.range.lo = getAttributeValueWithDefault(
        elem,
        "range.lo",
        "float",
        0
      ) as number;
      g.values.range.hi = getAttributeValueWithDefault(
        elem,
        "range.hi",
        "float",
        0
      ) as number;
      g.values.range.step = getAttributeValueWithDefault(
        elem,
        "range.step",
        "float",
        0
      ) as number;
      g.values.same.same = getAttributeValueWithDefault(
        elem,
        "same.same",
        "float",
        0
      ) as number;
      g.values.same.up = getAttributeValueWithDefault(
        elem,
        "same.up",
        "float",
        0
      ) as number;
      g.values.same.down = getAttributeValueWithDefault(
        elem,
        "same.down",
        "float",
        0
      ) as number;
      g.values.up.same = getAttributeValueWithDefault(
        elem,
        "up.same",
        "float",
        0
      ) as number;
      g.values.up.up = getAttributeValueWithDefault(
        elem,
        "up.up",
        "float",
        0
      ) as number;
      g.values.up.down = getAttributeValueWithDefault(
        elem,
        "up.down",
        "float",
        0
      ) as number;
      g.values.down.same = getAttributeValueWithDefault(
        elem,
        "down.same",
        "float",
        0
      ) as number;
      g.values.down.up = getAttributeValueWithDefault(
        elem,
        "down.up",
        "float",
        0
      ) as number;
      g.values.down.down = getAttributeValueWithDefault(
        elem,
        "down.down",
        "float",
        0
      ) as number;

      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  static override validate(algorithm: MarkovianValues): string[] {
    const errors: string[] = [];
    if (algorithm.values.seed == "") errors.push("Seed must not be blank");
    // validate cumulative probabilities
    let cum: number = 0;
    cum =
      algorithm.values.same.same +
      algorithm.values.same.up +
      algorithm.values.same.down;
    if (Math.abs(cum - 1.0) > EPS)
      errors.push(`Same state probabilities add up to ${cum} and should be 1`);
    cum =
      algorithm.values.up.same +
      algorithm.values.up.up +
      algorithm.values.up.down;
    if (Math.abs(cum - 1.0) > EPS)
      errors.push(`Up state probabilities add up to ${cum} and should be 1`);
    cum =
      algorithm.values.down.same +
      algorithm.values.down.up +
      algorithm.values.down.down;
    if (Math.abs(cum - 1.0) > EPS)
      errors.push(`Down state probabilities add up to ${cum} and should be 1`);

    // validate range
    if (algorithm.values.range.hi < algorithm.values.range.lo)
      errors.push(`Range lo must be less than or equal to range hi`);
    if (
      algorithm.values.range.step >
      algorithm.values.range.hi - algorithm.values.range.lo
    )
      errors.push(
        `Step size must not exceed the difference between range lo and range hi`
      );
    if (
      algorithm.values.startValue < algorithm.values.range.lo ||
      algorithm.values.startValue > algorithm.values.range.hi
    )
      errors.push(`Start value must be between range lo and range hi`);

    return errors;
  }
}
