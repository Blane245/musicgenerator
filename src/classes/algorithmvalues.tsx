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

  setAttribute(name: string, value: string) {
    switch (name) {
      case "algorithmType":
        this.algorithmType = ALGORITHMTYPE[value];
        break;
      default:
        break;
    }
  }
  getCurrentValue(
    _time: number,
    _measureLength?: number,
    _beatCount?: number
  ): number {
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
  override setAttribute(name: string, value: string): void {
    super.setAttribute(name, value);
    if (name == "value") this.values.value = parseFloat(value);
  }
  override getCurrentValue(
    _time: number,
    _measureLength?: number,
    _beatCount?: number
  ): number {
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

  override getCurrentValue(
    time: number,
    _measureLength?: number,
    _beatCount?: number
  ): number {
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
  override setAttribute(name: string, value: string): void {
    super.setAttribute(name, value);
    switch (name) {
      case "initialValue":
        this.values.initialValue = parseFloat(value);
        this.values.currentValue = this.values.initialValue;
        return;
      case "seed":
        this.values.seed = value;
        this.values.rn = new RandomNumber(value);
        return;
      case "alpha":
        this.values.alpha = parseFloat(value);
        return;
      case "sigma":
        this.values.sigma = parseFloat(value);
        return;
      case "lo":
        this.values.lo = parseFloat(value);
        return;
      case "hi":
        this.values.hi = parseFloat(value);
        return;
    }
  }
  override getCurrentValue(
    time: number,
    _measureLength?: number,
    _beatCount?: number
  ): number {
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

  override setAttribute(name: string, value: string): void {
    super.setAttribute(name, value);
    switch (name) {
      case "startValue":
        this.values.startValue = parseFloat(value);
        this.values.currentValue = this.values.startValue;
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

  override getCurrentValue(
    time: number,
    _measureLength?: number,
    _beatCount?: number
  ): number {
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

  override getCurrentValue(
    time: number,
    _measureLength?: number,
    _beatCount?: number
  ): number {
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

const timeToBeat = (time: number, measureLength: number, beatCount: number) =>
  // measureLength != 0 ? (beatCount * time *) / measureLength : 0;
  measureLength != 0 ? (beatCount * time) : 0;

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
export class SequenceValues extends AlgorithmValues {
  override values: SequenceType = {
    sequenceAttribute: SEQUENCEATTRIBUTE.none,
    name: "",
    items: [],
  };
  constructor(sequenceAttribute: SEQUENCEATTRIBUTE) {
    super(ALGORITHMTYPE.Sequence);
    this.values.sequenceAttribute = sequenceAttribute;
    if (sequenceAttribute == SEQUENCEATTRIBUTE.note) this.values.transpose = 0;
  }
  override copy(): SequenceValues {
    const n: SequenceValues = new SequenceValues(this.values.sequenceAttribute);
    n.values.name = this.values.name;
    n.values.items = [...this.values.items];
    return n;
  }
  override async setAttribute(name: string, value: string) {
    switch (name) {
      case "algorithmType":
        this.algorithmType = ALGORITHMTYPE[value];
        break;
      case "sequenceType":
        this.values.sequenceAttribute = SEQUENCEATTRIBUTE[value];
        break;
      case "name":
        this.values.name = value;
        this.values.items = await loadSequenceItems(
          this.values.sequenceAttribute,
          this.values.name
        );
        break;
      case "transpose":
        this.values.transpose = parseFloat(value);
        break;
      default:
        break;
    }
    return;
  }
  override getCurrentValue(
    time: number,
    measureLength: number,
    beatCount: number
  ): number {
    const beat: number = timeToBeat(time, measureLength, beatCount);
    const itemIndex: number = beatsToIndex(beat, this.values.items);
    const value: number = (itemIndex < 0)? 0: this.values.items[itemIndex].value;
    console.log('beat, itemindex, value', beat, itemIndex,value)
    if (itemIndex < 0) return 0;
    return this.values.items[itemIndex].value;
  }
  override async appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      const returnElem: Element = elem;
      returnElem.setAttribute("algorithmType", this.algorithmType);
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
    const s: SequenceValues = new SequenceValues(SEQUENCEATTRIBUTE.none);
    s.values.sequenceAttribute = getAttributeValue(
      elem,
      "sequenceattribute",
      "string"
    ) as SEQUENCEATTRIBUTE;
    s.values.name = getAttributeValue(elem, "name", "string") as string;
    s.values.items = await loadSequenceItems(
      s.values.sequenceAttribute,
      s.values.name
    );
    try {
      s.values.transpose = getAttributeValue(
        elem,
        "transpose",
        "float"
      ) as number;
    } catch (e) {
      s.values.transpose = undefined;
    }
    return Promise.resolve(s);
  }

  // this class and its derived class objects need to validation
  static override validate(_algorithm: SequenceValues): string[] {
    return [];
  }
}

// export class NoteSequence extends SequenceValues {
//   override values: NoteType;

//   constructor(
//     values: NoteType = {
//       name: "",
//       sequenceType: SEQUENCEATTRIBUTE.note,
//       items: [],
//       transpose: 0,
//     }
//   ) {
//     super();
//     this.values = { ...values };
//   }
//   override copy(): NoteSequence {
//     return new NoteSequence(this.values);
//   }
//   override async setAttribute(name: string, value: string) {
//     switch (name) {
//       case "name":
//         this.values.name = value;
//         this.values.items = (await loadSequenceItems(
//           this.values.sequenceType,
//           this.values.name
//         )) as NoteItem[];
//         break;
//       case "transpose":
//         this.values.transpose = parseFloat(value);
//         break;
//     }
//     return;
//   }

//   override getCurrentValue(
//     time: number,
//     measureLength: number,
//     beatCount: number
//   ): number {
//     const beat: number = timeToBeat(time, measureLength, beatCount);
//     const itemIndex: number = beatsToIndex(beat, this.values.items);
//     let itemIndex: number = -1;
//     const items: NoteItem[] = this.values.items;
//     if (items.length == 0) return 0;
//     let beatSum: number = 0;
//     for (let i = 0; i < items.length && itemIndex < 0; i++) {
//       if (items[i].beats + beatSum > beat) itemIndex = i;
//       beatSum += items[i].beats;
//       if (i == items.length - 1) itemIndex = items.length - 1;
//     }
//     return itemIndex < 0 ? 0 : noteToMidi(items[itemIndex].note);
//   }

//   override async appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
//     try {
//       const returnElem: Element = elem;
//       returnElem.setAttribute("algorithmType", ALGORITHMTYPE.Sequence);
//       returnElem.setAttribute("name", this.values.name);
//       returnElem.setAttribute(
//         "sequencetype",
//         SEQUENCEATTRIBUTE[this.values.sequenceType]
//       );
//       returnElem.setAttribute("transpose", this.values.transpose.toString());

//       return Promise.resolve(returnElem);
//     } catch (e: any) {
//       return Promise.reject(e);
//     }
//   }
//   static override async getXML(
//     elem: Element,
//     _version: string
//   ): Promise<NoteSequence> {
//     const g: NoteSequence = new NoteSequence();
//     g.values.name = getAttributeValue(elem, "name", "string") as string;
//     g.values.items = (await loadSequenceItems(
//       g.values.sequenceType,
//       g.values.name
//     )) as NoteItem[];
//     g.values.transpose = getAttributeValue(
//       elem,
//       "transpose",
//       "float"
//     ) as number;
//     return Promise.resolve(new NoteSequence());
//   }
// }
// export class SpeedSequence extends SequenceValues {
//   override values: SpeedType;
//   constructor(
//     values: SpeedType = {
//       name: "",
//       sequenceType: SEQUENCEATTRIBUTE.note,
//       items: [],
//     }
//   ) {
//     super();
//     this.values = { ...values };
//   }
//   override copy(): SpeedSequence {
//     return new SpeedSequence(this.values);
//   }
//   override async setAttribute(name: string, value: string) {
//     switch (name) {
//       case "name":
//         this.values.name = value;
//         this.values.items = (await loadSequenceItems(
//           this.values.sequenceType,
//           this.values.name
//         )) as SpeedItem[];
//         break;
//     }
//     return;
//   }

//   override async appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
//     try {
//       const returnElem: Element = elem;
//       returnElem.setAttribute("algorithmType", ALGORITHMTYPE.Sequence);
//       returnElem.setAttribute("name", this.values.name);
//       returnElem.setAttribute(
//         "sequencetype",
//         SEQUENCEATTRIBUTE[this.values.sequenceType]
//       );

//       return Promise.resolve(returnElem);
//     } catch (e: any) {
//       return Promise.reject(e);
//     }
//   }
//   static override async getXML(
//     elem: Element,
//     _version: string
//   ): Promise<SpeedSequence> {
//     const g: SpeedSequence = new SpeedSequence();
//     g.values.name = getAttributeValue(elem, "name", "string") as string;
//     g.values.items = (await loadSequenceItems(
//       g.values.sequenceType,
//       g.values.name
//     )) as SpeedItem[];
//     return Promise.resolve(new SpeedSequence());
//   }
// }
// export class AttackSequence extends SequenceValues {
//   override values: AttackType;
//   constructor(
//     values: AttackType = {
//       name: "",
//       sequenceType: SEQUENCEATTRIBUTE.attack,
//       items: [],
//     }
//   ) {
//     super();
//     this.values = { ...values };
//   }
//   override copy(): AttackSequence {
//     return new AttackSequence(this.values);
//   }
//   override async setAttribute(name: string, value: string) {
//     switch (name) {
//       case "name":
//         this.values.name = value;
//         this.values.items = (await loadSequenceItems(
//           this.values.sequenceType,
//           this.values.name
//         )) as AttackItem[];
//         break;
//     }
//     return;
//   }

//   override appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
//     try {
//       const returnElem: Element = elem;
//       returnElem.setAttribute("algorithmType", ALGORITHMTYPE.Sequence);
//       returnElem.setAttribute("name", this.values.name);
//       returnElem.setAttribute(
//         "sequencetype",
//         SEQUENCEATTRIBUTE[this.values.sequenceType]
//       );

//       return Promise.resolve(returnElem);
//     } catch (e: any) {
//       return Promise.reject(e);
//     }
//   }
//   static override async getXML(
//     elem: Element,
//     _version: string
//   ): Promise<AttackSequence> {
//     const g: AttackSequence = new AttackSequence();
//     g.values.name = getAttributeValue(elem, "name", "string") as string;
//     g.values.items = (await loadSequenceItems(
//       g.values.sequenceType,
//       g.values.name
//     )) as AttackItem[];
//     return Promise.resolve(new AttackSequence());
//   }
// }
// export class DurationSequence extends SequenceValues {
//   override values: DurationType;
//   constructor(
//     values: DurationType = {
//       name: "",
//       sequenceType: SEQUENCEATTRIBUTE.duration,
//       items: [],
//     }
//   ) {
//     super();
//     this.values = { ...values };
//   }
//   override copy(): DurationSequence {
//     return new DurationSequence(this.values);
//   }
//   override async setAttribute(name: string, value: string) {
//     switch (name) {
//       case "name":
//         this.values.name = value;
//         this.values.items = (await loadSequenceItems(
//           this.values.sequenceType,
//           this.values.name
//         )) as DurationItem[];
//         break;
//     }
//     return;
//   }

//   override appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
//     try {
//       const returnElem: Element = elem;
//       returnElem.setAttribute("algorithmType", ALGORITHMTYPE.Sequence);
//       returnElem.setAttribute("name", this.values.name);
//       returnElem.setAttribute(
//         "sequencetype",
//         SEQUENCEATTRIBUTE[this.values.sequenceType]
//       );

//       return Promise.resolve(returnElem);
//     } catch (e: any) {
//       return Promise.reject(e);
//     }
//   }
//   static override async getXML(
//     elem: Element,
//     _version: string
//   ): Promise<DurationSequence> {
//     const g: DurationSequence = new DurationSequence();
//     g.values.name = getAttributeValue(elem, "name", "string") as string;
//     g.values.items = (await loadSequenceItems(
//       g.values.sequenceType,
//       g.values.name
//     )) as DurationItem[];
//     return Promise.resolve(new DurationSequence());
//   }
// }
// export class VolumeSequence extends SequenceValues {
//   override values: VolumeType;
//   constructor(
//     values: VolumeType = {
//       name: "",
//       sequenceType: SEQUENCEATTRIBUTE.volume,
//       items: [],
//     }
//   ) {
//     super();
//     this.values = { ...values };
//   }
//   override copy(): VolumeSequence {
//     return new VolumeSequence({ ...this.values });
//   }
//   override async setAttribute(name: string, value: string) {
//     switch (name) {
//       case "name":
//         this.values.name = value;
//         this.values.items = (await loadSequenceItems(
//           this.values.sequenceType,
//           this.values.name
//         )) as VolumeItem[];
//         break;
//     }
//     return;
//   }

//   override appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
//     try {
//       const returnElem: Element = elem;
//       returnElem.setAttribute("algorithmType", ALGORITHMTYPE.Sequence);
//       returnElem.setAttribute("name", this.values.name);
//       returnElem.setAttribute(
//         "sequencetype",
//         SEQUENCEATTRIBUTE[this.values.sequenceType]
//       );

//       return Promise.resolve(returnElem);
//     } catch (e: any) {
//       return Promise.reject(e);
//     }
//   }
//   static override async getXML(
//     elem: Element,
//     _version: string
//   ): Promise<VolumeSequence> {
//     const g: VolumeSequence = new VolumeSequence();
//     g.values.name = getAttributeValue(elem, "name", "string") as string;
//     g.values.items = (await loadSequenceItems(
//       g.values.sequenceType,
//       g.values.name
//     )) as VolumeItem[];
//     return Promise.resolve(new VolumeSequence());
//   }
// }
// export class PanSequence extends SequenceValues {
//   override values: PanType;
//   constructor(
//     values: PanType = {
//       name: "",
//       sequenceType: SEQUENCEATTRIBUTE.pan,
//       items: [],
//     }
//   ) {
//     super();
//     this.values = { ...values };
//   }
//   override copy(): PanSequence {
//     return new PanSequence({ ...this.values });
//   }
//   override async setAttribute(name: string, value: string) {
//     switch (name) {
//       case "name":
//         this.values.name = value;
//         this.values.items = (await loadSequenceItems(
//           this.values.sequenceType,
//           this.values.name
//         )) as PanItem[];
//         break;
//     }
//     return;
//   }

//   override async appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
//     try {
//       const returnElem: Element = elem;
//       returnElem.setAttribute("algorithmType", ALGORITHMTYPE.Sequence);
//       returnElem.setAttribute("name", this.values.name);
//       returnElem.setAttribute(
//         "sequencetype",
//         SEQUENCEATTRIBUTE[this.values.sequenceType]
//       );
//       return Promise.resolve(returnElem);
//     } catch (e: any) {
//       return Promise.reject(e);
//     }
//   }
//   static override async getXML(
//     elem: Element,
//     _version: string
//   ): Promise<PanSequence> {
//     const g: PanSequence = new PanSequence();
//     g.values.name = getAttributeValue(elem, "name", "string") as string;
//     g.values.items = (await loadSequenceItems(
//       g.values.sequenceType,
//       g.values.name
//     )) as PanItem[];

//     return Promise.resolve(g);
//   }
// }
