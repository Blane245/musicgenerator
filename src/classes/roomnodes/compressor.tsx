import { softDisconnect } from "utils/softdisconnect";
import { getAttributeValue, getElementElement } from "utils/xmlfunctions";

export default class Compressor {
  enabled: boolean;
  threshold: number;
  knee: number;
  ratio: number;
  attack: number;
  release: number;
  effectIn: AudioNode | null;
  effectOut: AudioNode | null;
  compressor: DynamicsCompressorNode | null;
  #context: AudioContext | OfflineAudioContext | null;

  constructor() {
    this.enabled = true;
    this.threshold = -24; // dB range -100 0
    this.knee = 30; // dB range 0 to 40
    this.ratio = 12; // range 1 to 20
    this.attack = 0.003; // seconds range 0 to 1
    this.release = 0.25; // seconds range 0 to 1
    this.effectIn = null;
    this.effectOut = null;
    this.compressor = null;
    this.#context = null;
  }

  // build the compressor in the current context
  setContext(context: AudioContext | OfflineAudioContext) {
    this.#context = context;
    this.effectIn = context.createGain();
    this.effectOut = context.createGain();
    this.compressor = context.createDynamicsCompressor();
    this.compressor.threshold.value = this.threshold;
    this.compressor.knee.value = this.knee;
    this.compressor.release.value = this.release;
    this.compressor.attack.value = this.attack;
    this.compressor.connect(this.effectOut);
  }

  connect(destination: AudioNode) {
    if (!this.effectIn || !this.effectOut ) return;
    this.effectOut.connect(destination);
    this.#enable(this.enabled);
  }

  // enabled - connect the effectIn to compressor, disconnect effectIn from effectOut
  // disabled - disconnect effectIn from compressor, connect effectIn to effectOut
  #enable(enabled: boolean) {
    if (
      !this.compressor ||
      !this.effectIn ||
      !this.effectOut
    )
      return;
    if (enabled) {
      try {
        softDisconnect(this.effectIn,this.effectOut);
      } catch (e) {}
      this.effectIn.connect(this.compressor);
    } else {
      try {
        softDisconnect(this.effectIn, this.compressor);
      } catch (e) {}
      this.effectIn.connect(this.effectOut);
    }
  }

  setAttribute(name: string, value: string): void {
    switch (name) {
      case "compressor.enabled":
        this.enabled = value == "true";
        this.#enable(this.enabled);
        break;
      case "compress.knee":
        this.knee = parseFloat(value);
        if (this.compressor) this.compressor.knee.value = this.knee;
        break;
      case "compress.threshold":
        this.threshold = parseFloat(value);
        if (this.compressor) this.compressor.threshold.value = this.threshold;
        break;
      case "compress.release":
        this.release = parseFloat(value) / 1000;
        if (this.compressor) this.compressor.release.value = this.release;
        break;
      case "compress.attack":
        this.attack = parseFloat(value) / 1000;
        if (this.compressor) this.compressor.attack.value = this.attack;
        break;
      case "compress.ratio":
        this.ratio = parseFloat(value);
        if (this.compressor) this.compressor.ratio.value = this.ratio;
        break;
      default:
        break;
    }
  }

  copy(): Compressor {
    const n = new Compressor();
    n.enabled = this.enabled;
    n.#context = this.#context;
    n.effectIn = this.effectIn;
    n.effectOut = this.effectOut;
    n.compressor = this.compressor;
    n.attack = this.attack;
    n.knee = this.knee;
    n.ratio = this.ratio;
    n.release = this.release;
    n.threshold = this.threshold;
    return n;
  }

  reset() {
    this.threshold = -24;
    this.knee = 30;
    this.ratio = 12;
    this.attack = 0.003;
    this.release = 0.25;
    if (this.compressor) {
      this.compressor.threshold.value = this.threshold;
      this.compressor.knee.value = this.knee;
      this.compressor.ratio.value = this.ratio;
      this.compressor.attack.value = this.attack;
      this.compressor.release.value = this.release;
    }
  }

  getXML(fcElem: Element, _version: string): void {
    const cElem: Element | null = getElementElement(fcElem, "compressor");
    if (!cElem) throw new Error (`Compressor getXML missing compressor element`)
    try {
      this.enabled =
        (getAttributeValue(cElem, "enabled", "string") as string) == "true";
    } catch (e) {
      this.enabled = true;
    }
    this.attack = getAttributeValue(cElem, "attack", "float") as number;
    this.knee = getAttributeValue(cElem, "knee", "float") as number;
    this.ratio = getAttributeValue(cElem, "ratio", "float") as number;
    this.release = getAttributeValue(cElem, "release", "float") as number;
    this.threshold = getAttributeValue(cElem, "threshold", "float") as number;
  }
  appendXML(doc: XMLDocument, elem: Element): void {
    const cElement: Element = doc.createElement("compressor");
    cElement.setAttribute("enabled", this.enabled ? "true" : "false");
    cElement.setAttribute("attack", this.attack.toString());
    cElement.setAttribute("knee", this.knee.toString());
    cElement.setAttribute("ratio", this.ratio.toString());
    cElement.setAttribute("release", this.release.toString());
    cElement.setAttribute("threshold", this.threshold.toString());
    elem.appendChild(cElement);
  }
}
