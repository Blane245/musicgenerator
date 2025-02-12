import { SoundFont2 } from "soundfont2";
import { CMGeneratorType, GENERATORTYPE } from "../types";
import { getAttributeValue } from "../utils/xmlfunctions";
import CMGFile from "./cmgfile";

export default class CMG {
  name: string;
  startTime: number;
  stopTime: number;
  type: GENERATORTYPE;
  mute: boolean;
  position: number; // the vertical location of the generator icon on the track timeline

  constructor(nextGenerator: number) {
    this.name = "G".concat(nextGenerator.toString());
    this.startTime = 0;
    this.stopTime = 0;
    this.type = GENERATORTYPE.CMG;
    this.mute = false;
    this.position = 0;
  }

  copy(): CMGeneratorType {
    const newCMG = new CMG(0);
    newCMG.name = this.name;
    newCMG.startTime = this.startTime;
    newCMG.stopTime = this.stopTime;
    newCMG.mute = this.mute;
    newCMG.position = this.position;

    return newCMG;
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
      default:
        break;
    }
  }

  async appendXML(_: XMLDocument, elem: Element): Promise<Element> {
    try {
      const returnElement: Element = elem;
      returnElement.setAttribute("name", this.name);
      returnElement.setAttribute("type", this.type);
      returnElement.setAttribute("startTime", this.startTime.toString());
      returnElement.setAttribute("stopTime", this.stopTime.toString());
      returnElement.setAttribute("type", this.type);
      returnElement.setAttribute("mute", this.mute.toString());
      returnElement.setAttribute("position", this.position.toString());
      return Promise.resolve(returnElement);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }

  static async getXML(elem: Element, _version: string, _?: SoundFont2 | null): Promise<CMG> {
    try {
      const g: CMG = new CMG(0);
      g.name = getAttributeValue(elem, "name", "string") as string;
      g.startTime = getAttributeValue(elem, "startTime", "float") as number;
      g.stopTime = getAttributeValue(elem, "stopTime", "float") as number;
      g.type = getAttributeValue(elem, "type", "string") as GENERATORTYPE;
      g.mute = getAttributeValue(elem, "mute", "string") == "true";
      g.position = getAttributeValue(elem, "position", "int") as number;
      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  static validate(values: CMG, fileContents: CMGFile, oldName: string): string[]{
    const result: string[] = [];
    if (values.name == "") result.push("Name must not be blank");
    else {
      if (values.name != oldName) {
        for (let i = 0; i < fileContents.tracks.length; i++) {
          const t = fileContents.tracks[i];
          for (let j = 0; j < t.generators.length; j++) {
            if (t.generators[j].name == values.name) {
              result.push("A generator with that name already exists");
            }
          }
        }
      }
      if (values.startTime < 0 || values.stopTime <= values.startTime)
        result.push(
          "All times must be greater than zero and stop must be greater than start"
        );
      }
    return result;

  }
}
