import { dBToGain } from "sfcomponents/util";
import { softDisconnect } from "utils/softdisconnect";
import { getAttributeValue, getElementElement } from "utils/xmlfunctions";

export default class Reverb {
  enabled: boolean;
  duration: number;
  decay: number;
  // left wall, right wall, ceiling
  leftWall: { delay: number; gain: number };
  rightWall: { delay: number; gain: number };
  ceiling: { delay: number; gain: number };
  effectIn: GainNode | null;
  effectOut: GainNode | null;
  #context: AudioContext | OfflineAudioContext | null;
  #reverbHead: AudioNode | null;
  #halfGain1: GainNode | null;
  #halfGain2: GainNode | null;
  #efNode: ConvolverNode | null;
  #lwNode: DelayNode | null;
  #rwNode: DelayNode | null;
  #ceNode: DelayNode | null;
  #lwGain: GainNode | null;
  #rwGain: GainNode | null;
  #ceGain: GainNode | null;

  constructor() {
    this.enabled = true;
    this.duration = 1.0;
    this.decay = 2.0;
    this.leftWall = { delay: 0, gain: 0 };
    this.rightWall = { delay: 0, gain: 0 };
    this.ceiling = { delay: 0, gain: 0 };
    this.effectIn = null;
    this.effectOut = null;
    this.#context = null;
    this.#reverbHead = null;
    this.#halfGain1 = null;
    this.#halfGain2 = null;
    this.#efNode = null;
    this.#rwNode = null;
    this.#lwNode = null;
    this.#ceNode = null;
    this.#rwGain = null;
    this.#lwGain = null;
    this.#ceGain = null;
  }

  setContext(context: AudioContext | OfflineAudioContext) {
    this.#context = context;
    this.effectIn = context.createGain();
    this.effectOut = context.createGain();
    this.#reverbHead = context.createGain();
    this.#halfGain1 = context.createGain();
    this.#halfGain1.gain.value = 0.5;
    this.#halfGain2 = context.createGain();
    this.#halfGain2.gain.value = 0.5;

    // set up the diffuse reverberation
    const impulse: AudioBuffer | null = this.#impulseResponse(
      this.duration,
      this.decay
    );
    if (impulse) {
      this.#efNode = context.createConvolver();
      this.#efNode.buffer = impulse;
      this.#reverbHead.connect(this.#efNode);
      this.#efNode.connect(this.#halfGain2);
      this.#halfGain2.connect(this.effectOut);
      this.#reverbHead.connect(this.#halfGain1);
      this.#halfGain1.connect(this.effectOut);
    }

    // set the wall and ceiling reverbs
    this.#lwNode = context.createDelay(1);
    this.#rwNode = context.createDelay(1);
    this.#ceNode = context.createDelay(1);
    this.#lwGain = context.createGain();
    this.#rwGain = context.createGain();
    this.#ceGain = context.createGain();
    this.#reverbHead.connect(this.#lwNode);
    this.#reverbHead.connect(this.#rwNode);
    this.#reverbHead.connect(this.#ceNode);
    this.#lwNode.connect(this.#lwGain);
    this.#rwNode.connect(this.#rwGain);
    this.#ceNode.connect(this.#ceGain);
    this.#lwGain.connect(this.effectOut);
    this.#rwGain.connect(this.effectOut);
    this.#ceGain.connect(this.effectOut);
    this.#lwNode.delayTime.value = this.leftWall.delay;
    this.#lwGain.gain.value = dBToGain(this.leftWall.gain);
    this.#rwNode.delayTime.value = this.leftWall.delay;
    this.#rwGain.gain.value = dBToGain(this.leftWall.gain);
    this.#ceNode.delayTime.value = this.leftWall.delay;
    this.#ceGain.gain.value = dBToGain(this.leftWall.gain);
  }

  // generate far field impulse reverb response
  #impulseResponse(duration: number, decay: number): AudioBuffer | null {
    if (this.#context && duration > 0) {
      const length = this.#context.sampleRate;
      const impulse = this.#context.createBuffer(
        1,
        length,
        this.#context.sampleRate
      );
      const IR = impulse.getChannelData(0);
      for (let i = 0; i < length; i++) {
        IR[i] = (1 * Math.random() - 1) * Math.pow(1 - 1 / length, decay);
      }
      return impulse;
    } else {
      return null;
    }
  }

  connect(destination: AudioNode) {
    if (!this.effectOut) return;
    this.effectOut.connect(destination);
    this.#enable(this.enabled);
  }

  // enabled - connect the effectIn to the reverb, disconnect effectIn from effectOut
  // disabled - disconnect effectIn from the reverb, connect effectIn to effectOut
  #enable(enabled: boolean) {
    if (
      !this.#reverbHead ||
      !this.effectIn ||
      !this.effectOut ||
      !this.#context
    )
      return;
    if (enabled) {
      try {
        softDisconnect(this.effectIn, this.effectOut);
      } catch (e) {}
      this.effectIn.connect(this.#reverbHead);
    } else {
      try {
        softDisconnect(this.effectIn, this.#reverbHead);
      } catch (e) {}
      this.effectIn.connect(this.effectOut);
    }
  }

  // this version has two walls and ceiling handling early reflection
  setAttribute(name: string, value: string): void {
    switch (name) {
      case "reverb.enabled":
        this.enabled = value == "true";
        if (this.#context) this.#enable(this.enabled);
        break;
      case "reverb.duration":
        this.duration = parseFloat(value);
        if (this.#efNode) this.#efNode.buffer = this.#impulseResponse(this.duration, this.decay);
        break;
      case "reverb.decay":
        this.decay = parseFloat(value);
        if (this.#efNode) this.#efNode.buffer = this.#impulseResponse(this.duration, this.decay);
        break;
      case "reverb.leftwall.delay":
        this.leftWall.delay = parseFloat(value) / 1000;
        if (this.#lwNode) this.#lwNode.delayTime.value = this.leftWall.delay;
        break;
      case "reverb.leftwall.gain":
        this.leftWall.gain = parseFloat(value);
        if (this.#lwGain) this.#lwGain.gain.value = dBToGain(this.leftWall.delay);
        break;
      case "reverb.rightwall.delay":
        this.rightWall.delay = parseFloat(value) / 1000;
        if (this.#rwNode) this.#rwNode.delayTime.value = this.rightWall.delay;
        break;
      case "reverb.rightwall.gain":
        this.rightWall.gain = parseFloat(value);
        if (this.#rwGain) this.#rwGain.gain.value = dBToGain(this.rightWall.gain);
        break;
      case "reverb.ceiling.delay":
        this.ceiling.delay = parseFloat(value) / 1000;
        if (this.#ceNode) this.#ceNode.delayTime.value = this.ceiling.delay;
        break;
      case "reverb.ceiling.gain":
        this.ceiling.gain = parseFloat(value);
        if (this.#ceGain) this.#ceGain.gain.value = dBToGain(this.ceiling.gain);
        break;
      default:
        break;
    }
  }

  copy(): Reverb {
    const n = new Reverb();
    n.enabled = this.enabled;
    n.duration = this.duration;
    n.decay = this.decay;
    n.leftWall = { ...this.leftWall };
    n.rightWall = { ...this.rightWall };
    n.ceiling = { ...this.ceiling };
    n.#context = this.#context;
    n.effectIn = this.effectIn;
    n.effectOut = this.effectOut;
    n.#reverbHead = this.#reverbHead;
    n.#efNode = this.#efNode;
    n.#lwNode = this.#lwNode;
    n.#rwNode = this.#rwNode;
    n.#ceNode = this.#ceNode;
    return n;
  }

  reset() {
    this.duration = 1.0;
    this.decay = 2.0;
    this.leftWall = { delay: 0, gain: 0}
    this.rightWall = { delay: 0, gain: 0}
    this.ceiling = { delay: 0, gain: 0}
    if (this.#efNode) {
      this.#efNode.buffer = this.#impulseResponse(this.duration, this.decay);
    }
    if (this.#lwNode && this.#lwGain) {
      this.#lwNode.delayTime.value = this.leftWall.delay;
      this.#lwGain.gain.value = dBToGain(this.leftWall.gain);
    }
    if (this.#rwNode && this.#rwGain) {
      this.#rwNode.delayTime.value = this.rightWall.delay;
      this.#rwGain.gain.value = dBToGain(this.rightWall.gain);
    }
    if (this.#ceNode && this.#ceGain) {
      this.#ceNode.delayTime.value = this.ceiling.delay;
      this.#ceGain.gain.value = dBToGain(this.ceiling.gain);
    }
  }

  getXML(fcElem: Element, _version: string): void {
    try {
      const cElem: Element | null = getElementElement(fcElem, "reverb");
    if (!cElem) throw new Error (`Reverb getXML missing reverb element`)
      try {
        this.enabled =
          (getAttributeValue(cElem, "enabled", "string") as string) == "true";
      } catch (e) {
        this.enabled = true;
      }
      this.duration = getAttributeValue(cElem, "duration", "float") as number;
      this.decay = getAttributeValue(cElem, "decay", "float") as number;
      this.leftWall.delay = (getAttributeValue(
        cElem,
        "leftwalldelay",
        "float"
      ) as number) / 1000;
      this.leftWall.gain = getAttributeValue(
        cElem,
        "leftwallgain",
        "float"
      ) as number;
      this.rightWall.delay = (getAttributeValue(
        cElem,
        "rightwalldelay",
        "float"
      ) as number) / 1000;
      this.rightWall.gain = getAttributeValue(
        cElem,
        "rightwallgain",
        "float"
      ) as number;
      this.ceiling.delay = (getAttributeValue(
        cElem,
        "ceilingdelay",
        "float"
      ) as number) / 1000;
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
    cElement.setAttribute("enabled", this.enabled ? "true" : "false");
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
