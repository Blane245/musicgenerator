import { getAttributeValue } from "utils/xmlfunctions";
import { v2g } from "utils/v2g";

// room volume
export default class Volume {
  name: string;
  context: AudioContext | OfflineAudioContext | undefined;
  volume: number;
  effect: GainNode | undefined;

  constructor(name: string) {
    this.name = name;
    this.context = undefined;
    this.volume = 0;
  }

  // set the context and build the equalizer
  setContext(context: AudioContext | OfflineAudioContext) {
    this.context = context;

    // create all of the effects
    this.effect = context.createGain();
    this.effect.gain.value = v2g(this.volume);
  }

  // volume scale is -5 to 5
  setVolume(value: number): void {
    this.volume = value;
    if (this.effect) this.effect.gain.value = v2g(value);
  }

  copy(): Volume {
    const n = new Volume(this.name);
    n.context = this.context;
    n.volume = this.volume;
    n.effect = this.effect;
    return n;
  }

  getXML(fcElem: Element, _version:string): void {
    try {
      this.volume = getAttributeValue(fcElem, "volume", "float") as number;
    } catch {
      this.volume = 0;
    }
  }

  appendXML(_: XMLDocument, elem: Element): void {
    elem.setAttribute("volume", this.volume.toString());
  }
}
