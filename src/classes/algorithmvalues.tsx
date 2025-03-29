// the classes in this file provide the ability to use different generator
// types for each of the sound parameters - note, speed, volume, and pan

import { gaussianRandom } from "../utils/gaussianrandom";
import {
  AlgorithmType,
  ALGORITHMTYPE,
  EPS,
  MarkovianType,
  MARKOVSTATE,
  MODULATOR,
  ModulatorMap,
  OscillatorType,
  WienerType,
} from "../types";
import { getAttributeValue } from "../utils/xmlfunctions";
import RandomNumber from "./randomnumber";

// the parent class for this collection holds the properties that are required
// for some of the generators.
// The user interface should take care to check that these have been specified
export class AlgorithmValues {
  algorithmType: ALGORITHMTYPE;
  values: AlgorithmType;

  constructor(algorithmType: ALGORITHMTYPE = ALGORITHMTYPE.None) {
    this.algorithmType = algorithmType;
  }

  copy(): AlgorithmValues {
    return new AlgorithmValues(this.algorithmType);
  }

  setAttribute(name: string, value: string) {
    switch (name) {
      case "algorithmType":
        this.algorithmType = ALGORITHMTYPE[value];
        break;
      default:
        break;
    }
  }
  getCurrentValue(_time: number): number {
    return 0;
  }
  async appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
    return Promise.resolve(elem);
  }

  static async getXML(
    _elem: Element,
    _version: string
  ): Promise<AlgorithmValues> {
    return Promise.resolve(new AlgorithmValues());
  }

  static validate(algorithm: AlgorithmValues): string[] {
    const errors: string[] = [];
    if (!algorithm.algorithmType)
      errors.push("Generator algorithm must be specified");
    return errors;
  }
}

// a algorithm that is an oscillator
export class OscillatorValues extends AlgorithmValues {
  override values: OscillatorType;
  constructor(
    values: OscillatorType = {
      type: MODULATOR.SINE,
      seed: " ",
      rn: new RandomNumber(" "),
      center: 0,
      frequency: 0,
      amplitude: 0,
      phase: 0,
    }
  ) {
    super(ALGORITHMTYPE.Oscillator);
    this.values = { ...values };
  }

  override copy(): OscillatorValues {
    const n = new OscillatorValues();
    n.values = { ...this.values };
    return n;
  }

  override setAttribute(name: string, value: string): void {
    super.setAttribute(name, value);
    switch (name) {
      case "type":
        this.values.type = MODULATOR[value];
        break;
      case "center":
        this.values.center = parseFloat(value);
        break;
      case "frequency":
        this.values.frequency = parseFloat(value);
        break;
      case "amplitude":
        this.values.amplitude = parseFloat(value);
        break;
      case "phase":
        this.values.phase = parseFloat(value);
        break;
      default:
        break;
    }
  }

  override getCurrentValue(time: number): number {
    let value: number = this.values.center;
    const valueFunction = ModulatorMap.get(this.values.type);
    if (!valueFunction) return value;
    value = valueFunction(
      time,
      this.values.center,
      this.values.frequency,
      this.values.amplitude,
      this.values.phase
    );
    return value;
  }
  override async appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      elem.setAttribute("algorithmType", ALGORITHMTYPE.Oscillator);
      elem.setAttribute("type", this.values.type);
      elem.setAttribute("center", this.values.center.toString());
      elem.setAttribute("frequency", this.values.frequency.toString());
      elem.setAttribute("amplitude", this.values.amplitude.toString());
      elem.setAttribute("phase", this.values.phase.toString());
      return Promise.resolve(elem);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }

  static override async getXML(
    elem: Element,
    _version: string
  ): Promise<OscillatorValues> {
    try {
      const g: OscillatorValues = new OscillatorValues({
        type: MODULATOR.SINE,
        seed: " ",
        rn: new RandomNumber(" "),
        center: 0,
        frequency: 0,
        amplitude: 0,
        phase: 0,
      });
      g.values.type = getAttributeValue(elem, "type", "string") as MODULATOR;
      g.values.center = getAttributeValue(elem, "center", "float") as number;
      g.values.frequency = getAttributeValue(
        elem,
        "frequency",
        "float"
      ) as number;
      g.values.amplitude = getAttributeValue(
        elem,
        "amplitude",
        "float"
      ) as number;
      g.values.phase = getAttributeValue(elem, "phase", "float") as number;

      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }
  static override validate(_algorithm: OscillatorValues): string[] {
    const result: string[] = [];
    return result;
  }
}

export class MarkovianValues extends AlgorithmValues {
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
    const n: MarkovianValues = new MarkovianValues();
    n.values = { ...this.values };
    return n;
  }

  override setAttribute(name: string, value: string): void {
    super.setAttribute(name, value);
    switch (name) {
      case "startValue":
        this.values.startValue = parseFloat(value);
        return;
      case "seed":
        this.values.seed = value;
        this.values.rn = new RandomNumber(value);
        return;
      case "range-lo":
        this.values.range.lo = parseFloat(value);
        return;
      case "range-hi":
        this.values.range.hi = parseFloat(value);
        return;
      case "range-step":
        this.values.range.step = parseFloat(value);
        return;
      case "same-same":
        this.values.same.same = parseFloat(value);
        return;
      case "same-up":
        this.values.same.up = parseFloat(value);
        return;
      case "same-down":
        this.values.same.down = parseFloat(value);
        return;
      case "up-same":
        this.values.up.same = parseFloat(value);
        return;
      case "up-up":
        this.values.up.up = parseFloat(value);
        return;
      case "up-down":
        this.values.up.down = parseFloat(value);
        return;
      case "down-same":
        this.values.down.same = parseFloat(value);
        return;
      case "down-up":
        this.values.down.up = parseFloat(value);
        return;
      case "down-down":
        this.values.down.down = parseFloat(value);
        return;
      default:
        return;
    }
  }

  override getCurrentValue(_time: number): number {
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

    // the next value may 'bounce' off of the hi or lo value
    let value: number = this.values.currentValue;
    switch (newState) {
      case MARKOVSTATE.same:
        break;
      case MARKOVSTATE.up:
        value += this.values.range.step;
        value = Math.min(value, this.values.range.hi);
        if (Math.abs(value - this.values.currentValue) < EPS)
          value -= this.values.range.step;
        break;
      case MARKOVSTATE.down:
        value -= this.values.range.step;
        value = Math.max(value, this.values.range.lo);
        if (Math.abs(value - this.values.currentValue) < EPS)
          value += this.values.range.step;
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
      g.values.seed = getAttributeValue(elem, "seed", "string") as string;
      g.values.rn = new RandomNumber(g.values.seed);
      g.values.startValue = getAttributeValue(
        elem,
        "startValue",
        "float"
      ) as number;
      g.values.currentValue = g.values.startValue;
      g.values.range.lo = getAttributeValue(
        elem,
        "range.lo",
        "float"
      ) as number;
      g.values.range.hi = getAttributeValue(
        elem,
        "range.hi",
        "float"
      ) as number;
      g.values.range.step = getAttributeValue(
        elem,
        "range.step",
        "float"
      ) as number;
      g.values.same.same = getAttributeValue(
        elem,
        "same.same",
        "float"
      ) as number;
      g.values.same.up = getAttributeValue(elem, "same.up", "float") as number;
      g.values.same.down = getAttributeValue(
        elem,
        "same.down",
        "float"
      ) as number;
      g.values.up.same = getAttributeValue(elem, "up.same", "float") as number;
      g.values.up.up = getAttributeValue(elem, "up.up", "float") as number;
      g.values.up.down = getAttributeValue(elem, "up.down", "float") as number;
      g.values.down.same = getAttributeValue(
        elem,
        "down.same",
        "float"
      ) as number;
      g.values.down.up = getAttributeValue(elem, "down.up", "float") as number;
      g.values.down.down = getAttributeValue(
        elem,
        "down.down",
        "float"
      ) as number;

      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  static override validate(algorithm: MarkovianValues): string[] {
    const errors: string[] = [];
    if (algorithm.values.seed == '') errors.push("Seed must not be blank");
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

export class WienerValues extends AlgorithmValues {
  override values: WienerType;

  constructor(
    values: WienerType = {
      seed: "seed",
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
    const n: WienerValues = new WienerValues();
    n.values = { ...this.values };
    return n;
  }

  override setAttribute(name: string, value: string): void {
    super.setAttribute(name, value);
    switch (name) {
      case "seed":
        this.values.seed = value;
        this.values.rn = new RandomNumber(value);
        break;
      case "initialValue":
        this.values.initialValue = parseFloat(value);
        break;
      case "alpha":
        this.values.alpha = parseFloat(value);
        break;
      case "sigma":
        this.values.sigma = parseFloat(value);
        break;
      case "lo":
        this.values.lo = parseFloat(value);
        break;
      case "hi":
        this.values.hi = parseFloat(value);
        break;
    }
  }

  #firstValue: boolean = true;
  #startTime: number = 0;
  override getCurrentValue(time: number): number {
    // determine the next Wiener series value and bound it between lo and hi
    // reverse the trend if the value goes too high or too low
    let result: number = this.values.initialValue;
    if (this.#firstValue || this.values.sigma == 0) {
      this.#firstValue = false;
      this.#startTime = time;
      return result;
    }
    const random: number = gaussianRandom(
      0,
      this.values.sigma * Math.sqrt(time - this.#startTime)
      ,this.values.rn
    );
    result = this.values.initialValue + this.values.alpha * (time - this.#startTime) + random;
    // console.log('Wiener values',
    //   'time', time,
    //   'startTime', this.#startTime, 
    //   'seed', this.values.seed,
    //   'initial', this.values.initialValue,
    //   'alpha', this.values.alpha,
    //   'sigma', this.values.sigma,
    //   'random', random,
    //   'result', result,
    //   'lo', this.values.lo,
    //   'hi', this.values.hi
    // );
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
      g.values.seed = getAttributeValue(elem, "seed", "string") as string;
      g.values.rn = new RandomNumber(g.values.seed);
      g.values.initialValue = getAttributeValue(
        elem,
        "initialValue",
        "float"
      ) as number;
      g.values.alpha = getAttributeValue(elem, "alpha", "float") as number;
      g.values.sigma = getAttributeValue(elem, "sigma", "float") as number;
      g.values.lo = getAttributeValue(elem, "lo", "float") as number;
      g.values.hi = getAttributeValue(elem, "hi", "float") as number;
      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  static override validate(algorithm: WienerValues): string[] {
    const errors: string[] = [];
    const values: WienerType = algorithm.values;
    if (values.seed == '') errors.push("Seed must not be blank");
    if (values.sigma < 0) errors.push("Sigma must be nonnegative");
    if (values.lo < -1 || values.hi <= values.lo)
      errors.push("Lo must be nonnegative and hi must be greater than lo");
    return errors;
  }
}
