import { getAttributeValue, getElementElement } from "utils/xmlfunctions";

export default class Reverb {
  name: string;
  duration: number;
  decay: number;
  effect: ConvolverNode | undefined;
  context: AudioContext | OfflineAudioContext | undefined;
  // left wall, right wall, ceiling
  leftWall: { delay: number; gain: number };
  rightWall: { delay: number; gain: number };
  ceiling: { delay: number; gain: number };

  constructor(name: string) {
    this.name = name;
    this.duration = 1.0;
    this.decay = 2.0;
    this.effect = undefined;
    this.context = undefined;
    this.leftWall = { delay: 0, gain: 0 };
    this.rightWall = { delay: 0, gain: 0 };
    this.ceiling = { delay: 0, gain: 0 };
  }

  setContext(context: AudioContext | OfflineAudioContext) {
    this.context = context;

    // set up the diffuse reverberation
    const impulse: AudioBuffer | undefined = this.impulseResponse(
      this.duration,
      this.decay
    );
    if (impulse) {
      this.effect = this.context.createConvolver();
      this.effect.buffer = impulse;
      // console.log(`convolution effect ${this.effect.buffer?.length}`);
    }
    // else console.log(`no reverb effect`);
  }

  // generate far field impulse reverb response
  impulseResponse(duration: number, decay: number): AudioBuffer | undefined {
    if (this.context && duration > 0 && decay > 0) {
      const length = this.context.sampleRate * duration;
      const impulse = this.context.createBuffer(
        1,
        length,
        this.context.sampleRate
      );
      const IR = impulse?.getChannelData(0);
      for (let i = 0; i < length; i++) {
        IR[i] = (1 * Math.random() - 1) * Math.pow(1 - 1 / length, decay);
      }
      return impulse;
    } else {
      return undefined;
    }
  }

  connect(source: AudioNode, destination: AudioNode) {
    // connect the diffuse reverb effect if it exists
    // connect the source to the destination
    if (this.effect && this.context && this.duration > 0 && this.decay > 0) {
      const gain: GainNode = this.context.createGain();
      gain.gain.value = 1.0;
      source.connect(gain);
      gain.connect(this.effect);
      this.effect.connect(destination);
    }

    // connect the early delays if they exist
    // set up the early reflections
    if (this.context && this.leftWall.gain > 0 && this.leftWall.delay > 0) {
      const delayNode: DelayNode = this.context.createDelay(1);
      delayNode.delayTime.value = this.leftWall.delay / 1000;
      const gainNode: GainNode = this.context.createGain();
      gainNode.gain.value = this.leftWall.gain;
      source.connect(delayNode);
      delayNode.connect(gainNode);
      gainNode.connect(destination);
    }
    if (this.context && this.rightWall.gain > 0 && this.rightWall.delay > 0) {
      const delayNode: DelayNode = this.context.createDelay(1);
      delayNode.delayTime.value = this.rightWall.delay / 1000;
      const gainNode: GainNode = this.context.createGain();
      gainNode.gain.value = this.rightWall.gain;
      source.connect(delayNode);
      delayNode.connect(gainNode);
      gainNode.connect(destination);
    }
    if (this.context && this.ceiling.gain > 0 && this.ceiling.delay > 0) {
      const delayNode: DelayNode = this.context.createDelay(1);
      delayNode.delayTime.value = this.ceiling.delay / 1000;
      const gainNode: GainNode = this.context.createGain();
      gainNode.gain.value = this.ceiling.gain;
      source.connect(delayNode);
      delayNode.connect(gainNode);
      gainNode.connect(destination);
    }

    // connect the source to the destination at any rate
    source.connect(destination);
  }

  // this version has two walls and ceiling handling early reflection
  setAttribute(name: string, value: string): void {
    switch (name) {
      case "reverb.name":
        this.name = value;
        break;
      case "reverb.duration":
        this.duration = parseFloat(value);
        break;
      case "reverb.decay":
        this.decay = parseFloat(value);
        break;
      case "reverb.leftwall.delay":
        this.leftWall.delay = parseFloat(value);
        break;
      case "reverb.leftwall.gain":
        this.leftWall.gain = parseFloat(value);
        break;
      case "reverb.rightwall.delay":
        this.rightWall.delay = parseFloat(value);
        break;
      case "reverb.rightwall.gain":
        this.rightWall.gain = parseFloat(value);
        break;
      case "reverb.ceiling.delay":
        this.ceiling.delay = parseFloat(value);
        break;
      case "reverb.ceiling.gain":
        this.ceiling.gain = parseFloat(value);
        break;
      default:
        break;
    }
  }

  copy(): Reverb {
    const n = new Reverb(this.name);
    n.context = this.context;
    n.effect = this.effect;
    n.duration = this.duration;
    n.decay = this.decay;
    n.leftWall = { ...this.leftWall };
    n.rightWall = { ...this.rightWall };
    n.ceiling = { ...this.ceiling };
    return n;
  }

  getXML(fcElem: Element, _version: string): void {
    try {
      const cElem: Element = getElementElement(fcElem, "reverb");
      this.name = getAttributeValue(cElem, "name", "float") as string;
      this.duration = getAttributeValue(cElem, "duration", "float") as number;
      this.decay = getAttributeValue(cElem, "decay", "float") as number;
      this.leftWall.delay = getAttributeValue(
        cElem,
        "leftwalldelay",
        "float"
      ) as number;
      this.leftWall.gain = getAttributeValue(
        cElem,
        "leftwallgain",
        "float"
      ) as number;
      this.rightWall.delay = getAttributeValue(
        cElem,
        "rightwalldelay",
        "float"
      ) as number;
      this.rightWall.gain = getAttributeValue(
        cElem,
        "rightwallgain",
        "float"
      ) as number;
      this.ceiling.delay = getAttributeValue(
        cElem,
        "ceilingdelay",
        "float"
      ) as number;
      this.ceiling.gain = getAttributeValue(
        cElem,
        "ceilinggain",
        "float"
      ) as number;
    } catch {
      this.duration = 0.0;
      this.decay = 0.0;
      this.leftWall.delay = 0;
      this.leftWall.gain = 0;
      this.rightWall.delay = 0;
      this.rightWall.gain = 0;
      this.ceiling.delay = 0;
      this.ceiling.gain = 0;
    }
  }
  appendXML(doc: XMLDocument, elem: Element): void {
    const cElement: Element = doc.createElement("reverb");
    cElement.setAttribute("name", this.name);
    cElement.setAttribute("duration", this.duration.toString());
    cElement.setAttribute("decay", this.decay.toString());
    cElement.setAttribute("leftwalldelay", this.leftWall.delay.toString());
    cElement.setAttribute("leftwallgain", this.leftWall.gain.toString());
    cElement.setAttribute("rightwalldelay", this.rightWall.delay.toString());
    cElement.setAttribute("rightwallgain", this.rightWall.gain.toString());
    cElement.setAttribute("ceilingdelay", this.ceiling.delay.toString());
    cElement.setAttribute("ceilinggain", this.ceiling.gain.toString());
    elem.appendChild(cElement);
  }
}
