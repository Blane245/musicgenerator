import { SoundFont2 } from "soundfont2";
import { Preset } from "../sfcomponents/types";
import {
  GENERATORTYPE,
  ModulationType,
  MODULATOR,
  ModulatorMap,
} from "../types";
import {
  addModulationAttributes,
  getAttributeValue,
  getModulationAttributes,
} from "../utils/xmlfunctions";
import CMG from "./cmg";
export default class SFPG extends CMG {
  presetName: string;
  preset: Preset | undefined;
  isLooping: boolean;
  duration: number; // msec
  noteM: ModulationType; // note modulation parameters
  volumeM: ModulationType; // volume modulation parameters
  panM: ModulationType; // pan modulation parameters
  constructor(nextGenerator: number) {
    super(nextGenerator);
    this.type = GENERATORTYPE.SFPG;
    this.presetName = "";
    this.preset = undefined;
    this.isLooping = true;
    this.duration = 0;
    this.noteM = {
      type: MODULATOR.SINE,
      center: 60,
      frequency: 1000,
      amplitude: 0,
      phase: 0,
    };
    this.volumeM = {
      type: MODULATOR.SINE,
      center: 0,
      frequency: 1000,
      amplitude: 0,
      phase: 0,
    };
    this.panM = {
      type: MODULATOR.SINE,
      center: 0,
      frequency: 1000,
      amplitude: 0,
      phase: 0,
    };
  }

  override copy(): SFPG {
    const n: SFPG = new SFPG(0);
    n.name = this.name;
    n.startTime = this.startTime;
    n.stopTime = this.stopTime;
    n.mute = this.mute;
    n.position = this.position;

    n.presetName = this.presetName;
    n.preset = this.preset;
    n.isLooping = this.isLooping;
    n.duration = this.duration;
    n.noteM = { ...this.noteM };
    n.volumeM = { ...this.volumeM };
    n.panM = { ...this.panM };
    return n;
  }

  override setAttribute(name: string, value: string): void {
    super.setAttribute(name, value);
    switch (name) {
      case "type":
        this.type = GENERATORTYPE.SFPG;
        break;
      case "presetName":
        this.presetName = value;
        break;
      case "isLooping":
        this.isLooping = value == "true";
        break;
      case "duration":
        this.duration = parseFloat(value);
        break;
      case "noteM.type":
        this.noteM.type = MODULATOR[value];
        break;
      case "noteM.center":
        this.noteM.center = parseFloat(value);
        break;
      case "noteM.frequency":
        this.noteM.frequency = parseFloat(value);
        break;
      case "noteM.amplitude":
        this.noteM.amplitude = parseFloat(value);
        break;
      case "noteM.phase":
        this.noteM.phase = parseFloat(value);
        break;
      case "volumeM.type":
        this.volumeM.type = MODULATOR[value];
        break;
      case "volumeM.center":
        this.volumeM.center = parseFloat(value);
        break;
      case "volumeM.frequency":
        this.volumeM.frequency = parseFloat(value);
        break;
      case "volumeM.amplitude":
        this.volumeM.amplitude = parseFloat(value);
        break;
      case "volumeM.phase":
        this.volumeM.phase = parseFloat(value);
        break;
      case "panM.type":
        this.panM.type = MODULATOR[value];
        break;
      case "panM.center":
        this.panM.center = parseFloat(value);
        break;
      case "panM.frequency":
        this.panM.frequency = parseFloat(value);
        break;
      case "panM.amplitude":
        this.panM.amplitude = parseFloat(value);
        break;
      case "panM.phase":
        this.panM.phase = parseFloat(value);
        break;
      default:
        break;
    }
  }

  getCurrentValues(time: number): {
    midi: number;
    volume: number;
    pan: number;
  } {
    let volume: number = this.volumeM.center;
    let pan: number = this.volumeM.center;
    let midi: number = this.noteM.center;
    const noteFunction = ModulatorMap.get(this.noteM.type);
    const volFunction = ModulatorMap.get(this.volumeM.type);
    const panFunction = ModulatorMap.get(this.panM.type);
    if (!noteFunction || !volFunction || !panFunction)
      return { midi, volume, pan };
    midi = noteFunction(
      time,
      this.noteM.center,
      this.noteM.frequency,
      this.noteM.amplitude,
      this.noteM.phase
    );
    volume = volFunction(
      time,
      this.volumeM.center,
      this.volumeM.frequency,
      this.volumeM.amplitude,
      this.volumeM.phase
    );
    pan = panFunction(
      time,
      this.panM.center,
      this.panM.frequency,
      this.panM.amplitude,
      this.panM.phase
    );
    return { midi, volume, pan };
  }
  override async appendXML(doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      const returnElem: Element = await super.appendXML(doc, elem);
      returnElem.setAttribute("type", GENERATORTYPE.SFPG);
      returnElem.setAttribute("presetName", this.presetName);
      returnElem.setAttribute("isLooping", this.isLooping ? "true" : "false");
      returnElem.setAttribute("duration", this.duration.toString());
      returnElem.appendChild(addModulationAttributes(doc, "noteM", this.noteM));
      returnElem.appendChild(
        addModulationAttributes(doc, "volumeM", this.volumeM)
      );
      returnElem.appendChild(addModulationAttributes(doc, "panM", this.panM));
      return Promise.resolve(returnElem);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }

  static override async getXML(
    elem: Element,
    version: string,
    soundFont: SoundFont2 | null
  ): Promise<SFPG> {
    try {
      const g: SFPG = new SFPG(0);
      g.name = getAttributeValue(elem, "name", "string") as string;
      g.startTime = getAttributeValue(elem, "startTime", "float") as number;
      g.stopTime = getAttributeValue(elem, "stopTime", "float") as number;
      g.type = getAttributeValue(elem, "type", "string") as GENERATORTYPE;
      g.mute = getAttributeValue(elem, "mute", "string") == "true";
      g.position = getAttributeValue(elem, "position", "int") as number;

      g.type = GENERATORTYPE.SFPG;
      g.presetName = getAttributeValue(elem, "presetName", "string") as string;
      const pn: string = g.presetName.split(":")[2];
      g.preset = soundFont
        ? (soundFont.presets.find((p) => p.header.name == pn) as Preset)
        : undefined;

      g.isLooping =
        (getAttributeValue(elem, "isLooping", "string") as string) == "true";
      g.duration = getAttributeValue(elem, "duration", "float") as number;
      g.mute = getAttributeValue(elem, "mute", "string") == "true";
      g.position = getAttributeValue(elem, "position", "int") as number;
      if (version < "2") {
        g.noteM.center = getAttributeValue(elem, "midi", "int") as number;
        g.noteM.type = getAttributeValue(elem, "FMType", "string") as MODULATOR;
        g.noteM.amplitude = getAttributeValue(
          elem,
          "FMAmplitude",
          "float"
        ) as number;
        g.noteM.frequency = getAttributeValue(
          elem,
          "FMFrequency",
          "float"
        ) as number;
        g.noteM.phase = getAttributeValue(elem, "FMPhase", "float") as number;
        g.volumeM.center = getAttributeValue(
          elem,
          "VMCenter",
          "float"
        ) as number;
        g.volumeM.type = getAttributeValue(
          elem,
          "VMType",
          "string"
        ) as MODULATOR;
        g.volumeM.amplitude = getAttributeValue(
          elem,
          "VMAmplitude",
          "float"
        ) as number;
        g.volumeM.frequency = getAttributeValue(
          elem,
          "VMFrequency",
          "float"
        ) as number;
        g.volumeM.phase = getAttributeValue(elem, "VMPhase", "float") as number;
        g.panM.center = getAttributeValue(elem, "PMCenter", "float") as number;
        g.panM.type = getAttributeValue(elem, "PMType", "string") as MODULATOR;
        g.panM.amplitude = getAttributeValue(
          elem,
          "PMAmplitude",
          "float"
        ) as number;
        g.panM.frequency = getAttributeValue(
          elem,
          "PMFrequency",
          "float"
        ) as number;
        g.panM.phase = getAttributeValue(elem, "PMPhase", "float") as number;
      } else {
        g.noteM = getModulationAttributes(elem, "noteM");
        g.volumeM = getModulationAttributes(elem, "volumeM");
        g.panM = getModulationAttributes(elem, "panM");
      }
      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
