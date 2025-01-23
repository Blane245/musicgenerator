// a noise generator with different types of noise
// starting off with white and gaussian
//  the white noise generator uses a standard sample
//  rate and a nominal power level
//
// the daussian noise generator has a centeral frequency
// with a standard deviation
import {
  sawtoothModulator,
  sineModulator,
  squareModulator,
  triangleModulator,
} from "../modulators/index";
import { GENERATORTYPE, NOISETYPE, SAMPLERATE } from "../types";
import { gaussianRandom } from "../utils/gaussianrandom";
import { getAttributeValue } from "../utils/xmlfunctions";
import CMG from "./cmg";

export default class Noise extends CMG {
  noiseType: string;
  seed: string;
  mean: number; // center frequency for gaussian noise (Hz)
  std: number; // gaussian signal level noise standard devision (amplitude)
  sampleRate: number;
  duration: number; // ms
  VMType: string;
  VMCenter: number; // 0 100
  VMFrequency: number; // mHz
  VMAmplitude: number; // -5, +5
  VMPhase: number; // degrees
  PMType: string;
  PMCenter: number; // -1, +1
  PMFrequency: number; // mHz
  PMAmplitude: number; // 0 1 (center applied, center +- amplitude cannot be outside -1, 1)
  PMPhase: number; // degrees

  constructor(next: number) {
    super(next);
    this.type = GENERATORTYPE.Noise;
    this.seed = this.name;
    this.noiseType = NOISETYPE.white;
    this.mean = 440;
    this.std = 0;
    this.sampleRate = SAMPLERATE;
    this.duration = 0;
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
    switch (this.PMType) {
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
    return { sample: sample, volume: volume, pan: pan };
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
      returnElement.setAttribute("VMType", this.VMType.toString());
      returnElement.setAttribute("VMCenter", this.VMCenter.toString());
      returnElement.setAttribute("VMFrequency", this.VMFrequency.toString());
      returnElement.setAttribute("VMAmplitude", this.VMAmplitude.toString());
      returnElement.setAttribute("VMPhase", this.VMPhase.toString());
      returnElement.setAttribute("PMType", this.PMType.toString());
      returnElement.setAttribute("PMCenter", this.PMCenter.toString());
      returnElement.setAttribute("PMFrequency", this.PMFrequency.toString());
      returnElement.setAttribute("PMAmplitude", this.PMAmplitude.toString());
      returnElement.setAttribute("PMPhase", this.PMPhase.toString());
      return Promise.resolve(returnElement);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }

  static override async getXML(elem: Element): Promise<Noise> {
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
