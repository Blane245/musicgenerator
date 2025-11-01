import { softDisconnect } from "utils/softdisconnect";
import { getAttributeValue, getElementElement } from "utils/xmlfunctions";
import { dBToGain } from "sfcomponents/util";

// This is a 10 octave equalizer made of lowshelf, peaking, and highshelf filter
const BANDS: number[] = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 15000];
const BANDCOUNT: number = BANDS.length;
export default class Equalizer {
  enabled: boolean;
  effectIn: AudioNode | null;
  effectOut: AudioNode | null;
  #filterHead: AudioNode | null;
  #filters: BiquadFilterNode[];
  #context: AudioContext | OfflineAudioContext | null;
  frequencies: number[];
  gains: number[];

  constructor() {
    this.enabled = true;
    this.#context = null;
    this.#filterHead = null;
    this.#filters = [];
    this.frequencies = BANDS;
    this.gains = Array(BANDCOUNT).fill(0);
    this.effectIn = null;
    this.effectOut = null;
    this.#filters = [];
    this.#context = null;
  }

  // set the context and build the equalizer
  setContext(context: AudioContext | OfflineAudioContext) {
    this.#context = context;
    this.effectIn = context.createGain();
    this.effectOut = context.createGain();
    this.#filterHead = context.createGain();

    // create all of the filters and connect them in series
    // wiht the first connected to the filter head and the last connected to the
    // effect output
    this.#filters = [];
    let lastFilter: BiquadFilterNode | null = null;
    for (let i = 0; i < BANDCOUNT; i++) {
      const newFilter = context.createBiquadFilter();
      newFilter.gain.value = dBToGain(this.gains[i] - 15);
      newFilter.frequency.value = BANDS[i];
      if (i == 0) {
        newFilter.type = "highshelf";
        const ratio: number = BANDS[1] / BANDS[0];
        newFilter.Q.value = Math.sqrt(ratio);
        if (this.enabled) this.#filterHead.connect(newFilter);
      } else if (i == BANDCOUNT - 1) {
        newFilter.type = "lowshelf";
        if (lastFilter) lastFilter.connect(newFilter);
        newFilter.Q.value = Math.sqrt(2);
        newFilter.connect(this.effectOut);
      } else {
        newFilter.type = "peaking";
        const ratio: number = BANDS[i + 1] / BANDS[i];
        newFilter.Q.value = Math.sqrt(ratio);
        if (lastFilter) lastFilter.connect(newFilter);
      }
      lastFilter = newFilter;
      this.#filters.push(newFilter);
    }
  }

  connect(destination: AudioNode) {
    if (!this.effectIn || !this.effectOut) return;
    this.effectOut.connect(destination);
    this.#enable(this.enabled);
  }

  // enabled - connect the effectIn to the filters, disconnect effectIn from effectOut
  // disabled - disconnect effectIn from the filters, connect effectIn to effectOut
  #enable(enabled: boolean) {
    if (!this.#filterHead || !this.effectIn || !this.effectOut) return;
    if (enabled) {
      try {
        softDisconnect(this.effectIn, this.effectOut);
      } catch (e) {}
      this.effectIn.connect(this.#filterHead);
    } else {
      try {
        softDisconnect(this.effectIn, this.#filterHead);
      } catch (e) {}
      this.effectIn.connect(this.effectOut);
    }
  }

  setGain(band: number, value: number): void {
    this.gains[band] = value;
    if (this.#context) this.#filters[band].gain.value = value;
  }

  copy(): Equalizer {
    const n = new Equalizer();
    n.enabled = this.enabled;
    n.#context = this.#context;
    n.effectIn = this.effectIn;
    n.effectOut = this.effectOut;
    n.#filters = [...this.#filters];
    n.frequencies = this.frequencies;
    n.gains = [...this.gains];
    return n;
  }

  reset() {
    this.gains = Array(BANDCOUNT).fill(0);
    this.#filters.forEach((f) => {
      f.gain.value = 0;
    });
  }

  setAttribute(name: string, value: string): void {
    switch (name) {
      case "equalizer.enabled":
        this.enabled = value == "true";
        this.#enable(this.enabled);
        break;
    }
  }

  getXML(fcElem: Element, _version: string): void {
    try {
      const eElement: Element = getElementElement(fcElem, "equalizer");
      try {
        this.enabled =
          (getAttributeValue(eElement, "enabled", "string") as string) ==
          "true";
      } catch (e) {
        this.enabled = true;
      }
      for (let i = 0; i < BANDCOUNT; i++) {
        this.gains[i] = getAttributeValue(
          eElement,
          `gain${i}`,
          "float"
        ) as number;
      }
    } catch {}
  }

  appendXML(doc: XMLDocument, elem: Element): void {
    const eElement: Element = doc.createElement("equalizer");
    eElement.setAttribute("enabled", this.enabled ? "true" : "false");
    for (let i = 0; i < BANDCOUNT; i++) {
      eElement.setAttribute(`gain${i}`, this.gains[i].toString());
    }
    elem.appendChild(eElement);
  }
}
