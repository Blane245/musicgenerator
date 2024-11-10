import { sawtoothModulator } from "../components/modulators/sawtoothmodulator";
import { sineModulator } from "../components/modulators/sinemodulator";
import { squareModulator } from "../components/modulators/squaremodulator";
import { triangleModulator } from "../components/modulators/trianglemodulator";
import { Preset } from "../types/soundfonttypes";
import { GENERATORTYPE, REPEATOPTION } from "../types/types";
import { getAttributeValue } from "../utils/xmlfunctions";
import CMG from "./cmg";
import InstReverb from "./instreverb";
export default class SFPG extends CMG {
  presetName: string;
  preset: Preset | undefined;
  repeat: REPEATOPTION;
  midi: number;
  FMType: string;
  FMAmplitude: number; // cents
  FMFrequency: number; // hz
  FMPhase: number; // degrees
  VMType: string;
  VMCenter: number; // 0 100
  VMFrequency: number; // hz
  VMAmplitude: number; // 0 - 100
  VMPhase: number; // degrees
  PMType: string;
  PMCenter: number; // -50, 50
  PMFrequency: number; // hz
  PMAmplitude: number; // -50 50 (center applied, center +- amplitude cannot be outside -1, 1)
  PMPhase: number; // degrees
  constructor(nextGenerator: number) {
    super(nextGenerator);
    this.type = GENERATORTYPE.SFPG;
    this.presetName = "";
    this.preset = undefined;
    this.repeat = REPEATOPTION.Sample;
    this.midi = 0;
    this.reverb = new InstReverb(this.name.concat('reverb'));
    this.FMType = "SINE";
    this.FMAmplitude = 0;
    this.FMFrequency = 0;
    this.FMPhase = 0;
    this.VMType = "SINE";
    this.VMCenter = 50;
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
    n.solo = this.solo;
    n.position = this.position;
    n.reverb = this.reverb.copy();

    n.presetName = this.presetName;
    n.preset = this.preset;
    n.midi = this.midi;
    n.reverb = this.reverb;
    n.repeat = this.repeat;
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
      case "repeat":
        this.repeat = value as REPEATOPTION;
        break;
      case "midi":
        this.midi = parseFloat(value);
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
    this.reverb.setAttribute(name, value)
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
    let pan: number = this.VMCenter;
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
  override appendXML(doc: XMLDocument, elem: Element): void {
    super.appendXML(doc, elem);
    elem.setAttribute("type", GENERATORTYPE.SFPG);
    elem.setAttribute("presetName", this.presetName);
    elem.setAttribute("repeat", this.repeat);
    elem.setAttribute("midi", this.midi.toString());
    elem.setAttribute("FMType", this.FMType.toString());
    elem.setAttribute("FMAmplitude", this.FMAmplitude.toString());
    elem.setAttribute("FMFrequency", this.FMFrequency.toString());
    elem.setAttribute("FMPhase", this.FMPhase.toString());
    elem.setAttribute("VMType", this.VMType.toString());
    elem.setAttribute("VMCenter", this.VMCenter.toString());
    elem.setAttribute("VMFrequency", this.VMFrequency.toString());
    elem.setAttribute("VMAmplitude", this.VMAmplitude.toString());
    elem.setAttribute("VMPhase", this.VMPhase.toString());
    elem.setAttribute("PMType", this.PMType.toString());
    elem.setAttribute("PMCenter", this.PMCenter.toString());
    elem.setAttribute("PMFrequency", this.PMFrequency.toString());
    elem.setAttribute("PMAmplitude", this.PMAmplitude.toString());
    elem.setAttribute("PMPhase", this.PMPhase.toString());
    this.reverb.appendXML(doc, elem);
  }

  override getXML(elem: Element): void {
    super.getXML(elem);
    this.type = GENERATORTYPE.SFPG;
    this.presetName = getAttributeValue(elem, "presetName", "string") as string;
    this.repeat = getAttributeValue(elem, "repeat", "string") as REPEATOPTION;
    this.midi = getAttributeValue(elem, "midi", "int") as number;
    this.mute = getAttributeValue(elem, "mute", "string") == "true";
    this.position = getAttributeValue(elem, "position", "int") as number;
    this.FMType = getAttributeValue(elem, "FMType", "string") as string;
    this.FMAmplitude = getAttributeValue(
      elem,
      "FMAmplitude",
      "float"
    ) as number;
    this.FMFrequency = getAttributeValue(
      elem,
      "FMFrequency",
      "float"
    ) as number;
    this.FMPhase = getAttributeValue(elem, "FMPhase", "float") as number;
    this.VMCenter = getAttributeValue(elem, "VMCenter", "float") as number;
    this.VMType = getAttributeValue(elem, "VMType", "string") as string;
    this.VMAmplitude = getAttributeValue(
      elem,
      "VMAmplitude",
      "float"
    ) as number;
    this.VMFrequency = getAttributeValue(
      elem,
      "VMFrequency",
      "float"
    ) as number;
    this.VMPhase = getAttributeValue(elem, "VMPhase", "float") as number;
    this.PMCenter = getAttributeValue(elem, "PMCenter", "float") as number;
    this.PMType = getAttributeValue(elem, "PMType", "string") as string;
    this.PMAmplitude = getAttributeValue(
      elem,
      "PMAmplitude",
      "float"
    ) as number;
    this.PMFrequency = getAttributeValue(
      elem,
      "PMFrequency",
      "float"
    ) as number;
    this.PMPhase = getAttributeValue(elem, "PMPhase", "float") as number;
    this.reverb.getXML(elem);
  }
}
