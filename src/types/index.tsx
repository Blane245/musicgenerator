// Preferenences that are composition related
export enum TIMELINETYPE {
  'Time' = 'Time',
  'Measure' = 'Measure',
}
export type TimeLinePreferences = {
  TimeSnappingEnabled: boolean;
  TimeLineSetting: TIMELINETYPE;
  MeasureSubdivisions: number;
}

import Track from "classes/track";
import {
  AutoregressiveValues,
  ConstantValues,
  MarkovianValues,
  OscillatorValues,
  WienerValues,
} from "../classes/algorithmvalues";
import { Algorithmic, AudioFile, Silent } from "../classes/generators";
import RandomNumber from "../classes/randomnumber";
import {
  ascendingSawtoothModulator,
  descendingSawtoothModulator,
  sineModulator,
  squareModulator,
  triangleModulator,
} from "../modulators";
import { SoundFont2 } from "../soundfont2";
import { Buffer } from "buffer";

export const SAMPLERATE: number = 44100;

export const EPS: number = 1e-4;

export const RECORDFORMAT: string = "recordFormat";
export const DEFAULTRECORDFORMAT: string = "mp3";
export const SFFILELOCATION: string = "SFFileLocation";
export const DEFAULTLOCALSFURI: string = "/SoundFonts";
export const RECENTFILES: string = "recentFiles";
export const RECENTCMGDIRECTORY: string = "recentCMGDirectory";
export const RECENTRECORDDIRECTORY: string = "recentRECORDDirectory";

export type MouseLocation = {
  X: number;
  Y: number;
  dX: number;
  dY: number;
};

export type GeneratorType = Silent | Algorithmic | AudioFile;

export type EditGenerator = {
  track: Track | null;
  generator: GeneratorType | null;
  type: GENERATORTYPE | null;
  newGenerator: boolean;
};

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
  // | AlgorithmValues
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
  initialValue: number; // units depend on parameter (note, attack, speed, duration, volume, pan)
  seed: string;
  rn: RandomNumber;
  alpha: number;
  sigma: number; // units depend on parameter (note, attack, speed, duration, vvolume, pan)
  lo: number; // units depend on parameter (note, attack, speed, duration, vvolume, pan)
  hi: number; // units depend on parameter (note, attack, speed, duration, vvolume, pan)
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

export enum PLAYMODE {
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
    sample: Float32Array[]; // the sf instrument sample converted to float32 or noise as float32 - length is sampleRate * totalTime * playbackRate
    sampleRate: number; // hz/sec (includes the playbackRate sampleRate (instrument sample) * playbackRate (as calcuated) )
    playbackRate: number; // sf playback rate or 1 for noise (will always be one)
    startTime: number; // start time of the source within the generator
    duration: number; // attackInterval + holdInterval + releaseInterval
    stopTime: number; // startTime + duration
    started: boolean; // whether or not the source has started playing during preview
  };
  panner: {
    value: number; // pan value from generator
  };
  vol: { value: number; }
  instrument?: {
    name: string;
    sampleRate: number; // sample rate of the instrument
    sample: Float32Array; // the instrument's samples
    loopStart: number;
    loopEnd: number;
    loop: boolean;
    rootKey: number;
    pitchCorrection: number;
    fineTune: number;
    baseDetune: number;
    cents: number;
    delayVolEnv: number;
    attackVolEnv: number;
    holdVolEnv: number;
    decayVolEnv: number;
    releaseVolEnv: number;
    sustainVolEnv: number;
    delayEnd: number;
    attackEnd: number;
    holdEnd: number;
    decayEnd: number;
    noteEnd: number;
    interval: number;
    duration: number;
    releaseEnd: number;
    totalTime: number;
    noteEndGain: number;
    volumeValue: number;
    volumeGain: number;
    sustainGain: number;
    initialAttenuation: number;
    attenuation: number;
    envelope:{t:number, g:number}[]
  }
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

export type SignalLevelsType = {
  leftVolume: number;
  rightVolume: number;
  leftSpectrum: Uint8Array;
  rightSpectrum: Uint8Array;
}
export const FFTSIZE: number = 4096;
export const MINDECIBELS: number = -100;
export const MAXDECIBELS: number = -10;

export enum ENTRYTYPE {
  BlockDevice = "BlockDevice",
  CharacterDevice = "CharacterDevice",
  Directory = "Directory",
  FIFO = "FIFO",
  File = "File",
  Socket = "Socket",
  SymbolicLink = "SymbolicLink",
  Unknown = "Unknown",
}
export type DirectoryEntry = {
  name: string;
  path: string;
  type: ENTRYTYPE;
}
export type FileEntry = { data: Buffer, type: string};
export type ServerResponse = {
  error: boolean;
  status?: string;
  list?: DirectoryEntry[];
  file?: FileEntry;
};
export type DirectoryList = string[];
export type FSEntry = {
  mountPoint: string,
  list: string[];
}
export type FSList = FSEntry[];

