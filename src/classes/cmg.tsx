import { CMGeneratorType, GENERATORTYPE } from "../types/types";
import { getAttributeValue, getElementElement } from "../utils/xmlfunctions";

/**
 * Parent class of all computer music generators
 *
 * @export
 * @class CMG
 * @type {CMG}
 */
export default class CMG {
  /**
   * The name of the generator
   *
   * @type {string}
   */
  name: string;
  /**
   * The start time of the generator (seconds)
   *
   * @type {number}
   */
  startTime: number;
  /**
   * The stop time of the generator (seconds)
   *
   * @type {number}
   */
  stopTime: number;
  /**
   * The type of the generator
   *
   * @type {GENERATORTYPE}
   */
  type: GENERATORTYPE;
  /**
   * Mute status of the generator
   *
   * @type {boolean}
   */
  mute: boolean;
  /**
   * Solo status of the generator
   *
   * @type {boolean}
   */
  solo: boolean;
  /**
   * The veritical position of hte generator icon on the track time line
   *
   * @type {number}
   */
  position: number; // the vertical location of the generator icon on the track timeline

  /**
   * The generator's reverb delay time
   *
   * @type {number}
   */
  reverb: {
    enabled: boolean;
    reverbTime: number;
  };

  /**
   * Creates an instance of CMG with default values
   *
   * @constructor
   * @param {number} nextGenerator - The suffix number of the generator name
   */
  constructor(nextGenerator: number) {
    this.name = "G".concat(nextGenerator.toString());
    this.startTime = 0;
    this.stopTime = 0;
    this.type = GENERATORTYPE.CMG;
    this.mute = false;
    this.solo = false;
    this.position = 0;
    this.reverb = { reverbTime: 1.0, enabled: false };
  }

  /**
   * makes a copy of this object
   * overridden by the extending classes
   * @returns {CMG} - the copy of the object
   */
  copy(): CMGeneratorType {
    const newCMG = new CMG(0);
    newCMG.name = this.name;
    newCMG.startTime = this.startTime;
    newCMG.stopTime = this.stopTime;
    newCMG.mute = this.mute;
    newCMG.solo = this.solo;
    newCMG.position = this.position;
    newCMG.reverb = this.reverb;

    return newCMG;
  }

  /**
   * Sets the attributes of the class object
   * overriden by the extending classes
   *
   * @param {string} name - the name of the attribute
   * @param {string} value - the string containing the value of the attribute, converted to appropraite datatype
   */
  setAttribute(name: string, value: string): void {
    switch (name) {
      case "name":
        this.name = value;
        break;
      case "type":
        this.type = GENERATORTYPE.CMG;
        break;
      case "startTime":
        this.startTime = parseFloat(value);
        break;
      case "stopTime":
        this.stopTime = parseFloat(value);
        break;
      case "mute":
        this.mute = value == "true";
        break;
      case "solo":
        this.solo = value == "true";
        break;
      case "reverbTime":
        this.reverb.reverbTime = parseFloat(value);
        break;
      case "enabled":
        this.reverb.enabled = value == "true";
        break;
      default:
        break;
    }
  }

  /**
   * Add the XML description of this generator to an XML element.
   * Overridden by extending classes.
   *
   * @param {XMLDocument} doc - the XML document being appended
   * @param {Element} elem - the element to receive the attributes or children
   */
  appendXML(doc: XMLDocument, elem: Element): void {
    elem.setAttribute("name", this.name);
    elem.setAttribute("type", this.type);
    elem.setAttribute("startTime", this.startTime.toString());
    elem.setAttribute("stopTime", this.stopTime.toString());
    elem.setAttribute("type", this.type);
    elem.setAttribute("solo", this.solo.toString());
    elem.setAttribute("mute", this.mute.toString());
    elem.setAttribute("position", this.position.toString());
    const rE: Element = doc.createElement("simplereverb");
    rE.setAttribute("reverbTime", this.reverb.reverbTime.toString());
    rE.setAttribute("enabled", this.reverb.enabled.toString());
    elem.appendChild(rE);
  }

  /**
   * Loads the contents of XML into the class object.
   * Overriden by the extended classes
   *
   * @param {Element} elem - the element of the XML document containing the object attributes
   */
  getXML(elem: Element) {
    this.name = getAttributeValue(elem, "name", "string") as string;
    this.startTime = getAttributeValue(elem, "startTime", "float") as number;
    this.stopTime = getAttributeValue(elem, "stopTime", "float") as number;
    this.type = getAttributeValue(elem, "type", "string") as GENERATORTYPE;
    this.mute = getAttributeValue(elem, "mute", "string") == "true";
    this.solo = getAttributeValue(elem, "solo", "string") == "true";
    this.position = getAttributeValue(elem, "position", "int") as number;
    const rE: Element = getElementElement(elem, "simplereverb");
    this.reverb.reverbTime = getAttributeValue(rE, "reverbTime", "float") as number;
    this.reverb.enabled = getAttributeValue(rE, "enabled", "string") == "true";
  }
}
