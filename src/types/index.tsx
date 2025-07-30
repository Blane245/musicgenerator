import { Algorithmic, AudioFile, Silent } from "../classes/generators";
import {
  AlgorithmValues,
  ConstantValues,
  AutoregressiveValues,
  MarkovianValues,
  OscillatorValues,
  WienerValues,
} from "../classes/algorithmvalues";
import RandomNumber from "../classes/randomnumber";
import {
  ascendingSawtoothModulator,
  descendingSawtoothModulator,
  sineModulator,
  squareModulator,
  triangleModulator,
} from "../modulators";
import { SoundFont2 } from "../soundfont2";

export const SAMPLERATE: number = 44100;

export const EPS: number = 1e-4;

export enum SOUNDFONTLOCATIONOPTIONS {
  "Local" = "Local",
  "Server" = "Server",
}

export const SFFILELOCATIONITEM: string = "SFFileLocation";
export const SFLOCALURIITEM: string = "SFLocalURI";
export const SFSERVERURIITEM: string = "SFServerURI";

export const DEFAULTLOCALSFURI: string = "/local_soundfonts";

export const DEFAULTSERVERSFURI: string = "/soundfonts";

export type MouseLocation = {
  X: number;
  Y: number;
  dX: number;
  dY: number;
};

export type GeneratorType = Silent | Algorithmic | AudioFile;

export enum GENERATORTYPE {
  "Silent" = "Silent",
  "Algorithmic" = "Algorithmic",
  "AudioFile" = "AudioFile",
}
export type AlgorithmType =
  | ConstantType
  | AutoregressiveType
  | OscillatorType
  | MarkovianType
  | WienerType;

export type Algorithm =
  | undefined
  | ConstantValues
  | AutoregressiveValues
  | AlgorithmValues
  | OscillatorValues
  | MarkovianValues
  | WienerValues;

export enum ALGORITHMTYPE {
  "None" = "None",
  "Constant" = "Constant",
  "Autoregressive" = "Autoregressive",
  "Oscillator" = "Oscillator",
  "Markovian" = "Markovian",
  "Wiener" = "Wiener",
}

export type ConstantType = {
  seed: string;
  rn: RandomNumber;
  value: number; // the constant value
};
export type AutoregressiveType = {
  initialValue: number; // units depend on parameter (note, speed, volume, pan)
  seed: string;
  rn: RandomNumber;
  alpha: number;
  sigma: number; // units depend on parameter (note, speed, volume, pan)
  lo: number; // units depend on parameter (note, speed, volume, pan)
  hi: number; // units depend on parameter (note, speed, volume, pan)
  currentValue: number;
};
export type OscillatorType = {
  seed: string;
  rn: RandomNumber;
  type: MODULATOR;
  center: number;
  frequency: number;
  amplitude: number;
  phase: number;
};

export enum MARKOVSTATE {
  same = "same",
  up = "up",
  down = "down",
}

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

export type MarkovianType = {
  seed: string;
  rn: RandomNumber;
  currentState: MARKOVSTATE;
  currentValue: number;
  startValue: number;
  range: AttributeRange;
  same: MarkovProbabilities;
  up: MarkovProbabilities;
  down: MarkovProbabilities;
};

export type WienerType = {
  seed: string;
  rn: RandomNumber;
  initialValue: number;
  alpha: number;
  sigma: number;
  lo: number;
  hi: number;
};

export enum NOISETYPE {
  white = "white",
  gaussian = "gaussian",
}

export enum MODULATOR {
  "SINE" = "SINE",
  "SQUARE" = "SQUARE",
  "TRIANGLE" = "TRIANGLE",
  "ASCENDINGSAWTOOTH" = "ASCENDINGSAWTOOTH",
  "DESCENDINGSAWTOOTH" = "DESCENDINGSAWTOOTH",
}

export type ModulatorAttributeData = {
  value: number;
  lo: number;
  hi: number;
  step: number;
  suffix: string;
};

export const ModulatorMap: Map<
  MODULATOR,
  (
    time: number,
    baseValue: number,
    frequency: number,
    amplitude: number,
    phase: number
  ) => number
> = new Map();
ModulatorMap.set(MODULATOR.SINE, sineModulator);
ModulatorMap.set(MODULATOR.SQUARE, squareModulator);
ModulatorMap.set(MODULATOR.TRIANGLE, triangleModulator);
ModulatorMap.set(MODULATOR.ASCENDINGSAWTOOTH, ascendingSawtoothModulator);
ModulatorMap.set(MODULATOR.DESCENDINGSAWTOOTH, descendingSawtoothModulator);

export enum TIMEFORMATTYPE {
  NUMBER,
  TIME,
}

// place to hold the soundfont file and the presets in it
export type SoundFontGeneratorsType = {
  name: string; // the name of the soundfont file
  generators: Algorithmic[]; // the generators that are using this soundfont
};

// the soundfont file collection for algorithmic generators
// used during loading a CMG file
export const SoundFontGenerators: SoundFontGeneratorsType[] = [];

export type TimeFormat = {
  value: string;
  type: TIMEFORMATTYPE;
};

export type SFPromiseType = {
  name: string;
  soundFont: SoundFont2;
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
  { value: "int", type: TIMEFORMATTYPE.TIME },
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
export type TimeTicks = {
  majorTickCount: number;
  scaleExtent: number;
  tickCount: number;
  tickHeight: number;
  tickSpacing: number;
  labelSize: number;
  labelSpacing: number;
  labelFormat: string;
};

export type TimelineInterval = {
  startOffset: number;
  endOffset: number;
  startTime?: number;
  endTime?: number;
};

// mode and states for timeinterval definition and modification
export enum TIMEINTERVALMODE {
  None,
  Define,
  Move,
}
export enum TIMEINTERVALEDGE {
  None,
  Left,
  Right,
}

export enum GENERATIONMODE {
  record = "record",
  preview = "preview",
  solo = "solo",
  idle = "idle",
}

// the data that is needed to realize a source and manage it during preview and record
export type RawSourceData = {
  gen: GeneratorType;
  index: number;
  source: {
    note: number; // midi number of the source
    sample: Float32Array[]; // the sf instrument sample converted to float32 or noise as float32
    sampleRate: number; // hz/sec
    playbackRate: number; // sf playback rate or 1 for noise
    loopStart: number; // sf loopstart index or 0 for noise
    loopEnd: number; // sf loopEnd index or sample.length for noise
    loop: boolean; // true/false depending on sf and option or false for noise
    startTime: number; // start time of the source within the generator
    duration: number; // attackInterval + holdInterval + releaseInterval
    stopTime: number; // startTime + duration
    started: boolean; // whether or not the source has started playing during preview
  };
  panner: {
    value: number; // pan value from generator
  };
  vol: {
    delayInterval: number;
    attackInterval: number; // attack time from sf as limited
    holdInterval: number; // the original note's duration minus the attack time
    decayInterval: number;
    sustainInterval: number;
    releaseInterval: number; // release time from sf as limited
    sustainLevel: number;
    initialAttenuation: number;
    value: number; // the current volume value
  };
};

// the attributes of a source that is managed during preview
export type ActiveSource = {
  gen: GeneratorType;
  source: AudioBufferSourceNode;
  sourceIndex: number;
  panner: StereoPannerNode;
  vol: GainNode;
  stopTime: number;
};
