import { getAttributeValue, getElementElement } from "../utils/xmlfunctions";

export default class Compressor {
  name: string;
  threshold: number;
  knee: number;
  ratio: number;
  attack: number;
  release: number;
  effect: DynamicsCompressorNode | undefined;
  context: AudioContext | OfflineAudioContext | undefined;

  constructor(name: string) {
    this.name = name;
    this.threshold = -24; // dB range -100 0
    this.knee = 30; // dB range 0 to 40
    this.ratio = 12; // range 1 to 20
    this.attack = 0.003; // seconds range 0 to 1
    this.release = 0.25; // seconds range 0 to 1
    this.effect = undefined;
    this.context = undefined;
  }

  setContext(context: AudioContext | OfflineAudioContext) {
    this.context = context;
    this.effect = this.context.createDynamicsCompressor();
    this.effect.threshold.value = this.threshold;
    this.effect.knee.value = this.knee;
    this.effect.release.value = this.release;
    this.effect.attack.value = this.attack;
  }

  setAttribute(name: string, value: string): void {
    switch (name) {
      case "compressor.name":
        this.name = value;
        break;
      case "compress.knee":
        this.knee = parseFloat(value);
        if (this.effect) this.effect.knee.value = this.knee;
        break;
      case "compress.threshold":
        this.threshold = parseFloat(value);
        if (this.effect)
          this.effect.threshold.value = this.threshold;
        break;
      case "compress.release":
        this.release = parseFloat(value) / 1000;
        if (this.effect) this.effect.release.value = this.release;
        break;
      case "compress.attack":
        this.attack = parseFloat(value) / 1000;
        if (this.effect) this.effect.attack.value = this.attack;
        break;
      case "compress.ratio":
        this.ratio = parseFloat(value);
        if (this.effect) this.effect.ratio.value = this.ratio;
        break;
      default:
        break;
    }
  }

  copy(): Compressor {
    const n = new Compressor(this.name);
    n.context = this.context;
    n.effect = this.effect;
    n.attack = this.attack;
    n.knee = this.knee;
    n.ratio = this.ratio;
    n.release = this.release;
    n.threshold = this.threshold;
    return n;
  }

  getXML(fcElem: Element): void {
    try {
      const cElem: Element = getElementElement(fcElem, "compressor");
      this.name = getAttributeValue(cElem, "name", "float") as string;
      this.attack = getAttributeValue(cElem, "attack", "float") as number;
      this.knee = getAttributeValue(cElem, "knee", "float") as number;
      this.ratio = getAttributeValue(cElem, "ratio", "float") as number;
      this.release = getAttributeValue(cElem, "release", "float") as number;
      this.threshold = getAttributeValue(cElem, "threshold", "float") as number;
    } catch {
    }
  }
  appendXML(props:{doc: XMLDocument, elem: Element}): void {
    const {doc, elem} = props;
    const cElement: Element = doc.createElement("compressor");
    cElement.setAttribute("name", this.name);
    cElement.setAttribute("attack", this.attack.toString());
    cElement.setAttribute("knee", this.knee.toString());
    cElement.setAttribute("ratio", this.ratio.toString());
    cElement.setAttribute("release", this.release.toString());
    cElement.setAttribute("threshold", this.threshold.toString());
    elem.appendChild(cElement);
  }
}
