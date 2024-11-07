import { getAttributeValue, getElementElement } from "../utils/xmlfunctions";

/**
 * represents an audo dynamic compression node.
 * It provides a compression effect, which lowers the volume of the loudest parts of the signal in order to help prevent clipping and distortion that can occur when multiple sounds are played and multiplexed together at once.
 *
 * @export
 * @class Compressor
 * @typedef {Compressor}
 */
export default class Compressor {
  /**
   * representing the decibel value above which the compression will start taking effect.
   * The threshold property's default value is -24 and it can be set between -100 and 0.
   * @type {number}
   */
  threshold: number;
  /**
   * containing a decibel value representing the range above the threshold where the curve smoothly transitions to the compressed portion.
   * The knee property's default value is 30 and it can be set between 0 and 40.
   * @type {number}
   */
  knee: number;
  /**
   * representing the amount of change, in dB, needed in the input for a 1 dB change in the output.
   * The ratio property's default value is 12 and it can be set between 1 and 20.
   * @type {number}
   */
  ratio: number;
  /**
   * representing the amount of time, in seconds, required to reduce the gain by 10 dB. It defines how quickly the signal is adapted when its volume is increased.
   * The attack property's default value is 0.003 and it can be set between 0 and 1.
   * @type {number}
   */
  attack: number;
  /**
   * representing the amount of time, in seconds, required to increase the gain by 10 dB. It defines how quick the signal is adapted when its volume is reduced.
   * The release property's default value is 0.25 and it can be set between 0 and 1.
   * @type {number}
   */
  release: number;
  /**
   * provides a compression effect, which lowers the volume of the loudest parts of the signal in order to help prevent clipping and distortion that can occur when multiple sounds are played and multiplexed together at once.
   * @type {(DynamicsCompressorNode | undefined)}
   */
  compressorNode: DynamicsCompressorNode | undefined;
  /**
   * represents an audio-processing graph built from audio modules linked together
   *
   * @type {(AudioContext | OfflineAudioContext | undefined)}
   */
  context: AudioContext | OfflineAudioContext | undefined;

  /**
   * Creates an instance of Compressor and sets parameters to their default values
   * also sets the compressornode and context to null.
   * These will be set a preview or record time by the generator
   *
   * @constructor
   */
  constructor() {
    this.threshold = -24; // dB range -100 0
    this.knee = 30; // dB range 0 to 40
    this.ratio = 12; // range 1 to 20
    this.attack = 0.003; // seconds range 0 to 1
    this.release = 0.25; // seconds range 0 to 1
    this.compressorNode = undefined;
    this.context = undefined;
  }

  /**
   * Create the dynamic compression node and set its parameters to those
   * currently in the object
   *
   * @param {(AudioContext | OfflineAudioContext)} context - an audio context for preview or recording
   */
  setContext(context: AudioContext | OfflineAudioContext) {
    this.context = context;
    this.compressorNode = this.context.createDynamicsCompressor();
    this.compressorNode.threshold.value = this.threshold;
    this.compressorNode.knee.value = this.knee;
    this.compressorNode.release.value = this.release;
    this.compressorNode.attack.value = this.attack;
  }

  clearContext() {
    this.context = undefined;
    this.compressorNode = undefined;
  }

  /**
   * set the threshold value for the UI and the compression node
   * @param value - the Threshold value
   */
  setThreshold(value: number): void {
    this.threshold = value;
    if (this.compressorNode) this.compressorNode.threshold.value = value;
  }

  /**
   * set the knee value for the UI and the compression node
   * @param value - the knee value
   */
  setKnee(value: number): void {
    this.knee = value;
    if (this.compressorNode) this.compressorNode.knee.value = value;
  }

  /**
   * set the attack value for the UI and the compression node
   * @param value - the attack value
   */
  setAttack(value: number): void {
    this.attack = value;
    if (this.compressorNode) this.compressorNode.attack.value = value;
  }

  /**
   * set the release value for the UI and the compression node
   * @param value - the release value
   */
  setRelease(value: number): void {
    this.release = value;
    if (this.compressorNode) this.compressorNode.release.value = value;
  }

  /**
   * set the ratio value for the UI and the compression node
   * @param value - the ratio value
   */
  setRatio(value: number): void {
    this.ratio = value;
    if (this.compressorNode) this.compressorNode.ratio.value = value;
  }

  copy(): Compressor {
    const nC = new Compressor();
    nC.attack = this.attack;
    nC.compressorNode = this.compressorNode;
    nC.context = this.context;
    nC.knee = this.knee;
    nC.ratio = this.ratio;
    nC.release = this.release;
    nC.threshold = this.threshold;
    return nC;
  }
  /**
   * loads the compressor from the CMG file's XML. If it is not present
   * leaves the values unchanged
   *
   * @param {Element} fcElem - the CMGFile xml element
   */
  getXML(fcElem: Element): void {
    try {
      const cElem: Element = getElementElement(fcElem, "compressor");
      this.threshold = getAttributeValue(cElem, "threshold", "float") as number;
      this.knee = getAttributeValue(cElem, "knee", "float") as number;
      this.ratio = getAttributeValue(cElem, "ratio", "float") as number;
      this.release = getAttributeValue(cElem, "release", "float") as number;
      this.attack = getAttributeValue(cElem, "attack", "float") as number;
    } catch {
      console.log(`error occurred while reading compressor element from XML`);
    }
  }
  /**
   * Adds the compressor's XML to the CMG file XML element
   *
   * @param {Element} elem - the CMGFile xml element
   */
  appendXML(doc: XMLDocument, elem: Element): void {
    const cElement: Element = doc.createElement("compressor");
    cElement.setAttribute("threshold", this.threshold.toString());
    cElement.setAttribute("knee", this.knee.toString());
    cElement.setAttribute("ratio", this.ratio.toString());
    cElement.setAttribute("release", this.release.toString());
    cElement.setAttribute("attack", this.attack.toString());
    elem.appendChild(cElement);
  }
}
