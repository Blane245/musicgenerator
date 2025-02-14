import { SoundFont2 } from "soundfont2";
import { CMGeneratorType, GENERATORTYPE } from "../types";
import { getAttributeValue } from "../utils/xmlfunctions";
import { Preset } from "../sfcomponents/types";
import { presetNameToPreset } from "../sfcomponents/util";

// base class for all generator types
// contains properties used almost all generators 
export default class CMG {
  name: string; // the unique name of the generator
  startTime: number; // time (seconds) that the generator starts
  stopTime: number; // time (seconds) that the generator stops
  type: GENERATORTYPE; 
  mute: boolean;
  soundFont: SoundFont2 | undefined;
  presetName: string; // the soundfont preset name (not needed for AudioFile or Noise)
  preset: Preset | undefined; // the soundfont preset object (derived from the presetName and the soundFont file)
  isLooping: boolean; // should the sample loop?
  measureLength: number; // the number of beats in a measure
  beatCount: number; // the number of strokes in a measure
  position: number; // the vertical location of the generator icon on the track timeline

  constructor(nextGenerator: number) {
    this.name = "G".concat(nextGenerator.toString());
    this.startTime = 0;
    this.stopTime = 0;
    this.type = GENERATORTYPE.CMG;
    this.mute = false;
    this.soundFont = undefined;
    this.presetName = '';
    this.preset = undefined;
    this.isLooping = true;
    this.measureLength = 4;
    this.beatCount = 4;
    this.position = 0;
  }

  copy(): CMGeneratorType {
    const newCMG = new CMG(0);
    newCMG.name = this.name;
    newCMG.startTime = this.startTime;
    newCMG.stopTime = this.stopTime;
    newCMG.mute = this.mute;
    newCMG.soundFont = this.soundFont;
    this.presetName = this.presetName
    this.preset = this.preset;
    this.isLooping = this.isLooping;
    this.measureLength = this.measureLength;
    this.beatCount = this.beatCount;
    newCMG.position = this.position;

    return newCMG;
  }

  // when the soundfont file is changed update the preset
  setSoundFont(soundFont: SoundFont2) {
    this.soundFont = soundFont;
    const {preset, name} = presetNameToPreset(this.presetName, this.soundFont);
    this.preset = preset;
    this.presetName = name;
  }

  setAttribute(name: string, value: string): void {
    switch (name) {
      case "name":
        this.name = value;
        break;
      case "type":
        this.type = GENERATORTYPE.CMG;
        break;
      case "startTime":
        const interval: number = this.stopTime - this.startTime;
        this.startTime = parseFloat(value);
        this.stopTime = this.startTime + interval;
        break;
      case "stopTime":
        this.stopTime = parseFloat(value);
        break;
      case "mute":
        this.mute = value == "true";
        break;
      case "presetName":
        this.presetName = value;
        const {preset} = presetNameToPreset(this.presetName, this.soundFont); 
        this.preset = preset;
        break;
        case "isLooping":
          this.isLooping = value == "true";
          break;
          case "measureLength":
            this.measureLength = parseInt(value);
            break;
          case "beatCount":
            this.beatCount = parseInt(value);
            break;
            
      default:
        break;
    }
  }

  async appendXML(_: XMLDocument, elem: Element): Promise<Element> {
    try {
      const returnElem: Element = elem;
      returnElem.setAttribute("name", this.name);
      returnElem.setAttribute("type", this.type);
      returnElem.setAttribute("startTime", this.startTime.toString());
      returnElem.setAttribute("stopTime", this.stopTime.toString());
      returnElem.setAttribute("type", this.type);
      returnElem.setAttribute("mute", this.mute.toString());
      returnElem.setAttribute("presetName", this.presetName);
      returnElem.setAttribute("isLooping", this.isLooping ? "true" : "false");
      returnElem.setAttribute("measureLength", this.measureLength.toString());
      returnElem.setAttribute("beatCount", this.beatCount.toString());
      returnElem.setAttribute("position", this.position.toString());
      return Promise.resolve(returnElem);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }

  static async getXML(elem: Element, _version: string, soundFont: SoundFont2): Promise<CMG> {
    try {
      const g: CMG = new CMG(0);
      g.name = getAttributeValue(elem, "name", "string") as string;
      g.startTime = getAttributeValue(elem, "startTime", "float") as number;
      g.stopTime = getAttributeValue(elem, "stopTime", "float") as number;
      g.type = getAttributeValue(elem, "type", "string") as GENERATORTYPE;
      g.mute = getAttributeValue(elem, "mute", "string") == "true";
      g.soundFont = soundFont;
      g.presetName = getAttributeValue(elem, "presetName", "string") as string;
      const {preset} = presetNameToPreset(g.presetName, soundFont)
      g.preset = preset;
      g.isLooping =
        (getAttributeValue(elem, "isLooping", "string") as string) == "true";
      g.measureLength = getAttributeValue(
        elem,
        "measureLength",
        "int"
      ) as number;
      g.beatCount = getAttributeValue(elem, "beatCount", "int") as number;
      g.position = getAttributeValue(elem, "position", "int") as number;
      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
