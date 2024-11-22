import { rand } from "../utils/seededrandom";
import { getAttributeValue, getElementElement } from "../utils/xmlfunctions";

export class ReverbNoise {
  name: string;
  context: AudioContext | OfflineAudioContext | undefined;
  effect: GainNode | undefined;
  gain: number;
  osc: AudioBufferSourceNode | undefined;
  length: number; // seconds

  constructor(name: string) {
    this.name = name;
    this.context = undefined;
    this.effect = undefined;
    this.gain = 1;
    this.osc = undefined;
    this.length = 2;
  }

  setContext(context: AudioContext | OfflineAudioContext) {
    this.context = context;
    console.log("reverbnoise: context set");
  }

  connect(destination: AudioNode): void {
    if (this.effect) this.effect.connect(destination);
    console.log("reverbnoise: noise effect connected to", destination);
  }

  init(time: number) {
    if (this.context) {
      this.effect = this.context.createGain();
      this.effect.gain.value = this.gain;

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
        "reverbnoise: starting noise at",
        time,
        "length",
        this.osc.buffer.length,
        "loopend",
        this.osc.loopEnd
      );
      this.osc.start(time);
      this.osc.connect(this.effect);
    }
  }

  off(time:number) {
    if (this.osc && this.context) {
       this.osc.stop(time);
       console.log('reverbnoise: off at ', time);
    }
  }

  copy(): ReverbNoise {
    const n = new ReverbNoise(this.name);
    n.context = this.context;
    n.effect = this.effect;
    n.gain = this.gain;
    n.osc = this.osc;
    n.length = this.length;
    return n;
  }

  setAttribute(name: string, value: string): void {
    switch (name) {
      case "noise.name":
        this.name = value;
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
    eE.setAttribute("gain", this.gain.toString());
    eE.setAttribute("length", this.length.toString());
    elem.appendChild(eE);
  }

  getXML(elem: Element): void {
    try {
      const eE: Element = getElementElement(elem, "noise");
      this.name = getAttributeValue(eE, "name", "string") as string;
      this.gain = getAttributeValue(eE, "gain", "float") as number;
      this.length = getAttributeValue(eE, "length", "float") as number;
    } catch {}
  }
}
