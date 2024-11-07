import { rand } from "../utils/seededrandom";
import { MidiEvent } from "../types/types";
import { getAttributeValue, getElementElement } from "../utils/xmlfunctions";

/**
 * Effect class is the parent of other classes to support the reverb effect
 * and is not normally instantiated on its own
 * Convention for child classes is to
 * 1. create an class object
 * 2. while not playing, modify the parameters of the object using the various setters
 * 3. at start of playing provide the audio context, which will create the audio nodes
 * 4. wire up the object
 * 5. connect the object to its input and output
 * Utilities exist for
 * 1. setting the values of the object either with or withut the context provided
 * 2. making a copy of the object
 * 3. extracting the object's properties to XML
 * 4. loading the object's prperties from XML
 *
 * @export
 * @class Effect
 * @typedef {Effect}
 */
export class Effect {
  name: string;
  context: AudioContext | OfflineAudioContext | undefined;
  input: GainNode | undefined;
  output: GainNode | undefined;
  constructor(name: string) {
    this.name = name;
    this.context = undefined;
    this.input = undefined;
    this.output = undefined;
  }

  setContext(context: AudioContext | OfflineAudioContext): void {
    this.context = context;
    this.input = this.context.createGain();
    this.output = this.context.createGain();
  }

  connect(externalInput: AudioNode, destination: AudioNode): void {
    if (this.output && this.input) {
      externalInput.connect(this.input);
      this.input.connect(this.output);
      this.output.connect(destination);
    } else
      console.log("Effect: Attempt to connect an effect that has no context");
  }

  copy(): Effect {
    const n = new Effect(this.name);
    n.context = this.context;
    n.input = this.input;
    n.output = this.output;
    return n;
  }

  setAttribute(name: string, value: string): void {
    switch (name) {
      case "name":
        this.name = value;
        break;
      default:
        break;
    }
  }

  appendXML(doc: XMLDocument, elem: Element): void {
    const eElement: Element = doc.createElement("effect");
    eElement.setAttribute("name", this.name);
    elem.appendChild(eElement);
  }

  getXML(elem: Element): void {
    try {
      const eElement: Element = getElementElement(elem, "effect");
      this.name = getAttributeValue(eElement, "name", "string") as string;
    } catch {}
  }
}

export class Filter extends Effect {
  effect: BiquadFilterNode | undefined;
  type: string;
  cutoff: number;
  resonance: number;

  constructor(
    name: string,
    type: string = "lowpass",
    cutoff: number = 1000,
    resonance = 0.9
  ) {
    super(name);
    this.effect = undefined;
    this.type = type;
    this.cutoff = cutoff;
    this.resonance = resonance;
  }

  override setContext(context: AudioContext | OfflineAudioContext) {
    super.setContext(context);
    this.effect = context.createBiquadFilter();
    this.effect.type = this.type as BiquadFilterType;
    this.effect.frequency.value = this.cutoff;
    this.effect.Q.value = this.resonance;
  }

  override connect(externalInput: AudioNode, destination: AudioNode): void {
    if (this.output && this.input && this.effect) {
      externalInput.connect(this.input);
      this.input.connect(this.effect);
      this.effect.connect(this.output);
      this.output.connect(destination);
    } else throw new Error("Attempt to connect an effect that has no context");
  }

  override copy(): Filter {
    const nf: Filter = new Filter(this.name);
    nf.context = this.context;
    nf.input = this.input;
    nf.output = this.output;
    nf.effect = this.effect;
    nf.type = this.type;
    nf.cutoff = this.cutoff;
    nf.resonance = this.resonance;
    return nf;
  }

  override setAttribute(name: string, value: string): void {
    switch (name) {
      case "name":
        this.name = value;
        break;
      case "type":
        this.type = value;
        if (this.effect) this.effect.type = this.type as BiquadFilterType;
        break;
      case "cutoff":
        this.cutoff = parseFloat(value);
        if (this.effect) this.effect.frequency.value = this.cutoff;
        break;
      case "resonance":
        this.resonance = parseFloat(value);
        if (this.effect) this.effect.Q.value = this.resonance;
        break;
      default:
        break;
    }
  }

  override appendXML(doc: XMLDocument, elem: Element): void {
    const fElement: Element = doc.createElement("filter");
    fElement.setAttribute("name", this.name);
    fElement.setAttribute("type", this.type);
    fElement.setAttribute("cutoff", this.cutoff.toString());
    fElement.setAttribute("resonance", this.resonance.toString());
    elem.appendChild(fElement);
  }

  override getXML(elem: Element): void {
    try {
      const fElement: Element = getElementElement(elem, "filter");
      this.name = getAttributeValue(fElement, "name", "string") as string;
      this.type = getAttributeValue(fElement, "type", "string") as string;
      this.cutoff = getAttributeValue(fElement, "cutoff", "float") as number;
      this.resonance = getAttributeValue(
        fElement,
        "resonance",
        "float"
      ) as number;
    } catch {}
  }
}
export class AmpEnvelope {
  context: AudioContext | OfflineAudioContext | undefined;
  name: string;
  output: GainNode | undefined;
  attack: number;
  decay: number;
  gain: number;
  release: number;
  velocity: number;

  constructor(name = "", gain = 1) {
    this.name = name;
    this.context = undefined;
    this.attack = 0; // (sec) range 0.001 - inf
    this.decay = 0.001; // (sec) range 0.001 - inf
    this.release = 0.001; // (sec) range 0.001 - inf
    this.gain = gain; // default 1, range 0 - inf
    this.velocity = 0; // default 0, range 0 - inf
  }

  setContext(context: AudioContext | OfflineAudioContext) {
    this.context = context;
    this.output = this.context.createGain();
    this.output.gain.value = this.gain;
  }

  connect(externalInput: AudioNode, destination: AudioNode): void {
    if (this.output) {
      externalInput.connect(this.output);
      this.output.connect(destination);
    } else
      console.log(
        "Attempt to connect an envelop before the its context has been set"
      );
  }
  start(time: number) {
    if (this.output) {
      this.output.gain.value = 0;
      this.output.gain.setValueAtTime(0, time);
      this.output.gain.setTargetAtTime(1, time, this.attack);
      this.output.gain.setTargetAtTime(
        this.gain * this.velocity,
        time + this.attack,
        this.decay
      );
    } else
      console.log(
        "Attempt to start an envelop before the its context has been set"
      );
  }

  stop(time: number) {
    if (this.output) {
      this.output.gain.cancelScheduledValues(time);
      this.output.gain.setValueAtTime(this.output.gain.value, time);
      this.output.gain.setTargetAtTime(0, time, this.release);
    } else
      console.log(
        "Attempt to stop an envelop before the its context has been set"
      );
  }

  on(event: MidiEvent): void {
    this.velocity = event.velocity / 127;
    if (this.context) this.start(event.time);
    else
      console.log(
        "Attempt to start an envelop before the its context has been set"
      );
  }

  off(): void {
    if (this.context) this.stop(this.context.currentTime);
    else
      console.log(
        "Attempt to turn off an envelope before the its context has been set"
      );
  }

  copy(): AmpEnvelope {
    const na: AmpEnvelope = new AmpEnvelope(this.name);
    na.attack = this.attack;
    na.context = this.context;
    na.decay = this.decay;
    na.output = this.output;
    na.release = this.release;
    na.gain = this.gain;
    na.velocity = this.velocity;
    return na;
  }

  setAttribute(name: string, value: string): void {
    switch (name) {
      case "name":
        this.name = value;
        break;
      case "attack":
        this.attack = parseFloat(value);
        break;
      case "decay":
        this.decay = parseFloat(value);
        break;
      case "gain":
        this.gain = parseFloat(value);
        if (this.output) this.output.gain.value = this.gain;
        break;
      case "release":
        this.release = parseFloat(value);
        break;
      case "velocity":
        this.velocity = parseFloat(value);
        break;
      default:
        break;
    }
  }

  appendXML(doc: XMLDocument, elem: Element): void {
    const aElement: Element = doc.createElement("ampEnvelop");
    aElement.setAttribute("name", this.name);
    aElement.setAttribute("attack", this.attack.toString());
    aElement.setAttribute("decay", this.decay.toString());
    aElement.setAttribute("gain", this.gain.toString());
    aElement.setAttribute("release", this.release.toString());
    aElement.setAttribute("velocity", this.velocity.toString());
    elem.appendChild(aElement);
  }

  getXML(elem: Element): void {
    try {
      const aElement: Element = getElementElement(elem, "ampEnvelop");
      this.name = getAttributeValue(aElement, "name", "string") as string;
      this.attack = getAttributeValue(aElement, "attack", "float") as number;
      this.decay = getAttributeValue(aElement, "decay", "float") as number;
      this.gain = getAttributeValue(aElement, "gain", "float") as number;
      this.release = getAttributeValue(aElement, "release", "float") as number;
      this.velocity = getAttributeValue(
        aElement,
        "velocity",
        "float"
      ) as number;
    } catch {
      console.log(`error occurred while reading ampEnvelop element from XML`);
    }
  }
}

export class Voice {
  name: string;
  context: AudioContext | OfflineAudioContext | undefined;
  osc: OscillatorNode | undefined;
  detune: number;
  frequency: number;
  type: OscillatorType;
  ampEnvelope: AmpEnvelope | undefined;
  attack: number;
  decay: number;
  release: number;
  sustain: number;
  velocity: number;
  output: GainNode | undefined;
  gain: number;

  constructor(
    name: string = "",
    type: OscillatorType = "sawtooth" as OscillatorType,
    gain: number = 0.1
  ) {
    this.context = undefined;
    this.name = name;

    this.osc = undefined;
    this.detune = 0; // default 0 (cents), range 0 - 10000
    this.frequency = 440; // default 440 (hz), range 10 - 20000
    this.type = type; //default 'sine', see OscillatorType for values

    this.ampEnvelope = undefined;
    this.attack = 0; // (sec) range 0.001 - inf
    this.decay = 0.001; // (sec) range 0.001 - inf
    this.release = 0.001; // (sec) range 0.001 - inf
    this.sustain = 1; // default 1, range 0 - inf
    this.velocity = 0; // default 0, range 0 - inf

    this.output = undefined; // shares gain with AmpEnvelope
    this.gain = gain; // default 1, range 0 - inf
  }

  setContext(context: AudioContext | OfflineAudioContext) {
    this.context = context;

    this.osc = this.context.createOscillator();
    this.osc.type = this.type;
    this.osc.detune.value = this.detune;
    this.osc.frequency.value = this.frequency;

    this.ampEnvelope = new AmpEnvelope(this.name.concat(":Amp"), this.sustain);
    this.ampEnvelope.attack = this.attack;
    this.ampEnvelope.decay = this.decay;
    this.ampEnvelope.release = this.release;
    this.ampEnvelope.setContext(context);

    this.output = this.context.createGain();
    this.output.gain.value = this.gain;
  }

  connect(externalInput: AudioNode, destination: AudioNode): void {
    if (this.output && this.osc && this.ampEnvelope && this.context) {
      externalInput.connect(this.osc);
      this.ampEnvelope.connect(this.osc, this.output);
      this.output.connect(destination);
    } else console.log("Attempt to connect a voice that has no context");
  }
  start(): void {
    if (this.context && this.osc) this.osc.start(this.context.currentTime);
    else
      console.log(
        "Attempt to start a voice before the its context or oscillator have been set"
      );
  }

  init() {
    if (this.osc && this.context) this.osc.start(this.context.currentTime);
    else
      console.log(
        "Attempt to initialize a voice before the its context or oscillator have been set"
      );
  }

  on(event: MidiEvent) {
    if (this.osc && this.ampEnvelope) {
      this.osc.frequency.value = event.frequency;
      if (this.context) this.ampEnvelope.on(event);
      else
        console.log(
          "Attempt to start amp envelope before its context has been set"
        );
    }
  }

  off() {
    if (this.osc && this.context && this.ampEnvelope)
      this.osc.stop(this.context.currentTime + this.ampEnvelope.release * 4);
    else
      console.log(
        "Attempt to stop amp envelope before its context has been set"
      );
  }

  copy(): Voice {
    const nv = new Voice(this.name);
    nv.context = this.context;

    nv.osc = this.osc;
    nv.detune = this.detune;
    nv.frequency = this.frequency;
    nv.type = this.type;

    if (this.ampEnvelope) nv.ampEnvelope = this.ampEnvelope.copy();
    else nv.ampEnvelope = undefined;
    nv.attack = this.attack;
    nv.decay = this.decay;
    nv.release = this.release;
    nv.sustain = this.sustain;
    nv.velocity = this.velocity;

    nv.output = this.output;
    nv.gain = this.gain;

    return nv;
  }

  setAttribute(name: string, value: string): void {
    switch (name) {
      case "name":
        this.name = value;
        break;

      // osc
      case "detune":
        this.detune = parseFloat(value);
        if (this.osc) this.osc.detune.value = this.detune;
        break;
      case "frequency":
        this.frequency = parseFloat(value);
        if (this.osc) this.osc.frequency.value = this.frequency;
        break;
      case "type":
        this.type = value as OscillatorType;
        if (this.osc) this.osc.type = this.type;
        break;

      // ampenvelope
      case "attack":
        this.attack = parseFloat(value);
        if (this.ampEnvelope) this.ampEnvelope.attack = this.attack;
        break;
      case "decay":
        this.decay = parseFloat(value);
        if (this.ampEnvelope) this.ampEnvelope.decay = this.decay;
        break;
      case "release":
        this.release = parseFloat(value);
        if (this.ampEnvelope) this.ampEnvelope.release = this.release;
        break;
      case "sustain":
        this.sustain = parseFloat(value);
        if (this.ampEnvelope) this.ampEnvelope.gain = this.sustain;
        break;
      case "velocity":
        this.velocity = parseFloat(value);
        if (this.ampEnvelope) this.ampEnvelope.velocity = this.velocity;
        break;

      // output
      case "gain":
        this.gain = parseFloat(value);
        if (this.output) this.output.gain.value = this.gain;
        break;

      default:
        break;
    }
  }

  appendXML(doc: XMLDocument, elem: Element): void {
    const vElement: Element = doc.createElement("voice");
    vElement.setAttribute("name", this.name);
    vElement.setAttribute("gain", this.gain.toString());

    const oElement: Element = doc.createElement("osc");
    oElement.setAttribute("detune", this.detune.toString());
    oElement.setAttribute("frequency", this.frequency.toString());
    oElement.setAttribute("type", this.type);
    vElement.appendChild(oElement);

    const aElement: Element = doc.createElement("amp");
    aElement.setAttribute("attack", this.attack.toString());
    aElement.setAttribute("decay", this.decay.toString());
    aElement.setAttribute("release", this.release.toString());
    aElement.setAttribute("sustain", this.sustain.toString());
    aElement.setAttribute("velocity", this.velocity.toString());
    vElement.appendChild(aElement);

    elem.appendChild(vElement);
  }

  getXML(elem: Element): void {
    try {
      const vE: Element = getElementElement(elem, "voice");
      this.name = getAttributeValue(vE, "name", "string") as string;
      this.gain = getAttributeValue(vE, "gain", "float") as number;

      const oE = getElementElement(vE, "osc");
      this.detune = getAttributeValue(oE, "detune", "float") as number;
      this.frequency = getAttributeValue(oE, "frequency", "float") as number;
      this.type = getAttributeValue(oE, "type", "string") as OscillatorType;

      const aE = getElementElement(vE, "amp");
      this.attack = getAttributeValue(aE, "attack", "float") as number;
      this.decay = getAttributeValue(aE, "decay", "float") as number;
      this.release = getAttributeValue(aE, "release", "float") as number;
      this.attack = getAttributeValue(aE, "sustain", "float") as number;
      this.attack = getAttributeValue(aE, "velocity", "float") as number;
    } catch {
      console.log(`Voice: error occurred while reading voice element from XML`);
    }
  }
}
export class Noise extends Voice {
  length: number;
  noiseOsc: AudioBufferSourceNode | undefined;
  buffer: AudioBuffer | undefined;

  constructor(name: string, gain: number = 0.1) {
    super(name.concat(":Noise"), undefined, gain);
    this.length = 2;
    this.noiseOsc = undefined;
    this.buffer = undefined;
  }

  override setContext(context: AudioContext | OfflineAudioContext) {
    super.setContext(context);
    this.context = context;
    const lBuffer = new Float32Array(this.length * this.context.sampleRate);
    const rBuffer = new Float32Array(this.length * this.context.sampleRate);

    for (let i = 0; i < this.length * this.context.sampleRate; i++) {
      lBuffer[i] = 1 - 2 * rand();
      rBuffer[i] = 1 - 2 * rand();
    }
    this.buffer = this.context.createBuffer(
      2,
      this.length * this.context.sampleRate,
      this.context.sampleRate
    );
    this.buffer.copyToChannel(lBuffer, 0);
    this.buffer.copyToChannel(rBuffer, 1);

    this.noiseOsc = this.context.createBufferSource();
    this.noiseOsc.buffer = this.buffer;
    this.noiseOsc.loop = true;
    this.noiseOsc.loopStart = 0;
    this.noiseOsc.loopEnd = 2;
    this.noiseOsc.start(this.context.currentTime);
  }

  override on(event: MidiEvent) {
    if (this.ampEnvelope) this.ampEnvelope.on(event);
    else
      console.log(
        "Noise: attempt to turn on amp envelope before context is set"
      );
  }

  // connect inherited from Voice

  // off is inherited from Voice
  

  override setAttribute(name: string, value: string): void {
    super.setAttribute(name, value);
    switch (name) {
      case "name":
        this.name = value;
        break;
      default:
        break;
    }
  }

  override appendXML(doc: XMLDocument, elem: Element): void {
    const eE: Element = doc.createElement("noise");
    eE.setAttribute("name", this.name);
    elem.appendChild(eE);
  }

  override getXML(elem: Element): void {
    try {
      const eE: Element = getElementElement(elem, "noise");
      this.name = getAttributeValue(eE, "name", "string") as string;
    } catch {}
  }
}
