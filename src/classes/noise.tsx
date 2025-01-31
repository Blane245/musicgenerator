// a noise generator with different types of noise
// starting off with white and gaussian
//  the white noise generator uses a standard sample
//  rate and a nominal power level
//
// the daussian noise generator has a centeral frequency
// with a standard deviation
import {
  GENERATORTYPE,
  ModulationType,
  MODULATOR,
  ModulatorMap,
  NOISETYPE,
  SAMPLERATE,
} from "../types";
import { gaussianRandom } from "../utils/gaussianrandom";
import {
  addModulationAttributes,
  getAttributeValue,
  getModulationAttributes,
} from "../utils/xmlfunctions";
import CMG from "./cmg";

export default class Noise extends CMG {
  noiseType: string;
  seed: string;
  mean: number; // center frequency for gaussian noise (Hz)
  std: number; // gaussian signal level noise standard devision (amplitude)
  sampleRate: number;
  duration: number; // ms
  volumeM: ModulationType;
  panM: ModulationType;

  constructor(next: number) {
    super(next);
    this.type = GENERATORTYPE.Noise;
    this.seed = this.name;
    this.noiseType = NOISETYPE.white;
    this.mean = 440;
    this.std = 0;
    this.sampleRate = SAMPLERATE;
    this.duration = 0;
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

  override copy(): Noise {
    const n = new Noise(0);
    n.name = this.name;
    n.startTime = this.startTime;
    n.stopTime = this.stopTime;
    n.mute = this.mute;
    n.position = this.position;

    n.seed = this.seed;
    n.noiseType = this.noiseType;
    n.mean = this.mean;
    n.std = this.std;
    n.sampleRate = this.sampleRate;
    n.duration = this.duration;
    n.volumeM = { ...this.volumeM };
    n.panM = { ...this.panM };
    return n;
  }

  override setAttribute(name: string, value: string): void {
    super.setAttribute(name, value);
    switch (name) {
      case "type":
        this.type = GENERATORTYPE.Noise;
        break;
      case "noiseType":
        this.noiseType = value;
        break;
      case "seed":
        this.seed = value;
        break;
      case "mean":
        this.mean = parseFloat(value);
        break;
      case "std":
        this.std = parseFloat(value);
        break;
      case "sampleRate":
        this.sampleRate = parseFloat(value);
        break;
      case "duration":
        this.duration = parseFloat(value);
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
    }
  }

  // return noise for length of time specified
  getCurrentValues(
    time: number,
    timeInterval: number
  ): { sample: Float32Array; volume: number; pan: number } {
    const sampleCount = timeInterval * this.sampleRate;
    const timeStep: number = 1 / this.sampleRate;
    const sample: Float32Array = new Float32Array(sampleCount);
    if (this.noiseType == NOISETYPE.white) {
      // white noise generator
      for (let i = 0; i < sampleCount; i++) {
        // sample[i] = (rand() - 0.5);
        sample[i] = Math.random() - 0.5;
      }
    } else if (this.noiseType == NOISETYPE.gaussian) {
      // gaussian noise generator
      for (let i = 0; i < sampleCount; i++) {
        const noise: number = gaussianRandom(0.0, this.std);
        const freq = this.mean;
        const deltaT: number = i * timeStep + time;
        sample[i] = Math.cos(2.0 * Math.PI * freq * deltaT) + noise;
        if (i == 0) {
        }
      }
    }
    let volume: number = this.volumeM.center;
    let pan: number = this.volumeM.center;
    const volFunction = ModulatorMap.get(this.volumeM.type);
    const panFunction = ModulatorMap.get(this.panM.type);
    if (!volFunction || !panFunction) return { sample, volume, pan };
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

    return { sample, volume, pan };
  }

  override async appendXML(doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      const returnElement: Element = await super.appendXML(doc, elem);
      super.appendXML(doc, returnElement);
      returnElement.setAttribute("type", GENERATORTYPE.Noise);
      returnElement.setAttribute("seed", this.seed);
      returnElement.setAttribute("noiseType", this.noiseType);
      returnElement.setAttribute("mean", this.mean.toString());
      returnElement.setAttribute("std", this.std.toString());
      returnElement.setAttribute("sampleRate", this.sampleRate.toString());
      returnElement.setAttribute("duration", this.duration.toString());
      returnElement.appendChild(
        addModulationAttributes(doc, "volumeM", this.volumeM)
      );
      returnElement.appendChild(
        addModulationAttributes(doc, "panM", this.panM)
      );
      return Promise.resolve(returnElement);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }

  static override async getXML(elem: Element, version: string): Promise<Noise> {
    try {
      const g = new Noise(0);
      g.name = getAttributeValue(elem, "name", "string") as string;
      g.startTime = getAttributeValue(elem, "startTime", "float") as number;
      g.stopTime = getAttributeValue(elem, "stopTime", "float") as number;
      g.type = getAttributeValue(elem, "type", "string") as GENERATORTYPE;
      g.mute = getAttributeValue(elem, "mute", "string") == "true";
      g.position = getAttributeValue(elem, "position", "int") as number;

      g.noiseType = getAttributeValue(elem, "noiseType", "string") as string;
      g.seed = getAttributeValue(elem, "seed", "string") as string;
      g.mean = getAttributeValue(elem, "mean", "float") as number;
      g.std = getAttributeValue(elem, "std", "float") as number;
      g.sampleRate = getAttributeValue(elem, "sampleRate", "float") as number;
      g.duration = getAttributeValue(elem, "duration", "float") as number;
      if (version < "2") {
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
        g.panM.center = getAttributeValue(elem, "VMCenter", "float") as number;
        g.panM.type = getAttributeValue(elem, "VMType", "string") as MODULATOR;
        g.panM.amplitude = getAttributeValue(
          elem,
          "VMAmplitude",
          "float"
        ) as number;
        g.panM.frequency = getAttributeValue(
          elem,
          "VMFrequency",
          "float"
        ) as number;
        g.panM.phase = getAttributeValue(elem, "VMPhase", "float") as number;
      } else {
        g.volumeM = getModulationAttributes(elem, "volumeM");
        g.panM = getModulationAttributes(elem, "panM");
      }
      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
