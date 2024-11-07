import { RiChat1Line } from "react-icons/ri";
import { getAttributeValue, getElementElement } from "../utils/xmlfunctions";

// represents an audio equalizer.
/**
 * The frequencies for the equalizer - 1 octave apart
 *
 * @type {number[]}
 */
const BANDS: number[] = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 15000];
/**
 * The number of channels in the equalizer
 *
 * @type {number}
 */
const BANDCOUNT: number = BANDS.length;
/**
 * The equalizer, which has lowshelf and highsheld filters surrounding
 * peak filters. The equalizer gain values for each channel are stored in the CMG file and retrieve
 * from there. This equalizer does not realize the filters until the audio
 * context is realized by either a preview or record.
 *
 * @export
 * @class Equalizer
 * @typedef {Equalizer}
 */
export default class Equalizer {
  /**
   * The frequencies for each of the equalize channels (Hz)
   *
   * @type {number[]}
   */
  frequencies: number[];
  /**
   * The gains for each of the equalize channels (-15 to 15 dB)
   *
   * @type {number[]}
   */
  gains: number[];
  /**
   * The audio filters that relaize the equalizer
   *
   * @type {(BiquadFilterNode)[]}
   */
  filters: BiquadFilterNode[];
  /**
   * The audio context for the filters. Not set until audio generation is started
   *
   * @type {(AudioContext | OfflineAudioContext | undefined)}
   */
  context: AudioContext | OfflineAudioContext | undefined;

  /**
   * Set the gains to 0 and the filters to null
   *
   * @constructor
   */
  constructor() {
    this.filters = [];
    this.frequencies = BANDS;
    this.gains = Array(BANDCOUNT).fill(0);
    this.context = undefined;
  }

  /**
   * Set the audio context and define the filters. The chain is a lowshelf
   * filter followed by a number of peak filters, followed by a highsheld filter
   *
   * @param {(AudioContext | OfflineAudioContext)} context
   */
  setContext(context: AudioContext | OfflineAudioContext) {
    this.context = context;

    // create all of the filters
    this.filters = [];
    for (let i = 0; i < BANDCOUNT; i++) {
      this.filters.push(this.context.createBiquadFilter());
    }

    // the first filter is a low shelf filter
    // the last filter is a high shelf filter
    // the middle filters are peak filters with the Q value being sqrt (next freq/this freq)
    this.filters[0].frequency.value = BANDS[0];
    this.filters[0].type = "lowshelf";
    this.filters[0].gain.value = this.gains[0];

    this.filters[BANDCOUNT - 1].frequency.value = BANDS[BANDCOUNT - 1];
    this.filters[BANDCOUNT - 1].type = "highshelf";
    this.filters[BANDCOUNT - 1].gain.value = this.gains[BANDCOUNT - 1];

    // build the peaking filters and connect them in series the lowshelf
    for (let i = 1; i < BANDCOUNT - 1; i++) {
      this.filters[i].type = "peaking";
      this.filters[i].frequency.value = BANDS[i];
      this.filters[i].gain.value = this.gains[i];
      const ratio: number = BANDS[i + 1] / BANDS[i];
      this.filters[i].Q.value = Math.sqrt(ratio);
      this.filters[i - 1].connect(this.filters[i]);
    }

    // connect the last peaking filter to the highshelf
    this.filters[BANDCOUNT - 2].connect(this.filters[BANDCOUNT - 1]);
  }

  clearContext() {
    this.context = undefined;
  }

  /**
   * filter gains are get either in or out of audio context
   *
   * @param {number} band - the filter being addressed
   * @param {number} value - the new gain value
   */
  setGain(band: number, value: number): void {
    this.gains[band] = value;
    if (this.context) this.filters[band].gain.value = value;
  }

  /**
   * filter gains are retrievel with in or out of audo context
   *
   * @param {number} band - the filter being addressed
   * @returns {number} - the gain of the filter
   */
  getGain(band: number): number {
    if (this.context) return this.filters[band].gain.value;
    else return this.gains[band];
  }

  /**
   * return the front audionode of the filter chain
   *
   * @returns {BiquadFilterNode} - the first filter in the chain
   */
  front(): BiquadFilterNode {
    return this.filters[0];
  }
  /**
   * return the last audionode of the filter chain
   *
   * @returns {BiquadFilterNode} the last filter in the chain
   */
  back(): BiquadFilterNode {
    return this.filters[BANDCOUNT - 1];
  }

  copy(): Equalizer {
    const n = new Equalizer();
    n.frequencies = this.frequencies;
    n.filters = this.filters;
    n.gains = this.gains;
    n.context = this.context;
    return n;
  }

  /**
   * load the equalize definition from the CMG file. If is not defined
   * set all gains to zero
   *
   * @param {Element} fcElem - the XML element containing the gain attributes
   */
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
    } catch {
      console.log(`error occurred while reading equalizer element from XML`);
    }
  }

  /**
   * add the equalizer gain values to the CMG file
   *
   * @param {Element} elem - the XML element to receive the gain attributes
   */
  appendXML(doc: XMLDocument, elem: Element): void {
    const eElement: Element = doc.createElement("equalizer");

    for (let i = 0; i < BANDCOUNT; i++) {
      eElement.setAttribute(`gain${i}`, this.gains[i].toString());
    }
    elem.appendChild(eElement);
  }
}
