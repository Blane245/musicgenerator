import { rand } from "../utils/seededrandom";
import { MidiEvent } from "../types/types";
import { getAttributeValue, getElementElement } from "../utils/xmlfunctions";

export class Effect {
  name: string;
  context: AudioContext | OfflineAudioContext;
  input: GainNode;
  effect: GainNode | ConvolverNode;
  output: GainNode;
  constructor(name: string, context: AudioContext | OfflineAudioContext) {
    this.name = name;
    this.context = context;
    this.input = this.context.createGain();
    this.output = this.context.createGain();
    this.effect = this.context.createGain();
    this.setup();
    this.wireUp();
  }

  setup() {}

  wireUp() {
    this.input.connect(this.effect);
    this.effect.connect(this.output);
  }

  connect(destination: AudioNode): void {
    this.output.connect(destination);
  }

  copy(): Effect {
    const n = new Effect(this.name, this.context);
    n.input = this.input;
    n.output = this.output;
    n.effect = this.effect;
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
  override effect: BiquadFilterNode;
  type: string;
  cutoff: number;
  resonance: number;

  constructor(
    name: string,
    context: AudioContext | OfflineAudioContext,
    type: string = "lowpass",
    cutoff: number = 1000,
    resonance = 0.9
  ) {
    super(name, context);
    this.name = "filter";
    this.effect = context.createBiquadFilter();
    this.type = type;
    this.cutoff = cutoff;
    this.resonance = resonance;
  }

  override setup() {
    this.effect.type = this.type as BiquadFilterType;
    this.effect.frequency.value = this.cutoff;
    this.effect.Q.value = this.resonance;
    this.input.connect(this.effect);
    this.effect.connect(this.output);
  }

  override copy(): Filter {
    const nf: Filter = new Filter(
      this.name,
      this.context as AudioContext | OfflineAudioContext
    );
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
  name: string;
  context: AudioContext | OfflineAudioContext | undefined;
  effect: GainNode | undefined;
  attack: number;
  decay: number;
  gain: number;
  release: number;
  velocity: number;

  constructor(name: string) {
    this.name = name;
    this.attack = 0.001; // (sec) range 0.001 - inf
    this.decay = 0.001; // (sec) range 0.001 - inf
    this.release = 0.001; // (sec) range 0.001 - inf
    this.gain = 1; // default 1, range 0 - inf
    this.velocity = 0; // default 0, range 0 - inf
  }

  setContext(context: AudioContext | OfflineAudioContext) {
    this.context = context;
    this.effect = this.context.createGain();
    this.effect.gain.value = this.gain;
  }

  on(event: MidiEvent): void {
    this.velocity = event.velocity ? event.velocity / 127 : 0;
    if (this.context)
      this.start(event.time ? event.time : this.context.currentTime);
  }

  off(time: number): void {
    if (this.context) this.stop(time);
  }

  start(time: number) {
    if (this.effect) {
      this.effect.gain.value = 0;
      this.effect.gain.setValueAtTime(0, time);
      this.effect.gain.setTargetAtTime(1, time, this.attack + 0.00001);
      this.effect.gain.setTargetAtTime(
        this.gain * this.velocity,
        time + this.attack,
        this.decay
      );
    }
  }

  stop(time: number) {
    if (this.effect) {
      this.effect.gain.cancelScheduledValues(time);
      this.effect.gain.setValueAtTime(this.gain, time);
      this.effect.gain.setTargetAtTime(0, time, this.release + 0.00001);
    }
  }

  copy(): AmpEnvelope {
    const n: AmpEnvelope = new AmpEnvelope(this.name);
    n.context = this.context;
    n.attack = this.attack;
    n.decay = this.decay;
    n.effect = this.effect;
    n.gain = this.gain;
    n.release = this.release;
    n.velocity = this.velocity;
    return n;
  }

  setAttribute(name: string, value: string): void {
    switch (name) {
      case "ampenvelope.name":
        this.name = value;
        break;
      case "ampenvelope.attack":
        this.attack = parseFloat(value);
        break;
      case "ampenvelope.decay":
        this.decay = parseFloat(value);
        break;
      case "ampenvelope.gain":
        this.gain = parseFloat(value);
        break;
      case "ampenvelope.release":
        this.release = parseFloat(value);
        break;
      case "ampenvelope.velocity":
        this.velocity = parseFloat(value);
        break;
      default:
        break;
    }
  }

  appendXML(doc: XMLDocument, elem: Element): void {
    const aElement: Element = doc.createElement("ampenvelop");
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
      const aElement: Element = getElementElement(elem, "ampenvelop");
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
    } catch {}
  }
}

export class Voice {
  name: string;
  context: AudioContext | OfflineAudioContext | undefined;
  type: OscillatorType;
  ampEnvelope: AmpEnvelope | undefined;
  effect: GainNode | undefined;
  gain: number;
  value: number;
  partials: (OscillatorNode | AudioBufferSourceNode)[];

  constructor(name: string = "") {
    this.name = name;
    this.type = "sawtooth";
    this.ampEnvelope = undefined;
    this.effect = undefined;
    this.gain = 0.1;
    this.value = -1;
    this.partials = [];
  }

  setContext(context: AudioContext | OfflineAudioContext) {
    this.context = context;
    this.effect = this.context.createGain();
    this.effect.gain.value = this.gain;
    this.ampEnvelope = new AmpEnvelope(this.name.concat(":ampenvelope"));
    this.ampEnvelope.setContext(this.context);
    if (this.ampEnvelope.effect) this.ampEnvelope.effect.connect(this.effect);
  }

  connect(destination: AudioNode): void {
    if (this.ampEnvelope && this.ampEnvelope.effect)
      this.ampEnvelope.effect.connect(destination);
  }

  init(time: number) {
    if (this.context) {
      const osc = this.context.createOscillator();
      osc.type = this.type;
      if (this.ampEnvelope && this.ampEnvelope.effect)
        osc.connect(this.ampEnvelope.effect);
      osc.start(time);
      this.partials.push(osc);
    }
  }

  on(event: MidiEvent) {
    this.partials.forEach((osc: OscillatorNode | AudioBufferSourceNode) => {
      if (event.frequency)
        (osc as OscillatorNode).frequency.value = event.frequency;
    });
    if (this.ampEnvelope) this.ampEnvelope.on(event);
  }

  off(time: number) {
    if (this.ampEnvelope && this.context) {
      this.ampEnvelope.off(time);
      this.partials.forEach((osc: OscillatorNode | AudioBufferSourceNode) => {
        if (this.ampEnvelope && this.context)
          osc.stop(time + this.ampEnvelope.release * 4);
      });
    }
  }

  start(time: number): void {
    this.partials.forEach((osc: OscillatorNode | AudioBufferSourceNode) => {
      (osc as OscillatorNode).start(time);
    });
  }

  copy(): Voice {
    const n = new Voice(this.name);
    n.context = this.context;
    n.type = this.type;
    n.ampEnvelope = this.ampEnvelope ? this.ampEnvelope.copy() : undefined;
    n.gain = this.gain;
    n.value = this.value;
    n.partials = [...this.partials];
    n.effect = this.effect;

    return n;
  }

  setAttribute(name: string, value: string): void {
    switch (name) {
      case "voice.name":
        this.name = value;
        break;
      case "voice.type":
        this.type = value as OscillatorType;
        break;
      case "voice.gain":
        this.gain = parseFloat(value);
        break;
      case "voice.value":
        this.value = parseFloat(value);
        break;
      default:
        break;
    }
  }

  appendXML(doc: XMLDocument, elem: Element): void {
    const vElement: Element = doc.createElement("voice");
    vElement.setAttribute("name", this.name);
    vElement.setAttribute("gain", this.gain.toString());
    vElement.setAttribute("value", this.value.toString());
    elem.appendChild(vElement);
  }

  getXML(elem: Element): void {
    try {
      const vE: Element = getElementElement(elem, "voice");
      this.name = getAttributeValue(vE, "name", "string") as string;
      this.gain = getAttributeValue(vE, "gain", "float") as number;
      this.value = getAttributeValue(vE, "value", "float") as number;
    } catch {}
  }
}

export class ReverbNoise extends Voice {
  length: number; // seconds

  constructor(name: string) {
    super(name.concat(":noise"));
    this.length = 2;
  }

  override setContext(context: AudioContext | OfflineAudioContext) {
    super.setContext(context);
  }

  override init(time: number) {
    if (this.context) {
    const lBuffer = new Float32Array(this.length * this.context.sampleRate);
    const rBuffer = new Float32Array(this.length * this.context.sampleRate);

    for (let i = 0; i < this.length * this.context.sampleRate; i++) {
      lBuffer[i] = 1 - 2 * rand();
      rBuffer[i] = 1 - 2 * rand();
    }
    const buffer = this.context.createBuffer(
      2,
      this.length * this.context.sampleRate,
      this.context.sampleRate
    );
    buffer.copyToChannel(lBuffer, 0);
    buffer.copyToChannel(rBuffer, 1);

    const osc: AudioBufferSourceNode = this.context.createBufferSource();
    osc.buffer = buffer;
    osc.loop = true;
    osc.loopStart = 0;
    osc.loopEnd = 2;
    osc.start(time);
    if (this.ampEnvelope && this.ampEnvelope.effect) osc.connect(this.ampEnvelope.effect);
    this.partials.push(osc);
  }
  }

  override on(event: MidiEvent) {
    if (this.ampEnvelope) this.ampEnvelope.on(event);
  }

  // off is inherited from Voice

  override setAttribute(name: string, value: string): void {
    super.setAttribute(name, value);
    switch (name) {
      case "noise.name":
        this.name = value;
        break;
      case "noise.length":
        this.length = parseFloat(value);
        break;
      default:
        break;
    }
  }

  override appendXML(doc: XMLDocument, elem: Element): void {
    const eE: Element = doc.createElement("noise");
    eE.setAttribute("name", this.name);
    eE.setAttribute("length", this.length.toString());
    elem.appendChild(eE);
  }

  override getXML(elem: Element): void {
    try {
      const eE: Element = getElementElement(elem, "noise");
      this.name = getAttributeValue(eE, "name", "string") as string;
      this.length = getAttributeValue(eE, "length", "float") as number;
    } catch {}
  }
}
