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
    console.log('effect: constructed, setup and wired')
  }

  setup() {
    this.effect = this.context.createGain();
  }

  wireUp() {
    this.input.connect(this.effect);
    this.effect.connect(this.output);
  }

  connect(destination: AudioNode): void {
    this.output.connect(destination);
    console.log('effect: output connected to ', destination);
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

  appendXML(props:{doc: XMLDocument, elem: Element}): void {
    const {doc, elem} = props;
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
    this.effect.type = this.type as BiquadFilterType;
    this.effect.frequency.value = this.cutoff;
    this.effect.Q.value = this.resonance;
    this.input.connect(this.effect);
    this.effect.connect(this.output);
    console.log('filter: constructed and connected');
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

  override appendXML(props:{doc: XMLDocument, elem: Element}): void {
    const {doc, elem} = props;
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
    console.log('ampenvelope: constructed');
  }

  setContext(context: AudioContext | OfflineAudioContext) {
    this.context = context;
    this.effect = this.context.createGain();
    this.effect.gain.value = this.gain;
    console.log('ampenvelope: context set');
  }

  on(event: MidiEvent): void {
    this.velocity = event.velocity ? event.velocity / 127 : 0;
    if (this.context) {
      const onTime: number = event.time ? event.time : this.context.currentTime;
      console.log("ampenvelope on at", onTime);
      this.start(onTime);
    }
  }

  off(time: number): void {
    if (this.context) this.stop(time);
    console.log('ampenvelope: off at time', time);
  }

  start(time: number) {
    if (this.effect) {
      console.log('ampenvelope: start at time', time);
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

  // TODO this appears to be stopping too early. 
  stop(time: number) {
    if (this.effect) {
      console.log('ampenvelope: stop at time', time);
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

  appendXML(props:{doc: XMLDocument, elem: Element}): void {
    const {doc, elem} = props;
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

export class ReverbNoise {
  name: string;
  context: AudioContext | OfflineAudioContext | undefined;
  type: OscillatorType;
  ampEnvelope: AmpEnvelope | undefined;
  effect: GainNode | undefined;
  gain: number;
  osc: AudioBufferSourceNode | undefined;
  value: number;
  length: number; // seconds

  constructor(name: string) {
    this.name = name;
    this.context = undefined;
    this.type = "sawtooth";
    this.ampEnvelope = undefined;
    this.effect = undefined;
    this.gain = 0.1;
    this.osc = undefined;
    this.value = -1;
    this.length = 2;
    console.log('reverbnoise: constructed');
  }

  setContext(context: AudioContext | OfflineAudioContext) {
    this.context = context;
    this.effect = context.createGain();
    this.effect.gain.value = this.gain;
    this.ampEnvelope = new AmpEnvelope(this.name.concat(":ampenvelope"));
    this.ampEnvelope.setContext(context);
    if (this.ampEnvelope.effect) this.ampEnvelope.effect.connect(this.effect);
    console.log('reverbnoise: context set and ampenvelope connected to this effect');
  }

  connect(destination: AudioNode): void {
    if (this.ampEnvelope && this.ampEnvelope.effect) {
      console.log('reverbnoise: ampenvelop effect connected to', destination);
      this.ampEnvelope.effect.connect(destination);
    }
  }

  init(time: number) {
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

      this.osc = this.context.createBufferSource();
      this.osc.buffer = buffer;
      this.osc.loop = true;
      this.osc.loopStart = 0;
      this.osc.loopEnd = this.length * this.context.sampleRate;
      console.log(
        "reverbnoise: osc buffer created and started with noise at",
        time,
        "length",
        this.osc.buffer.length,
        "loopend",
        this.osc.loopEnd
      );
      this.osc.start(time);
      if (this.ampEnvelope && this.ampEnvelope.effect) {
        console.log('reverbnoise: oscillator connected to ampenvelope effect');
        this.osc.connect(this.ampEnvelope.effect);
        if (this.effect) {
          console.log('reverbnoise: ampenvelope effect connected to noise gain');
          this.ampEnvelope.effect.connect(this.effect);
        }
      }
    }
  }

  on(event: MidiEvent) {
    console.log('reverbnoise: on')
    if (this.ampEnvelope) this.ampEnvelope.on(event);
  }

  off(time: number) {
    if (this.ampEnvelope && this.context) {
      console.log('reverbnoise: stop at', time + this.ampEnvelope.release * 4);
      this.ampEnvelope.off(time);
      if (this.osc) this.osc.stop(time + this.ampEnvelope.release * 4);
    }
  }

  copy(): ReverbNoise {
    const n = new ReverbNoise(this.name);
    n.context = this.context;
    n.type = this.type;
    n.ampEnvelope = this.ampEnvelope ? this.ampEnvelope.copy() : undefined;
    n.effect = this.effect;
    n.gain = this.gain;
    n.osc = this.osc;
    n.value = this.value;
    n.length = this.length;
    return n;
  }

  setAttribute(name: string, value: string): void {
    switch (name) {
      case "noise.name":
        this.name = value;
        break;
      case "noise.type":
        this.type = value as OscillatorType;
        break;
      case "noise.gain":
        this.gain = parseFloat(value);
        break;
      case "noise.length":
        this.length = parseFloat(value);
        break;
      default:
        break;
    }
  }

  appendXML(props:{doc: XMLDocument, elem: Element}): void {
    const {doc, elem} = props;
    const eE: Element = doc.createElement("noise");
    eE.setAttribute("name", this.name);
    eE.setAttribute("type", this.type);
    eE.setAttribute("gain", this.gain.toString());
    eE.setAttribute("length", this.length.toString());
    elem.appendChild(eE);
  }

  getXML(elem: Element): void {
    try {
      const eE: Element = getElementElement(elem, "noise");
      this.name = getAttributeValue(eE, "name", "string") as string;
      this.gain = getAttributeValue(eE, "gain", "float") as number;
      this.type = getAttributeValue(eE, "type", "string") as OscillatorType;
      this.length = getAttributeValue(eE, "length", "float") as number;
    } catch {}
  }
}
