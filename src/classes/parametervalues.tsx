// the classes in this file provide the ability to use different generator
// types for each of the sound parameters - note, speed, volume, and pan

import { wienerPoint } from "utils/wienerpoint";
import {
  MODULATOR,
  ModulatorMap,
  PARAMETERMODULATOR,
  ModulationType,
  MARKOVSTATE,
  EPS,
  WienerParameters,
  MarkovianTransitons,
  EuclideanParameterTypes,
} from "../types";
import { getAttributeValue } from "../utils/xmlfunctions";
import RandomNumber from "./randomnumber";
import { euclideanRhythm } from "utils/euclidean-rhythm";

// the parent class for this collection holds the attributes that are required
// for some of the generators.
//  When a parameter set is used for Tone and the
//  type is anything but WhiteNoise or GaussianNoise,
//  the soundFont, presetName, and isLooping must be specified.
// The user interface should take care to check that these have been specified
// whenever a generator is added or modified and the Tone parameter modulator is not noise
export class ParameterValues {
  parameterType: PARAMETERMODULATOR;
  values:
    | ModulationType
    | MarkovianTransitons
    | WienerParameters
    | EuclideanParameters
    | undefined;

  constructor(parameterType: PARAMETERMODULATOR = PARAMETERMODULATOR.None) {
    this.parameterType = parameterType;
  }

  copy(): ParameterValues {
    return new ParameterValues(this.parameterType);
  }

  setAttribute(name: string, value: string) {
    switch (name) {
      case "parameterType":
        this.parameterType = PARAMETERMODULATOR[value];
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

  async getXML(_elem: Element, _version: string): Promise<ParameterValues> {
    return Promise.resolve(new ParameterValues());
  }
}

// a parameter value generator that is an oscillator
// handle the options for soundfont processing is necessary
export class OscillatorValues extends ParameterValues {
  override values: ModulationType;
  constructor(
    values: ModulationType = {
      type: MODULATOR.SINE,
      center: 0,
      frequency: 0,
      amplitude: 0,
      phase: 0,
    }
  ) {
    super(PARAMETERMODULATOR.Oscillator);
    this.values = { ...values };
  }

  override copy(): OscillatorValues {
    return new OscillatorValues(this.values);
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
      elem.setAttribute("parameterType", PARAMETERMODULATOR.Oscillator);
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

  override async getXML(
    elem: Element,
    _version: string
  ): Promise<OscillatorValues> {
    try {
      const g: OscillatorValues = new OscillatorValues({
        type: MODULATOR.SINE,
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
}

export class MarkovianValues extends ParameterValues {
  override values: MarkovianTransitons;
  seed: string;
  rn: RandomNumber;

  constructor(
    values: MarkovianTransitons = {
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
    },
    seed: string = ""
  ) {
    super(PARAMETERMODULATOR.Markovian);
    this.values = { ...values };
    this.seed = seed;
    this.rn = new RandomNumber(seed);
  }

  override copy(): MarkovianValues {
    return new MarkovianValues(this.values, this.seed);
  }

  override setAttribute(name: string, value: string): void {
    super.setAttribute(name, value);
    switch (name) {
      case "startValue":
        this.values.startValue = MODULATOR[value];
        break;
      case "seed":
        this.seed = value;
        this.rn = new RandomNumber(value);
        break;
      case "range.lo":
        this.values.range.lo = parseFloat(value);
        break;
      case "range.hi":
        this.values.range.hi = parseFloat(value);
        break;
      case "range.step":
        this.values.range.step = parseFloat(value);
        break;
      case "same.same":
        this.values.same.same = parseFloat(value);
        break;
      case "same.up":
        this.values.same.up = parseFloat(value);
        break;
      case "same.down":
        this.values.same.down = parseFloat(value);
        break;
      case "up.same":
        this.values.up.same = parseFloat(value);
        break;
      case "up.up":
        this.values.up.up = parseFloat(value);
        break;
      case "up.down":
        this.values.up.down = parseFloat(value);
        break;
      case "down.same":
        this.values.down.same = parseFloat(value);
        break;
      case "down.up":
        this.values.down.up = parseFloat(value);
        break;
      case "down.down":
        this.values.down.down = parseFloat(value);
        break;
      default:
        break;
    }
  }

  override getCurrentValue(_time: number): number {
    const x: number = this.rn.rand();
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
      elem.setAttribute("parameterType", PARAMETERMODULATOR.Markovian);
      elem.setAttribute("seed", this.seed);
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

  override async getXML(
    elem: Element,
    _version: string
  ): Promise<MarkovianValues> {
    try {
      const g: MarkovianValues = new MarkovianValues(      );

      g.seed = getAttributeValue(elem, "seed", "string") as string;
      g.rn = new RandomNumber(g.seed);

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
}

export class WienerValues extends ParameterValues {
  override values: WienerParameters;
  seed: string;
  rn: RandomNumber;

  constructor(
    values: WienerParameters = {
      initialValue: 0,
      alpha: 0,
      sigma: 0,
      lo: 0,
      hi: 0,
    },
    seed: string = ""
  ) {
    super(PARAMETERMODULATOR.Wiener);
    this.values = { ...values };
    this.seed = seed;
    this.rn = new RandomNumber(seed);
  }

  override copy(): WienerValues {
    return new WienerValues(this.values, this.seed);
  }

  override setAttribute(name: string, value: string): void {
    super.setAttribute(name, value);
    switch (name) {
      case "seed":
        this.seed = value;
        this.rn = new RandomNumber(this.seed);
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

  override getCurrentValue(time: number): number {
    return wienerPoint(
      time,
      this.values.initialValue,
      this.values.alpha,
      this.values.sigma,
      this.values.lo,
      this.values.alpha
    );
  }

  override async appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      const returnElem: Element = elem;
      returnElem.setAttribute("type", PARAMETERMODULATOR.Wiener);
      returnElem.setAttribute("seed", this.seed);
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

  override async getXML(
    elem: Element,
    _version: string
  ): Promise<WienerValues> {
    try {
      const g: WienerValues = new WienerValues();
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
}

// a Euclidean parameter set can only be assign to Tone
// it requires a parameter for tone mudulation, which can be Oscillator, Markovian, or Wiener
export type EuclideanParameters = {
  measureLength: number;
  beatCount: number; // the number of strokes in a measure
  noteCount: number; // the number of notes in the octave
  parameterName: PARAMETERMODULATOR;
};
export class EuclideanValues extends ParameterValues {
  override values: EuclideanParameters;
  parameter: EuclideanParameterTypes;
  #beatSequence: number[] = [];
  #noteSequence: number[] = [];
  #currentRhythmEntry: number = 0;

  constructor(
    values: EuclideanParameters = {
      measureLength: 4,
      beatCount: 4,
      noteCount: 7,
      parameterName: PARAMETERMODULATOR.Oscillator,
    }
  ) {
    super(PARAMETERMODULATOR.Euclidean);
    this.values = { ...values };
    switch (this.values.parameterName) {
      case PARAMETERMODULATOR.Oscillator:
        this.parameter = new OscillatorValues();
        break;
      case PARAMETERMODULATOR.Markovian:
        this.parameter = new MarkovianValues();
        break;
      case PARAMETERMODULATOR.Wiener:
        this.parameter = new WienerValues();
        break;
      default:
        this.parameter = new OscillatorValues();
    }
  }

  override copy(): EuclideanValues {
    const n = new EuclideanValues(this.values);
    n.parameter = this.parameter.copy();
    return n;
  }

  override setAttribute(name: string, value: string): void {
    super.setAttribute(name, value);
    switch (name) {
      case "measureLength":
        this.values.measureLength = parseInt(value);
        break;
      case "beatCount":
        this.values.beatCount = parseInt(value);
        break;
      case "parameterName":
        this.values.parameterName = value as PARAMETERMODULATOR;
        switch (this.values.parameterName) {
          case PARAMETERMODULATOR.Oscillator:
            this.parameter = new OscillatorValues();
            break;
          case PARAMETERMODULATOR.Markovian:
            this.parameter = new MarkovianValues();
            break;
          case PARAMETERMODULATOR.Wiener:
            this.parameter = new WienerValues();
            break;
        }
    }

    // handle assigned parameter values being set
    this.parameter.setAttribute(name, value);
  }

  initialSequences() {
    this.#beatSequence = euclideanRhythm(
      this.values.beatCount,
      this.values.measureLength
    );
    this.#noteSequence = euclideanRhythm(this.values.noteCount, 12);
    console.log(
      "sequences initialized",
      this.#beatSequence,
      this.#noteSequence
    );
  }
  override getCurrentValue(time: number): number {
    let value: number = this.parameter.getCurrentValue(time);

    console.log("current beat", this.#currentRhythmEntry);
    // if the current note is to be silent, set the value = 0
    if (this.#beatSequence[this.#currentRhythmEntry] == 0) {
      value = 0;
      this.#currentRhythmEntry =
        (this.#currentRhythmEntry + 1) % this.values.measureLength;
      console.log("note is silent at time", time);
      return value;
    }
    // get the offset from the base note as a rounded integer
    let midiOffset: number = 0;

    midiOffset = Math.round(this.parameter.getCurrentValue(time));

    // get the octave and the offset within the octave
    const octaveOffset: number = midiOffset % 12;
    const normalizedOctaveOffset: number = (midiOffset + 12) % 12;
    const octave: number = Math.trunc(midiOffset / 12);
    // find the 'on' note closest to the octave offset
    const isNoteOn: boolean = this.#noteSequence[(octaveOffset + 12) % 12] == 1;

    // get the base note from the appropriate property
    let base: number = 0;
    if (this.parameter.values) {
      if (this.parameter.values.hasOwnProperty("center"))
        base = this.parameter.values["center"];
      else if (this.parameter.values.hasOwnProperty("initialValue"))
        base = this.parameter.values["initialValue"];
      else base = this.parameter.values["startValue"];
    }

    // note is 'on' return it
    if (isNoteOn) {
      value = base + octave * 12 + octaveOffset;
      console.log(
        "note is on, time, midioffset, midi",
        time,
        midiOffset,
        value
      );
    } else {
      // find the two 'on' notes surrounding this 'off' note
      // this assumes that the first note in the sequence is on
      let first: number = normalizedOctaveOffset;
      let last: number = normalizedOctaveOffset;
      while (first > 0 && this.#noteSequence[first] == 0) first--;
      while (last < 12 && this.#noteSequence[last] == 0) last++;
      const firstOffset: number = normalizedOctaveOffset - first;
      const lastOffset: number = last - normalizedOctaveOffset;
      // set the midi to the closest 'on' note, favoring the lower one
      if (firstOffset <= lastOffset) value = base + octave * 12 + first;
      else value = base + octave * 12 + last;
      console.log(
        "note is off time, first, last, midioffset,  midi",
        time,
        first,
        last,
        midiOffset,
        value
      );
    }

    // bump to the next rhythm entry
    this.#currentRhythmEntry =
      (this.#currentRhythmEntry + 1) % this.values.measureLength;
    return value;
  }

  override async appendXML(doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      const returnElem: Element = elem;
      returnElem.setAttribute("parameterType", PARAMETERMODULATOR.Euclidean);
      returnElem.setAttribute(
        "measureLength",
        this.values.measureLength.toString()
      );
      returnElem.setAttribute("beatCount", this.values.beatCount.toString());
      returnElem.setAttribute("noteCount", this.values.noteCount.toString());
      returnElem.setAttribute("parameterName", this.values.parameterName);
      await this.parameter.appendXML(doc, returnElem);
      return Promise.resolve(returnElem);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }

  override async getXML(
    elem: Element,
    version: string
  ): Promise<EuclideanValues> {
    try {
      const g: EuclideanValues = new EuclideanValues();
      g.values.measureLength = getAttributeValue(
        elem,
        "measureLength",
        "float"
      ) as number;
      g.values.beatCount = getAttributeValue(
        elem,
        "beatCount",
        "float"
      ) as number;
      g.values.noteCount = getAttributeValue(
        elem,
        "noteCount",
        "float"
      ) as number;
      g.values.parameterName = getAttributeValue(
        elem,
        "parameterName",
        "string"
      ) as PARAMETERMODULATOR;
      g.parameter = await g.parameter.getXML(elem, version);
      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
