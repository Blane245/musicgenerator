import { dBToGain } from "sfcomponents/util";
import { getAttributeValue } from "../utils/xmlfunctions";

// The collection of all room nodes
// the base class captures the things in common
export class RoomNode {
  enabled: boolean;
  context: AudioContext | OfflineAudioContext | undefined;
  in: GainNode | undefined;
  out: GainNode | undefined;
  constructor() {
    this.enabled = true;
    this.context = undefined;
    this.in = undefined;
    this.out = undefined;
  }
  setContext(context: AudioContext | OfflineAudioContext) {
    this.context = context;
    this.in = context.createGain();
    this.in.gain.value = 1.0;
    this.out = context.createGain();
    this.out.gain.value = 1.0;
    // connections are done by the children classes
  }

  connectIn(
    source: AudioNode | DynamicsCompressorNode,
    _destination: AudioNode | undefined
  ) {
    if (this.in) {
      source.connect(this.in);
    }
  }

  connectOut(destination: AudioNode) {
    if (this.out) {
      this.out.connect(destination);
    }
  }

  copy(): RoomNode {
    const n = new RoomNode();
    n.enabled = this.enabled;
    n.context = this.context;
    n.in = this.in;
    n.out = this.out;
    return n;
  }
  setAttribute(_name: string, _value: string): void {
    return;
  }

  getXML(_elem: Element, _version: string): void {}

  appendXML(_doc: XMLDocument, _elem: Element): void {}
}

// room volume
export default class Volume extends RoomNode {
  volume: number;
  #effect: GainNode | undefined;

  constructor() {
    super();
    this.volume = 0;
  }

  // set the context and build the equalizer
  override setContext(context: AudioContext | OfflineAudioContext) {
    super.setContext(context);

    // create the volume effect and connect it if enabled
    this.#effect = context.createGain();
    this.#effect.gain.value = dBToGain(this.volume);
    if (this.in && this.out) {
      if (this.enabled) this.in.connect(this.#effect).connect(this.out);
      else this.in.connect(this.out);
    }
  }

  override connectIn(source: AudioNode, _destination: AudioNode) {
    if (this.in) {
      source.connect(this.in);
    }
  }

  override connectOut(destination: AudioNode) {
    if (this.out) {
      this.out.connect(destination);
    }
  }

  override copy(): Volume {
    const n = new Volume();
    n.enabled = this.enabled;
    n.context = this.context;
    n.volume = this.volume;
    n.in = this.in;
    n.out = this.out;
    n.#effect = this.#effect;
    return n;
  }

  override setAttribute(name: string, value: string): void {
    super.setAttribute(name, value);
    switch (name) {
      case "volume":
        this.volume = dBToGain(parseFloat(value));
        if (this.#effect) this.#effect.gain.value = this.volume;
        break;
      default:
        break;
    }
  }

  override getXML(elem: Element, version: string): void {
    super.getXML(elem, version);
    try {
      this.volume = getAttributeValue(elem, "volume", "float") as number;
    } catch {
      this.volume = 5;
    }
  }

  override appendXML(doc: XMLDocument, elem: Element): void {
    super.appendXML(doc, elem);
    elem.setAttribute("volume", this.volume.toString());
  }
}

export class Reverb extends RoomNode {
  duration: number;
  decay: number;
  #effect: ConvolverNode | undefined;
  leftWall: { delay: number; gain: number };
  rightWall: { delay: number; gain: number };
  ceiling: { delay: number; gain: number };

  // used to defeat the reverb when disabled
  #duration: number;
  #decay: number;
  #leftWall: { delay: number; gain: number };
  #rightWall: { delay: number; gain: number };
  #ceiling: { delay: number; gain: number };

  constructor() {
    super();
    this.duration = 1.0;
    this.decay = 2.0;
    this.leftWall = { delay: 0, gain: 0 };
    this.rightWall = { delay: 0, gain: 0 };
    this.ceiling = { delay: 0, gain: 0 };
    this.#duration = this.duration;
    this.#decay = this.decay;
    this.#leftWall = this.leftWall;
    this.#rightWall = this.rightWall;
    this.#ceiling = this.ceiling;
    this.#effect = undefined;
  }

  #setEnabledAttributes() {
    if (this.enabled) {
      this.#duration = this.duration;
      this.#decay = this.decay;
      this.#leftWall = this.leftWall;
      this.#rightWall = this.rightWall;
      this.#ceiling = this.ceiling;
    } else {
      this.#duration = 0;
      this.#decay = 0;
      this.#leftWall = { delay: 0, gain: 0 };
      this.#rightWall = { delay: 0, gain: 0 };
      this.#ceiling = { delay: 0, gain: 0 };
    }
    if (this.#effect) {
      const impulse: AudioBuffer | undefined = this.#impulseResponse(
        this.#duration,
        this.#decay
      );
      if (impulse && this.#effect) this.#effect.buffer = impulse;
    }
  }
  override setContext(context: AudioContext | OfflineAudioContext) {
    super.setContext(context);
    // set up the diffuse reverberation
    const impulse: AudioBuffer | undefined = this.#impulseResponse(
      this.#duration,
      this.#decay
    );
    if (impulse && this.context) {
      this.#effect = this.context.createConvolver();
      this.#effect.buffer = impulse;
    }
    if (this.in && this.#effect && this.out) {
      this.in.connect(this.#effect).connect(this.out);
    }

    this.#setEnabledAttributes();
    // set up the left, right walls, and ceiling reflections
    if (this.context) {
      const leftGainNode: GainNode = this.context.createGain();
      leftGainNode.gain.value = dBToGain(this.#leftWall.gain);
      const leftWallNode: DelayNode = this.context.createDelay(1);
      leftWallNode.delayTime.value = this.#leftWall.delay / 1000;
      const rightGainNode: GainNode = this.context.createGain();
      rightGainNode.gain.value = dBToGain(this.#rightWall.gain);
      const rightWallNode: DelayNode = this.context.createDelay(1);
      rightWallNode.delayTime.value = this.#rightWall.delay / 1000;
      const ceilingGainNode: GainNode = this.context.createGain();
      ceilingGainNode.gain.value = dBToGain(this.#ceiling.gain);
      const ceilingNode: DelayNode = this.context.createDelay(1);
      ceilingNode.delayTime.value = this.#ceiling.delay / 1000;

      // make internal connections
      if (this.in && this.out) {
        this.in.connect(leftGainNode).connect(leftWallNode).connect(this.out);
        this.in.connect(rightGainNode).connect(rightWallNode).connect(this.out);
        this.in.connect(ceilingGainNode).connect(ceilingNode).connect(this.out);
      }

      // at any rate, connect the input to the output for the dry sound
      if (this.in && this.out) this.in.connect(this.out);
    }
  }

  #impulseResponse(duration: number, decay: number): AudioBuffer | undefined {
    if (this.context && duration > 0 && decay > 0) {
      const length = this.context.sampleRate * duration;
      const impulse = this.context.createBuffer(
        1,
        length,
        this.context.sampleRate
      );
      const IR = impulse.getChannelData(0);
      for (let i = 0; i < length; i++) {
        IR[i] = (1 * Math.random() - 1) * Math.pow(1 - 1 / length, decay);
      }
      return impulse;
    } else {
      return undefined;
    }
  }

  override connectIn(source: AudioNode, _destination: AudioNode) {
    if (this.in) source.connect(this.in);
  }

  override connectOut(destination: AudioNode) {
    if (this.out) this.out.connect(destination);
  }

  // this version has two walls and ceiling handling early reflection
  override setAttribute(name: string, value: string): void {
    super.setAttribute(name, value);
    switch (name) {
      case "enabled":
        this.enabled = !this.enabled;
        this.#setEnabledAttributes();
        break;
      case "duration":
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
}
