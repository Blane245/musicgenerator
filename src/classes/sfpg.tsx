import { SoundFont2 } from "soundfont2";
import {
  sawtoothModulator,
  sineModulator,
  squareModulator,
  triangleModulator,
} from "../modulators/index";
import { Preset } from "../sfcomponents/types";
import { GENERATORTYPE } from "../types";
import { getAttributeValue } from "../utils/xmlfunctions";
import CMG from "./cmg";
export default class SFPG extends CMG {
  presetName: string;
  preset: Preset | undefined;
  isLooping: boolean;
  midi: number;
  duration: number; // msec
  FMType: string;
  FMAmplitude: number; // cents
  FMFrequency: number; // mHz
  FMPhase: number; // degrees
  VMType: string;
  VMCenter: number; // 0 100
  VMFrequency: number; // mHz
  VMAmplitude: number; // -5, 5
  VMPhase: number; // degrees
  PMType: string;
  PMCenter: number; // -1, 1
  PMFrequency: number; // mHz
  PMAmplitude: number; // 0 - 1 (center applied, center +- amplitude cannot be outside -1, 1)
  PMPhase: number; // degrees
  constructor(nextGenerator: number) {
    super(nextGenerator);
    this.type = GENERATORTYPE.SFPG;
    this.presetName = "";
    this.preset = undefined;
    this.isLooping = true;
    this.midi = 0;
    this.duration = 0;
    this.FMType = "SINE";
    this.FMAmplitude = 0;
    this.FMFrequency = 0;
    this.FMPhase = 0;
    this.VMType = "SINE";
    this.VMCenter = 0;
    this.VMFrequency = 0;
    this.VMAmplitude = 0;
    this.VMPhase = 0;
    this.PMType = "SINE";
    this.PMFrequency = 0;
    this.PMAmplitude = 0;
    this.PMCenter = 0;
    this.PMPhase = 0;
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
    n.midi = this.midi;
    n.isLooping = this.isLooping;
    n.duration = this.duration;
    n.FMType = this.FMType;
    n.FMAmplitude = this.FMAmplitude;
    n.FMFrequency = this.FMFrequency;
    n.FMPhase = this.FMPhase;
    n.VMCenter = this.VMCenter;
    n.VMType = this.VMType;
    n.VMAmplitude = this.VMAmplitude;
    n.VMFrequency = this.VMFrequency;
    n.VMPhase = this.VMPhase;
    n.PMCenter = this.PMCenter;
    n.PMType = this.PMType;
    n.PMAmplitude = this.PMAmplitude;
    n.PMFrequency = this.PMFrequency;
    n.PMPhase = this.PMPhase;
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
      case "midi":
        this.midi = parseFloat(value);
        break;
      case "duration":
        this.duration = parseFloat(value);
        break;
      case "FMType":
        this.FMType = value;
        break;
      case "FMAmplitude":
        this.FMAmplitude = parseFloat(value);
        break;
      case "FMFrequency":
        this.FMFrequency = parseFloat(value);
        break;
      case "FMPhase":
        this.FMPhase = parseFloat(value);
        break;
      case "VMCenter":
        this.VMCenter = parseFloat(value);
        break;
      case "VMType":
        this.VMType = value;
        break;
      case "VMAmplitude":
        this.VMAmplitude = parseFloat(value);
        break;
      case "VMFrequency":
        this.VMFrequency = parseFloat(value);
        break;
      case "VMPhase":
        this.VMPhase = parseFloat(value);
        break;
      case "PMCenter":
        this.PMCenter = parseFloat(value);
        break;
      case "PMType":
        this.PMType = value;
        break;
      case "PMAmplitude":
        this.PMAmplitude = parseFloat(value);
        break;
      case "PMFrequency":
        this.PMFrequency = parseFloat(value);
        break;
      case "PMPhase":
        this.PMPhase = parseFloat(value);
        break;
      default:
        break;
    }
  }

  getCurrentValues(time: number): {
    pitch: number;
    volume: number;
    pan: number;
  } {
    let pitch: number = this.midi;
    switch (this.FMType) {
      case "SINE":
        pitch = sineModulator(
          time,
          this.midi,
          this.FMFrequency,
          this.FMAmplitude,
          this.FMPhase
        );
        break;
      case "SAWTOOTH":
        pitch = sawtoothModulator(
          time,
          this.midi,
          this.FMFrequency,
          this.FMAmplitude,
          this.FMPhase
        );
        break;
      case "SQUARE":
        pitch = squareModulator(
          time,
          this.midi,
          this.FMFrequency,
          this.FMAmplitude,
          this.FMPhase
        );
        break;
      case "TRIANGLE":
        pitch = triangleModulator(
          time,
          this.midi,
          this.FMFrequency,
          this.FMAmplitude,
          this.FMPhase
        );
        break;
    }
    let volume: number = this.VMCenter;
    switch (this.VMType) {
      case "SINE":
        volume = sineModulator(
          time,
          this.VMCenter,
          this.VMFrequency,
          this.VMAmplitude,
          this.VMPhase
        );
        break;
      case "SAWTOOTH":
        volume = sawtoothModulator(
          time,
          this.VMCenter,
          this.VMFrequency,
          this.VMAmplitude,
          this.VMPhase
        );
        break;
      case "SQUARE":
        volume = squareModulator(
          time,
          this.VMCenter,
          this.VMFrequency,
          this.VMAmplitude,
          this.VMPhase
        );
        break;
      case "TRIANGLE":
        volume = triangleModulator(
          time,
          this.VMCenter,
          this.VMFrequency,
          this.VMAmplitude,
          this.VMPhase
        );
        break;
    }
    let pan: number = this.PMCenter;
    switch (this.VMType) {
      case "SINE":
        pan = sineModulator(
          time,
          this.PMCenter,
          this.PMFrequency,
          this.PMAmplitude,
          this.PMPhase
        );
        break;
      case "SAWTOOTH":
        pan = sawtoothModulator(
          time,
          this.PMCenter,
          this.PMFrequency,
          this.PMAmplitude,
          this.PMPhase
        );
        break;
      case "SQUARE":
        pan = squareModulator(
          time,
          this.PMCenter,
          this.PMFrequency,
          this.PMAmplitude,
          this.PMPhase
        );
        break;
      case "TRIANGLE":
        pan = triangleModulator(
          time,
          this.PMCenter,
          this.PMFrequency,
          this.PMAmplitude,
          this.PMPhase
        );
        break;
    }
    return { pitch: pitch, volume: volume, pan: pan };
  }
  override async appendXML(doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      const returnElem: Element = await super.appendXML(doc, elem);
      returnElem.setAttribute("type", GENERATORTYPE.SFPG);
      returnElem.setAttribute("presetName", this.presetName);
      returnElem.setAttribute("isLooping", this.isLooping ? "true" : "false");
      returnElem.setAttribute("midi", this.midi.toString());
      returnElem.setAttribute("duration", this.duration.toString());
      returnElem.setAttribute("FMType", this.FMType.toString());
      returnElem.setAttribute("FMAmplitude", this.FMAmplitude.toString());
      returnElem.setAttribute("FMFrequency", this.FMFrequency.toString());
      returnElem.setAttribute("FMPhase", this.FMPhase.toString());
      returnElem.setAttribute("VMType", this.VMType.toString());
      returnElem.setAttribute("VMCenter", this.VMCenter.toString());
      returnElem.setAttribute("VMFrequency", this.VMFrequency.toString());
      returnElem.setAttribute("VMAmplitude", this.VMAmplitude.toString());
      returnElem.setAttribute("VMPhase", this.VMPhase.toString());
      returnElem.setAttribute("PMType", this.PMType.toString());
      returnElem.setAttribute("PMCenter", this.PMCenter.toString());
      returnElem.setAttribute("PMFrequency", this.PMFrequency.toString());
      returnElem.setAttribute("PMAmplitude", this.PMAmplitude.toString());
      returnElem.setAttribute("PMPhase", this.PMPhase.toString());
      return Promise.resolve(returnElem);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }

  static override async getXML(elem: Element, soundFont: SoundFont2 | null): Promise<SFPG> {
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
      g.preset = soundFont? soundFont.presets.find((p) => p.header.name == pn) as Preset : undefined;

      g.isLooping =
        (getAttributeValue(elem, "isLooping", "string") as string) == "true";
      g.midi = getAttributeValue(elem, "midi", "int") as number;
      g.duration = getAttributeValue(elem, "duration", "float") as number;
      g.mute = getAttributeValue(elem, "mute", "string") == "true";
      g.position = getAttributeValue(elem, "position", "int") as number;
      g.FMType = getAttributeValue(elem, "FMType", "string") as string;
      g.FMAmplitude = getAttributeValue(elem, "FMAmplitude", "float") as number;
      g.FMFrequency = getAttributeValue(elem, "FMFrequency", "float") as number;
      g.FMPhase = getAttributeValue(elem, "FMPhase", "float") as number;
      g.VMCenter = getAttributeValue(elem, "VMCenter", "float") as number;
      g.VMType = getAttributeValue(elem, "VMType", "string") as string;
      g.VMAmplitude = getAttributeValue(elem, "VMAmplitude", "float") as number;
      g.VMFrequency = getAttributeValue(elem, "VMFrequency", "float") as number;
      g.VMPhase = getAttributeValue(elem, "VMPhase", "float") as number;
      g.PMCenter = getAttributeValue(elem, "PMCenter", "float") as number;
      g.PMType = getAttributeValue(elem, "PMType", "string") as string;
      g.PMAmplitude = getAttributeValue(elem, "PMAmplitude", "float") as number;
      g.PMFrequency = getAttributeValue(elem, "PMFrequency", "float") as number;
      g.PMPhase = getAttributeValue(elem, "PMPhase", "float") as number;
      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
