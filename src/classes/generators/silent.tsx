// base class for all generator types

import CMGFile from "classes/cmgfile";
import Track from "classes/track";
import { GENERATORTYPE } from "types";
import { getAttributeValueWithDefault } from "utils/xmlfunctions";

// contains properties used all generators
export default class Silent {
  name: string; // the unique name of the generator
  parent: Track; // owner of the generator
  startTime: number; // time (seconds) that the generator starts
  stopTime: number; // time (seconds) that the generator stops
  type: GENERATORTYPE;
  mute: boolean;
  position: number; // the vertical location of the generator icon on the track timeline

  constructor(nextGenerator: number, parent: Track) {
    this.name = "G".concat(nextGenerator.toString());
    this.parent = parent;
    this.startTime = 0;
    this.stopTime = 0;
    this.type = GENERATORTYPE.Silent;
    this.mute = false;
    this.position = 0;
  }

  copy(parent: Track): Silent {
    const newCMG = new Silent(0, parent);
    newCMG.name = this.name;
    newCMG.startTime = this.startTime;
    newCMG.stopTime = this.stopTime;
    newCMG.mute = this.mute;
    newCMG.position = this.position;
    return newCMG;
  }

  setAttribute(name: string, value: string): boolean {
    switch (name) {
      case "name":
        this.name = value;
        return true;
      case "type":
        this.type = GENERATORTYPE.Silent;
        return true;
      case "startTime": {
        const interval: number = this.stopTime - this.startTime;
        this.startTime = parseFloat(value);
        this.stopTime = this.startTime + interval;
        return true;
      }
      case "stopTime":
        this.stopTime = parseFloat(value);
        return true;
      case "mute":
        this.mute = value == "true";
        return true;

      default:
        return false;
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
      returnElem.setAttribute("position", this.position.toString());
      return Promise.resolve(returnElem);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  static async getXML(
    elem: Element,
    _version: string,
    parent: Track,
  ): Promise<Silent> {
    try {
      const g: Silent = new Silent(0, parent);
      g.name = getAttributeValueWithDefault(
        elem,
        "name",
        "string",
        "",
      ) as string;
      g.startTime = getAttributeValueWithDefault(
        elem,
        "startTime",
        "float",
        0,
      ) as number;
      g.stopTime = getAttributeValueWithDefault(
        elem,
        "stopTime",
        "float",
        0,
      ) as number;
      g.type = getAttributeValueWithDefault(
        elem,
        "type",
        "string",
        GENERATORTYPE.Silent,
      ) as GENERATORTYPE;
      g.mute =
        getAttributeValueWithDefault(elem, "mute", "string", false) == "true";
      g.position = getAttributeValueWithDefault(
        elem,
        "position",
        "float",
        0,
      ) as number;
      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // validate the user-supplied values of the generator
  static validate(
    values: Silent,
    fileContents: CMGFile,
    oldName: string,
  ): string[] {
    const errors: string[] = [];
    if (values.name == "") errors.push("Name must not be blank");
    if (values.name != oldName) {
      for (let i = 0; i < fileContents.tracks.length; i++) {
        const t = fileContents.tracks[i];
        for (let j = 0; j < t.generators.length; j++) {
          if (t.generators[j].name == values.name) {
            errors.push("A generator with that name already exists");
          }
        }
      }
    }
    if (values.startTime < 0 || values.stopTime <= values.startTime)
      errors.push(
        "All times must be greater than zero and stop must be greater than start",
      );

    return errors;
  }
}
