import { CMGeneratorType, GENERATORTYPE } from "../types/types";
import { getAttributeValue } from "../utils/xmlfunctions";
import InstReverb from "./instreverb2";

export default class CMG {
  name: string;
  context: AudioContext | OfflineAudioContext | undefined
  startTime: number;
  stopTime: number;
  type: GENERATORTYPE;
  mute: boolean;
  solo: boolean;
  reverb: InstReverb;
  position: number; // the vertical location of the generator icon on the track timeline

  constructor(nextGenerator: number) {
    this.name = "G".concat(nextGenerator.toString());
    this.context = undefined;
    this.startTime = 0;
    this.stopTime = 0;
    this.type = GENERATORTYPE.CMG;
    this.mute = false;
    this.solo = false;
    this.position = 0;
    this.reverb = new InstReverb(this.name.concat(':reverb'));
  }

  setContext(context: AudioContext | OfflineAudioContext) {
    this.reverb.setContext(context);
  }

  copy(): CMGeneratorType {
    const newCMG = new CMG(0);
    newCMG.name = this.name;
    newCMG.startTime = this.startTime;
    newCMG.stopTime = this.stopTime;
    newCMG.mute = this.mute;
    newCMG.solo = this.solo;
    newCMG.position = this.position;
    newCMG.reverb = this.reverb.copy();

    return newCMG;
  }

  setAttribute(name: string, value: string): void {
    switch (name) {
      case "name":
        this.name = value;
        this.reverb.name = this.name.concat(':reverb');
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
      default:
        break;
    }
    this.reverb.setAttribute(name, value);
  }

  appendXML(props:{elem: Element} ): void {
    props.elem.setAttribute("name", this.name);
    props.elem.setAttribute("type", this.type);
    props.elem.setAttribute("startTime", this.startTime.toString());
    props.elem.setAttribute("stopTime", this.stopTime.toString());
    props.elem.setAttribute("type", this.type);
    props.elem.setAttribute("solo", this.solo.toString());
    props.elem.setAttribute("mute", this.mute.toString());
    props.elem.setAttribute("position", this.position.toString());
  }

  getXML(elem: Element) {
    this.name = getAttributeValue(elem, "name", "string") as string;
    this.startTime = getAttributeValue(elem, "startTime", "float") as number;
    this.stopTime = getAttributeValue(elem, "stopTime", "float") as number;
    this.type = getAttributeValue(elem, "type", "string") as GENERATORTYPE;
    this.mute = getAttributeValue(elem, "mute", "string") == "true";
    this.solo = getAttributeValue(elem, "solo", "string") == "true";
    this.position = getAttributeValue(elem, "position", "int") as number;
  }
}
