// the classes in this file provide the ability to use different generator
// types for each of the sound parameters - note, speed, volume, and pan

import {
  ALGORITHMTYPE,
  AlgorithmType,
  AutoregressiveType,
  ConstantType,
  EPS,
  MarkovianType,
  MARKOVSTATE,
  MODULATOR,
  ModulatorMap,
  OscillatorType,
  SEQUENCEATTRIBUTE,
  SequenceType,
  WienerType,
} from "types";
import { gaussianRandom } from "utils/gaussianrandom";
import { loadSequenceItems } from "utils/loadsequenceitems";
import { getAttributeValue } from "utils/xmlfunctions";
import RandomNumber from "./randomnumber";
import { SequenceItem } from "./sequenceitems";
// import { AttackItem, DurationItem, NoteItem, PanItem, SequenceItem, SpeedItem, VolumeItem } from "./sequenceitems";

// the parent class for this collection holds the properties that are required
// for some of the generators.
// The user interface should take care to check that these have been specified
export class AlgorithmValues {
  algorithmType: ALGORITHMTYPE = ALGORITHMTYPE.None; // the type of algorithm
  values: AlgorithmType = { value: 0 };

  constructor(algorithmType: ALGORITHMTYPE) {
    this.algorithmType = algorithmType;
  }

  copy(): AlgorithmValues {
    return new AlgorithmValues(ALGORITHMTYPE.None);
  }

  isEqual(newAlgorithm: AlgorithmValues): boolean {
    return newAlgorithm instanceof AlgorithmValues;
  }

  getCurrentValue(_time: number, _beat?: number): number {
    return 0;
  }
  async appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
    return Promise.resolve(elem);
  }

  static async getXML(
    _elem: Element,
    _version: string
  ): Promise<AlgorithmValues> {
    return Promise.resolve(new AlgorithmValues(ALGORITHMTYPE.None));
  }

  static validate(algorithm: AlgorithmValues): string[] {
    const errors: string[] = [];
    if (algorithm.algorithmType === ALGORITHMTYPE.None)
      errors.push("Generator algorithm must be specified");
    return errors;
  }
}

export class ConstantValues extends AlgorithmValues {
  override values: ConstantType;
  constructor(initialValue?: number) {
    super(ALGORITHMTYPE.Constant);
    this.values = {
      value: initialValue ? initialValue : 0,
    };
  }
  override copy(): ConstantValues {
    const n = new ConstantValues(this.values.value);
    return n;
  }

  override isEqual(newAlgorithm: ConstantValues): boolean {
    if (!(newAlgorithm instanceof ConstantValues)) return false;
    return newAlgorithm.values.value == newAlgorithm.values.value;
  }

  setAttribute(name: string, value: string): boolean {
    if (name == "value") {
      this.values.value = parseFloat(value);
      return true;
    }
    if (name == "algorithmType") {
      this.algorithmType = ALGORITHMTYPE[value];
      return true;
    }

    return false;
  }
  override getCurrentValue(_time: number, _beat?: number): number {
    return this.values.value;
  }
  override async appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      elem.setAttribute("algorithmType", ALGORITHMTYPE.Constant);
      elem.setAttribute("value", this.values.value.toString());
      return Promise.resolve(elem);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }

  static override async getXML(
    elem: Element,
    _version: string
  ): Promise<ConstantValues> {
    try {
      const g: ConstantValues = new ConstantValues();
      g.values.value = getAttributeValue(elem, "value", "float") as number;

      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }
  static override validate(_algorithm: ConstantValues): string[] {
    const result: string[] = [];
    return result;
  }
}

// a algorithm that is an oscillator
export class OscillatorValues extends AlgorithmValues {
  override values: OscillatorType;
  constructor(
    values: OscillatorType = {
      type: MODULATOR.SINE,
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
    const n = new OscillatorValues(this.values);
    return n;
  }

  override isEqual(newAlgorithm: OscillatorValues): boolean {
    if (!(newAlgorithm instanceof OscillatorValues)) return false;
    return (
      newAlgorithm.values.amplitude == newAlgorithm.values.amplitude &&
      newAlgorithm.values.center == newAlgorithm.values.center &&
      newAlgorithm.values.frequency == newAlgorithm.values.frequency &&
      newAlgorithm.values.phase == newAlgorithm.values.phase
    );
  }

  setAttribute(name: string, value: string): boolean {
    switch (name) {
      case "algorithmType":
        this.algorithmType = ALGORITHMTYPE[value];
        return true;
      case "type":
        this.values.type = MODULATOR[value];
        return true;
      case "center":
        this.values.center = parseFloat(value);
        return true;
      case "frequency":
        this.values.frequency = parseFloat(value);
        return true;
      case "amplitude":
        this.values.amplitude = parseFloat(value);
        return true;
      case "phase":
        this.values.phase = parseFloat(value);
        return true;
      default:
        return false;
    }
  }

  override getCurrentValue(time: number, _beat?: number): number {
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
      const g: OscillatorValues = new OscillatorValues();
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

export class AutoregressiveValues extends AlgorithmValues {
  override values: AutoregressiveType;
  constructor(
    values: AutoregressiveType = {
      initialValue: 0,
      seed: "seed",
      rn: new RandomNumber("seed"),
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

  setAttribute(name: string, value: string): boolean {
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
      g.values.seed = getAttributeValue(elem, "seed", "string") as string;
      g.values.rn = new RandomNumber(g.values.seed);
      g.values.initialValue = getAttributeValue(
        elem,
        "initialValue",
        "float"
      ) as number;
      g.values.currentValue = g.values.initialValue;
      g.values.alpha = getAttributeValue(elem, "alpha", "float") as number;
      g.values.sigma = getAttributeValue(elem, "sigma", "float") as number;
      g.values.lo = getAttributeValue(elem, "lo", "float") as number;
      g.values.hi = getAttributeValue(elem, "hi", "float") as number;
      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  static override validate(algorithm: AutoregressiveValues): string[] {
    const errors: string[] = [];
    if (algorithm.values.seed == "") errors.push("Seed must not be blank");
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

  setAttribute(name: string, value: string): boolean {
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

  setAttribute(name: string, value: string): boolean {
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
    if (values.seed == "") errors.push("Seed must not be blank");
    if (values.sigma < 0) errors.push("Sigma must be nonnegative");
    if (values.lo < -10 || values.hi <= values.lo)
      errors.push("Lo greater than -10 and hi must be greater than lo");
    return errors;
  }
}

const beatsToIndex = (beat: number, items: SequenceItem[]) => {
  if (items.length == 0) return 0;
  let beatSum: number = 0;
  let itemIndex: number = -1;
  for (let i = 0; i < items.length && itemIndex < 0; i++) {
    if (items[i].beats + beatSum > beat) itemIndex = i;
    beatSum += items[i].beats;
    if (i == items.length - 1) itemIndex = items.length - 1;
  }
  return itemIndex;
};

export default class SequenceValues extends AlgorithmValues {
  override values: SequenceType;
  constructor(sequenceAttribute: SEQUENCEATTRIBUTE) {
    super(ALGORITHMTYPE.Sequencer);
    this.values = {
      sequenceAttribute: sequenceAttribute,
      transpose: 0,
      name: "",
      items: [],
    };
  }
  override copy(): SequenceValues {
    const n: SequenceValues = new SequenceValues(this.values.sequenceAttribute);
    n.values.name = this.values.name;
    n.values.transpose = this.values.transpose;
    n.values.items = [...this.values.items];
    return n;
  }
  override isEqual(newAlgorithm: SequenceValues): boolean {
    if (!(newAlgorithm instanceof SequenceValues)) return false;
    return (
      newAlgorithm.values.sequenceAttribute == this.values.sequenceAttribute &&
      newAlgorithm.values.name == this.values.name &&
      newAlgorithm.values.transpose == this.values.transpose
    );
  }

  async setAttribute(name: string, value: string): Promise<boolean> {
    switch (name) {
      case "algorithmType":
        this.algorithmType = ALGORITHMTYPE[value];
        return true;
      case "sequenceattribute":
        this.values.sequenceAttribute = SEQUENCEATTRIBUTE[value];
        return true;

      case "name":
        this.values.name = value;
        this.values.items = await loadSequenceItems(
          this.values.sequenceAttribute,
          this.values.name
        );
        return true;

      // only used by the note sequence
      case "transpose":
        this.values.transpose = parseFloat(value);
        return true;
      default:
        return false;
    }
  }

  override getCurrentValue(_time: number, beat: number): number {
    const itemIndex: number = beatsToIndex(beat, this.values.items);
    const value: number =
      itemIndex < 0 ? 0 : this.values.items[itemIndex].value;
    // console.log("beat, itemindex, value", beat, itemIndex, value);
    if (itemIndex < 0) return 0;
    return this.values.items[itemIndex].value;
  }
  override async appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      const returnElem: Element = elem;
      returnElem.setAttribute("algorithmType", ALGORITHMTYPE.Sequencer);
      returnElem.setAttribute("name", this.values.name);
      returnElem.setAttribute(
        "sequenceattribute",
        SEQUENCEATTRIBUTE[this.values.sequenceAttribute]
      );
      if (this.values.transpose != undefined) {
        returnElem.setAttribute("transpose", this.values.transpose.toString());
      }

      return Promise.resolve(returnElem);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }
  static override async getXML(
    elem: Element,
    _version: string
  ): Promise<SequenceValues> {
    const sequenceAttribute: SEQUENCEATTRIBUTE = getAttributeValue(
      elem,
      "sequenceattribute",
      "string"
    ) as SEQUENCEATTRIBUTE;

    const s: SequenceValues = new SequenceValues(sequenceAttribute);
    s.values.name = getAttributeValue(elem, "name", "string") as string;
    const sequencePromise: Promise<SequenceItem[]> = loadSequenceItems(
      s.values.sequenceAttribute,
      s.values.name
    );
    const items: SequenceItem[][] = await Promise.all([sequencePromise]);
    s.values.items = items[0];
    try {
      s.values.transpose = getAttributeValue(
        elem,
        "transpose",
        "float"
      ) as number;
    } catch (e) {
      s.values.transpose = 0;
    }
    return Promise.resolve(s);
  }
  static override validate(_algorithm: SequenceValues): string[] {
    return [];
  }
}
