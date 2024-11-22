import InstReverb from "classes/instreverb2";
import CMG from "../classes/cmg";
import Noise from "../classes/noise";
import SFPG from "../classes/sfpg";
import SFRG from "../classes/sfrg";

export const SAMPLERATE: number = 44100;

export const CHUNKTIME: number = 0.1;

export const EPS: number = 1e-4;

export type CMGeneratorType = CMG | SFPG | SFRG | Noise;

export type SFFile = { name: string };

export type SFFiles = SFFiles[];

export enum REPEATOPTION {
  "None" = "None",
  "Sample" = "Sample",
  "Beginning" = "Beginning",
}

export enum MODULATOR {
  "SINE",
  "SQUARE",
  "TRIANGLE",
  "SAWTOOTH",
}

export enum TIMEFORMATTYPE {
  NUMBER,
  TIME,
}

export type TimeFormat = {
  value: string;
  type: TIMEFORMATTYPE;
};

export const TIMEFORMATS: TimeFormat[] = [
  { value: "0.000000", type: TIMEFORMATTYPE.NUMBER },
  { value: "0.0000", type: TIMEFORMATTYPE.NUMBER },
  { value: "0.000", type: TIMEFORMATTYPE.NUMBER },
  { value: "0.00", type: TIMEFORMATTYPE.NUMBER },
  { value: "0.0", type: TIMEFORMATTYPE.NUMBER },
  { value: "00.0", type: TIMEFORMATTYPE.NUMBER },
  { value: "0:00", type: TIMEFORMATTYPE.TIME },
  { value: "00:00", type: TIMEFORMATTYPE.TIME },
  { value: "0:00:00", type: TIMEFORMATTYPE.TIME },
  { value: "0:00:00", type: TIMEFORMATTYPE.TIME },
  { value: "000:00:00", type: TIMEFORMATTYPE.TIME },
];
export type TimeLineScale = {
  extent: number; // the extents of the time scale in seconds
  majorDivisions: number; // the number of divisions in the time scale
  minorDivisions: number; // the number of division in each major division
  format: number; // index of format to use when displaying time
};

export const TimeLineScales: TimeLineScale[] = [
  { extent: 0.00002, majorDivisions: 10, minorDivisions: 4, format: 0 },
  { extent: 0.00004, majorDivisions: 8, minorDivisions: 5, format: 0 },
  { extent: 0.00008, majorDivisions: 8, minorDivisions: 2, format: 0 },
  { extent: 0.00016, majorDivisions: 16, minorDivisions: 2, format: 0 },
  { extent: 0.003, majorDivisions: 6, minorDivisions: 5, format: 1 },
  { extent: 0.006, majorDivisions: 6, minorDivisions: 2, format: 1 },
  { extent: 0.013, majorDivisions: 13, minorDivisions: 2, format: 1 },
  { extent: 0.025, majorDivisions: 25, minorDivisions: 2, format: 1 },
  { extent: 0.05, majorDivisions: 10, minorDivisions: 5, format: 2 },
  { extent: 0.1, majorDivisions: 10, minorDivisions: 2, format: 2 },
  { extent: 0.21, majorDivisions: 21, minorDivisions: 2, format: 2 },
  { extent: 0.4, majorDivisions: 8, minorDivisions: 5, format: 2 },
  { extent: 0.8, majorDivisions: 8, minorDivisions: 2, format: 2 },
  { extent: 1.7, majorDivisions: 17, minorDivisions: 2, format: 3 },
  { extent: 3, majorDivisions: 6, minorDivisions: 5, format: 4 },
  { extent: 6, majorDivisions: 6, minorDivisions: 2, format: 4 },
  { extent: 13, majorDivisions: 13, minorDivisions: 2, format: 5 },
  { extent: 27, majorDivisions: 27, minorDivisions: 2, format: 5 },
  { extent: 50, majorDivisions: 10, minorDivisions: 5, format: 5 },
  { extent: 105, majorDivisions: 7, minorDivisions: 3, format: 6 },
  { extent: 210, majorDivisions: 14, minorDivisions: 3, format: 6 },
  { extent: 420, majorDivisions: 14, minorDivisions: 3, format: 6 },
  { extent: 840, majorDivisions: 14, minorDivisions: 2, format: 7 },
  { extent: 1800, majorDivisions: 6, minorDivisions: 5, format: 7 },
  { extent: 3600, majorDivisions: 4, minorDivisions: 3, format: 8 },
  { extent: 7200, majorDivisions: 8, minorDivisions: 3, format: 8 },
  { extent: 14400, majorDivisions: 16, minorDivisions: 3, format: 8 },
  { extent: 28800, majorDivisions: 16, minorDivisions: 3, format: 8 },
  { extent: 54000, majorDivisions: 15, minorDivisions: 2, format: 9 },
  { extent: 108000, majorDivisions: 5, minorDivisions: 5, format: 9 },
  { extent: 216000, majorDivisions: 3, minorDivisions: 4, format: 9 },
  { extent: 432000, majorDivisions: 5, minorDivisions: 4, format: 10 },
  { extent: 604000, majorDivisions: 7, minorDivisions: 4, format: 10 },
  { extent: 1209600, majorDivisions: 2, minorDivisions: 7, format: 10 },
];

export enum GENERATORTYPE {
  "CMG" = "CMG",
  "SFPG" = "SFPG",
  "SFRG" = "SFRG",
  "Noise" = "Noise",
}

export enum MARKOVSTATE {
  same = "same",
  up = "up",
  down = "down",
}

export type sourceData = {
  generator: CMGeneratorType,
  source: AudioBufferSourceNode,
  reverb: InstReverb | undefined;
  start: number;
  stop: number;
  lastGain: GainNode | null;
};

export type AttributeRange = {
  lo: number;
  hi: number;
  step: number;
};

export type MarkovProbabilities = {
  same: number;
  down: number;
  up: number;
};
export type RandomSFTransitons = {
  currentState: MARKOVSTATE;
  currentValue: number;
  startValue: number;
  range: AttributeRange;
  same: MarkovProbabilities;
  up: MarkovProbabilities;
  down: MarkovProbabilities;
};

export enum NOISETYPE {
  white = "white",
  gaussian = "gaussian",
}

export enum GENERATIONMODE {
  record = "record",
  preview = "preview",
  solo = "solo",
  idle = "idle",
}

export type MidiEvent = {
  velocity?: number;
  frequency?: number;
  time?: number;
};

export type TimelineInterval = {
  startOffset: number;
  endOffset: number;
  startTime?: number;
  endTime?: number; 
}
