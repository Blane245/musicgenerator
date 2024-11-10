import { getAttributeValue, getElementElement } from "../utils/xmlfunctions";

// This is a 10 octave equalizer made of lowshelf, peaking, and highshelf filter
const BANDS: number[] = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 15000];
const BANDCOUNT: number = BANDS.length;
export default class Equalizer {
  name: string;
  context: AudioContext | OfflineAudioContext | undefined;
  effects: BiquadFilterNode[];
  frequencies: number[];
  gains: number[];

  constructor(name: string) {
    this.name = name;
    this.context = undefined;
    this.effects = [];
    this.frequencies = BANDS;
    this.gains = Array(BANDCOUNT).fill(0);
  }

  // set the context and build the equalizer
  setContext(context: AudioContext | OfflineAudioContext) {
    this.context = context;

    // create all of the effects
    this.effects = [];
    for (let i = 0; i < BANDCOUNT; i++) {
      this.effects.push(this.context.createBiquadFilter());
    }

    // the first filter is a low shelf filter
    // the last filter is a high shelf filter
    // the middle effects are peak effects with the Q value being sqrt (next freq/this freq)
    this.effects[0].frequency.value = BANDS[0];
    this.effects[0].type = "lowshelf";
    this.effects[0].gain.value = this.gains[0];

    this.effects[BANDCOUNT - 1].frequency.value = BANDS[BANDCOUNT - 1];
    this.effects[BANDCOUNT - 1].type = "highshelf";
    this.effects[BANDCOUNT - 1].gain.value = this.gains[BANDCOUNT - 1];

    // build the peaking effects and connect them in series the lowshelf
    for (let i = 1; i < BANDCOUNT - 1; i++) {
      this.effects[i].type = "peaking";
      this.effects[i].frequency.value = BANDS[i];
      this.effects[i].gain.value = this.gains[i];
      const ratio: number = BANDS[i + 1] / BANDS[i];
      this.effects[i].Q.value = Math.sqrt(ratio);
      this.effects[i - 1].connect(this.effects[i]);
    }

    // connect the last peaking filter to the highshelf
    this.effects[BANDCOUNT - 2].connect(this.effects[BANDCOUNT - 1]);
  }

  setGain(band: number, value: number): void {
    this.gains[band] = value;
    if (this.context) this.effects[band].gain.value = value;
  }

  getGain(band: number): number {
    if (this.context) return this.effects[band].gain.value;
    else return this.gains[band];
  }

  front(): BiquadFilterNode {
    return this.effects[0];
  }

  back(): BiquadFilterNode {
    return this.effects[BANDCOUNT - 1];
  }

  copy(): Equalizer {
    const n = new Equalizer(this.name);
    n.context = this.context;
    n.frequencies = this.frequencies;
    n.effects = [...this.effects];
    n.gains = this.gains;
    return n;
  }

  getXML(fcElem: Element): void {
    try {
      const eElement: Element = getElementElement(fcElem, "equalizer");
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
    for (let i = 0; i < BANDCOUNT; i++) {
      eElement.setAttribute(`gain${i}`, this.gains[i].toString());
    }
    elem.appendChild(eElement);
  }
}
