import { Preset, SoundFont2 } from "soundfont2";
import CMG from "./cmg";
import {
  EuclideanValues,
  MarkovianValues,
  OscillatorValues,
  ParameterValues,
  WienerValues,
} from "./parametervalues";
import {
  EuclideanParameterTypes,
  GENERATORTYPE,
  MODULATOR,
  PARAMETERMODULATOR,
} from "../types";
import { presetNameToPreset } from "../sfcomponents/util";
import { getAttributeValue, getElementElement } from "../utils/xmlfunctions";
import CMGFile from "./cmgfile";
export default class Mixed extends CMG {
  soundFont: SoundFont2 | undefined;
  presetName: string;
  preset: Preset | undefined;
  isLooping: boolean;
  duration: number; // msec
  noteP: EuclideanParameterTypes; // note modulation parameters
  speedP: EuclideanParameterTypes; // speed modulation parameters
  volumeP: EuclideanParameterTypes; // volume modulation parameters
  panP: EuclideanParameterTypes; // pan modulation parameters
  constructor(nextGenerator: number) {
    super(nextGenerator);
    this.type = GENERATORTYPE.Mixed;
    this.presetName = "";
    this.preset = undefined;
    this.isLooping = true;
    this.duration = 0;
    this.noteP = new ParameterValues();
    this.speedP = new ParameterValues();
    this.volumeP = new ParameterValues();
    this.panP = new ParameterValues();
  }

  override copy(): Mixed {
    const n: Mixed = new Mixed(0);

    n.presetName = this.presetName;
    n.preset = this.preset;
    n.isLooping = this.isLooping;
    n.duration = this.duration;
    n.noteP = this.noteP;
    n.speedP = this.speedP;
    n.volumeP = this.volumeP;
    n.panP = this.panP;
    return n;
  }

  setSoundFont(soundFont: SoundFont2) {
    this.soundFont = soundFont;
    this.preset = presetNameToPreset(this.presetName, this.soundFont) as Preset;
  }

  override setAttribute(name: string, value: string): void {
    super.setAttribute(name, value);
    switch (name) {
      case "type":
        this.type = GENERATORTYPE.Mixed;
        break;
      case "presetName":
        this.presetName = value;
        this.preset = presetNameToPreset(value, this.soundFont) as Preset;
        break;
      case "isLooping":
        this.isLooping = value == "true";
        break;
      case "duration":
        this.duration = parseFloat(value);
        break;
    }

    // determine if the attribute is for one of the parameter sets
    // The parameter name is set off from the attribute name by a |
    const nameParts: string[] = name.split("|");
    if (nameParts.length <= 1) return;
    const parameter: string = nameParts[0];
    const pName: string = nameParts[1];
    switch (parameter) {
      case "noteP":
        this.noteP.setAttribute(pName, value);
        break;
      case "speedP":
        this.speedP.setAttribute(pName, value);
        break;
      case "volumeP":
        this.volumeP.setAttribute(pName, value);
        break;
      case "panP":
        this.panP.setAttribute(pName, value);
        break;
      default:
        break;
    }
  }

  getCurrentValues(time: number): {
    tone: number;
    speed: number;
    volume: number;
    pan: number;
  } {
    const tone: number = this.noteP.getCurrentValue(time);
    let speed: number = this.speedP.getCurrentValue(time);
    let volume: number = this.volumeP.getCurrentValue(time);
    let pan: number = this.panP.getCurrentValue(time);
    return { tone, speed, volume, pan };
  }

  override async appendXML(doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      const returnElem: Element = await super.appendXML(doc, elem);
      returnElem.setAttribute("type", GENERATORTYPE.SFPG);
      returnElem.setAttribute("presetName", this.presetName);
      returnElem.setAttribute("isLooping", this.isLooping ? "true" : "false");
      returnElem.setAttribute("duration", this.duration.toString());
      const notePChild = doc.createElement("noteP");
      const speedPChild = document.createElement("speedP");
      const volumePChild = document.createElement("volumeP");
      const panPChild = document.createElement("panP");
      await this.noteP.appendXML(doc, notePChild);
      await this.speedP.appendXML(doc, speedPChild);
      await this.volumeP.appendXML(doc, volumePChild);
      await this.speedP.appendXML(doc, panPChild);
      returnElem.appendChild(notePChild);
      returnElem.appendChild(speedPChild);
      returnElem.appendChild(volumePChild);
      returnElem.appendChild(panPChild);
      return Promise.resolve(returnElem);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }

  static override async getXML(
    elem: Element,
    version: string,
    soundFont: SoundFont2 | null
  ): Promise<Mixed> {
    try {
      const g: Mixed = new Mixed(0);
      g.name = getAttributeValue(elem, "name", "string") as string;
      g.startTime = getAttributeValue(elem, "startTime", "float") as number;
      g.stopTime = getAttributeValue(elem, "stopTime", "float") as number;
      g.type = getAttributeValue(elem, "type", "string") as GENERATORTYPE;
      g.mute = getAttributeValue(elem, "mute", "string") == "true";
      g.position = getAttributeValue(elem, "position", "int") as number;

      g.type = GENERATORTYPE.Mixed;
      g.presetName = getAttributeValue(elem, "presetName", "string") as string;
      if (soundFont) g.setSoundFont(soundFont);

      g.isLooping =
        (getAttributeValue(elem, "isLooping", "string") as string) == "true";
      g.duration = getAttributeValue(elem, "duration", "float") as number;

      // get the note, speed, volume, and pan parameter values
      const notePElem: Element = getElementElement(elem, "noteP");
      const speedPElem: Element = getElementElement(elem, "speedP");
      const volumePElem: Element = getElementElement(elem, "volumeP");
      const panPElem: Element = getElementElement(elem, "panP");
      const parameterArray: string[] = ["noteP", "speedP", "volumeP", "panP"];
      const parameterObjectArray: EuclideanParameterTypes[] = [
        g.noteP,
        g.speedP,
        g.volumeP,
        g.panP,
      ];
      const parameterElemArray: Element[] = [
        notePElem,
        speedPElem,
        volumePElem,
        panPElem,
      ];
      for (let i = 0; i < parameterArray.length; i++) {
        const parameterType: PARAMETERMODULATOR = getAttributeValue(
          parameterElemArray[i],
          "parameterType",
          "string"
        ) as PARAMETERMODULATOR;
        switch (parameterType) {
          case PARAMETERMODULATOR.Oscillator:
            {
              let n: OscillatorValues = new OscillatorValues();
              parameterObjectArray[i] = await n.getXML(
                parameterElemArray[i],
                version
              );
            }
            break;
          case PARAMETERMODULATOR.Markovian:
            {
              let n: MarkovianValues = new MarkovianValues();
              parameterObjectArray[i] = await n.getXML(
                parameterElemArray[i],
                version
              );
            }
            break;
          case PARAMETERMODULATOR.Euclidean:
            {
              let n: EuclideanValues = new EuclideanValues();
              parameterObjectArray[i] = await n.getXML(
                parameterElemArray[i],
                version
              );
            }
            break;
          case PARAMETERMODULATOR.Wiener:
            {
              let n: WienerValues = new WienerValues();
              parameterObjectArray[i] = await n.getXML(
                parameterElemArray[i],
                version
              );
            }
            break;
          default:
            break;
        }
      }

      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  static override validate(values: Mixed, fileContents: CMGFile, _oldName: string): string[]{
      const result: string[] = [];
      return result;
  
    }
  
}
