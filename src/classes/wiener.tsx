// a Wiener sequence generator class
import { SoundFont2 } from "soundfont2";
import { Preset } from "../sfcomponents/types";
import { GENERATORTYPE, WienerParameters } from "../types";
import { wienerPoint } from "../utils/wienerpoint";
import { getAttributeValue, getElementElement } from "../utils/xmlfunctions";
import CMG from "./cmg";

export default class Wiener extends CMG {
  presetName: string;
  preset: Preset | undefined;
  isLooping: boolean;
  seed: string;
  speed: WienerParameters;
  pitch: WienerParameters;
  volume: WienerParameters;
  pan: WienerParameters;

  constructor(nextGenerator: number) {
    super(nextGenerator);
    this.type = GENERATORTYPE.Wiener;
    this.presetName = "";
    this.preset = undefined;
    this.isLooping = true;
    this.seed = this.name;
    this.speed = { initialValue: 60, alpha: 0, sigma: 0, lo: 1, hi: 500 };
    this.pitch = { initialValue: 60, alpha: 0, sigma: 0, lo: 0, hi: 127 };
    this.volume = { initialValue: 0, alpha: 0, sigma: 0, lo: -5, hi: 5 };
    this.pan = { initialValue: 0, alpha: 0, sigma: 0, lo: -1, hi: 1 };
  }
  override copy(): Wiener {
    const n = new Wiener(0);
    n.name = this.name;
    n.startTime = this.startTime;
    n.stopTime = this.stopTime;
    n.mute = this.mute;
    n.position = this.position;

    n.seed = this.seed;
    n.presetName = this.presetName;
    n.preset = this.preset;
    n.isLooping = this.isLooping;
    n.speed = { ...this.speed };
    n.pitch = { ...this.pitch };
    n.volume = { ...this.volume };
    n.pan = { ...this.pan };
    return n;
  }
  override setAttribute(name: string, value: string): void {
    super.setAttribute(name, value);
    switch (name) {
      case "type":
        this.type = GENERATORTYPE.Wiener;
        break;
      case "seed":
        this.seed = value;
        break;
      case "presetName":
        this.presetName = value;
        break;
      case "isLooping":
        this.isLooping = value == "true";
        break;
      case "pitch.initialValue":
        this.pitch.initialValue = parseFloat(value);
        break;
      case "pitch.alpha":
        this.pitch.alpha = parseFloat(value);
        break;
      case "pitch.sigma":
        this.pitch.sigma = parseFloat(value);
        break;
      case "pitch.lo":
        this.pitch.lo = parseFloat(value);
        break;
      case "pitch.hi":
        this.pitch.hi = parseFloat(value);
        break;
      case "speed.initialValue":
        this.speed.initialValue = parseFloat(value);
        break;
      case "speed.alpha":
        this.speed.alpha = parseFloat(value);
        break;
      case "speed.sigma":
        this.speed.sigma = parseFloat(value);
        break;
      case "speed.lo":
        this.speed.lo = parseFloat(value);
        break;
      case "speed.hi":
        this.speed.hi = parseFloat(value);
        break;
      case "volume.initialValue":
        this.volume.initialValue = parseFloat(value);
        break;
      case "volume.alpha":
        this.volume.alpha = parseFloat(value);
        break;
      case "volume.sigma":
        this.volume.sigma = parseFloat(value);
        break;
      case "volume.lo":
        this.volume.lo = parseFloat(value);
        break;
      case "volume.hi":
        this.volume.hi = parseFloat(value);
        break;
      case "pan.initialValue":
        this.pan.initialValue = parseFloat(value);
        break;
      case "pan.alpha":
        this.pan.alpha = parseFloat(value);
        break;
      case "pan.sigma":
        this.pan.sigma = parseFloat(value);
        break;
      case "pan.lo":
        this.pan.lo = parseFloat(value);
        break;
      case "pan.hi":
        this.pan.hi = parseFloat(value);
        break;
    }
  }

  getCurrentValues(time: number): {
    speed: number;
    pitch: number;
    volume: number;
    pan: number;
  } {
    return {
      speed: wienerPoint(
        time,
        this.speed.initialValue,
        this.speed.alpha,
        this.speed.sigma,
        this.speed.lo,
        this.speed.hi
      ),
      pitch: wienerPoint(
        time,
        this.pitch.initialValue,
        this.pitch.alpha,
        this.pitch.sigma,
        this.pitch.lo,
        this.pitch.hi
      ),
      volume: wienerPoint(
        time,
        this.volume.initialValue,
        this.volume.alpha,
        this.volume.sigma,
        this.volume.lo,
        this.volume.hi
      ),
      pan: wienerPoint(
        time,
        this.pan.initialValue,
        this.pan.alpha,
        this.pan.sigma,
        this.pan.lo,
        this.pan.hi
      ),
    };
  }

  override async appendXML(doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      const returnElem: Element = await super.appendXML(doc, elem);
      returnElem.setAttribute("type", GENERATORTYPE.Wiener);
      returnElem.setAttribute("seed", this.seed);
      returnElem.setAttribute("presetName", this.presetName);
      returnElem.setAttribute("isLooping", this.isLooping ? "true" : "false");
      returnElem.appendChild(addWienerAttributes("speed", this.speed));
      returnElem.appendChild(addWienerAttributes("pitch", this.pitch));
      returnElem.appendChild(addWienerAttributes("volume", this.volume));
      returnElem.appendChild(addWienerAttributes("pan", this.pan));
      return Promise.resolve(returnElem);
    } catch (e: any) {
      return Promise.reject(e);
    }

    function addWienerAttributes(
      name: string,
      sequence: WienerParameters
    ): Element {
      const sElement: Element = doc.createElement(name);
      sElement.setAttribute("initialValue", sequence.initialValue.toString());
      sElement.setAttribute("alpha", sequence.alpha.toString());
      sElement.setAttribute("sigma", sequence.sigma.toString());
      sElement.setAttribute("lo", sequence.lo.toString());
      sElement.setAttribute("hi", sequence.hi.toString());
      return sElement;
    }
  }

  static override async getXML(
    elem: Element,
    soundFont: SoundFont2 | null
  ): Promise<Wiener> {
    try {
      const g: Wiener = new Wiener(0);
      g.name = getAttributeValue(elem, "name", "string") as string;
      g.startTime = getAttributeValue(elem, "startTime", "float") as number;
      g.stopTime = getAttributeValue(elem, "stopTime", "float") as number;
      g.type = getAttributeValue(elem, "type", "string") as GENERATORTYPE;
      g.mute = getAttributeValue(elem, "mute", "string") == "true";
      g.position = getAttributeValue(elem, "position", "int") as number;

      g.presetName = getAttributeValue(elem, "presetName", "string") as string;
      const pn: string = g.presetName.split(":")[2];
      g.preset = soundFont
        ? (soundFont.presets.find((p) => p.header.name == pn) as Preset)
        : undefined;
      g.isLooping =
        (getAttributeValue(elem, "isLooping", "string") as string) == "true";
      g.seed = getAttributeValue(elem, "seed", "string") as string;
      const speedElem: Element = getElementElement(elem, "speed");
      const pitchElem: Element = getElementElement(elem, "pitch");
      const volumeElem: Element = getElementElement(elem, "volume");
      const panElem: Element = getElementElement(elem, "pan");

      g.speed = getParameters(speedElem);
      g.pitch = getParameters(pitchElem);
      g.volume = getParameters(volumeElem);
      g.pan = getParameters(panElem);
      return Promise.resolve(g);

      function getParameters(elem: Element): WienerParameters {
        const result: WienerParameters = {
          initialValue: 0,
          alpha: 0,
          sigma: 0,
          lo: 0,
          hi: 0,
        };
        result.initialValue = getAttributeValue(elem, "initialValue", "float") as number;
        result.alpha = getAttributeValue(elem, "alpha", "float") as number;
        result.sigma = getAttributeValue(elem, "sigma", "float") as number;
        result.lo = getAttributeValue(elem, "lo", "float") as number;
        result.hi = getAttributeValue(elem, "hi", "float") as number;
        return result;
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
