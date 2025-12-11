// Preferenences that are composition related
export enum TIMELINETYPE {
  "Time" = "Time",
  "Measure" = "Measure",
}
export type TimeLinePreferences = {
  TimeSnappingEnabled: boolean;
  TimeLineSetting: TIMELINETYPE;
  MeasureSubdivisions: number;
};

export type OscillatorBoxProperties = {};

import { Buffer } from "buffer";
import Track from "classes/track";
import RandomNumber from "../classes/randomnumber";
import {
  ascendingSawtoothModulator,
  descendingSawtoothModulator,
  sineModulator,
  squareModulator,
  triangleModulator,
} from "../modulators";
import { SoundFont2 } from "../soundfont2";
import Silent from "classes/generators/silent";
import Algorithmic from "classes/generators/algorithmic";
import AudioFile from "classes/generators/audiofile";
import ConstantValues from "classes/algorithms/constantvalues";
import AutoregressiveValues from "classes/algorithms/autoregressivevalues";
import OscillatorValues from "classes/algorithms/oscillatorvalues";
import MarkovianValues from "classes/algorithms/markovianvalues";
import WienerValues from "classes/algorithms/wienervalues";
import SequenceValues from "classes/algorithms/sequencevalues";
import Timbre from "classes/stochastic/timbre";
import { AlgorithmValues } from "classes/algorithms/algorithmvalues";
import Sustained from "classes/stochastic/sustained";
import Percussion from "classes/stochastic/percussion";
import Pizzicato from "classes/stochastic/pizzicato";
import Glissando from "classes/stochastic/glissando";
import Stochastic from "classes/generators/stochastic";
import SustainedCloud from "classes/stochastic/sustainedcloud";
import PizzicatoCloud from "classes/stochastic/pizzicatocloud";
import GlissandoCloud from "classes/stochastic/glissandocloud";
import PercussionCloud from "classes/stochastic/percussioncloud";

export const SAMPLERATE: number = 44100;

export const EPS: number = 1e-4;

export const RECORDFORMAT: string = "recordFormat";
export const DEFAULTRECORDFORMAT: string = "mp3";
export const SFFILELOCATION: string = "SFFileLocation";
export const DEFAULTLOCALSFURI: string = "/SoundFonts";
export const RECENTFILES: string = "recentFiles";
export const RECENTCMGDIRECTORY: string = "recentCMGDirectory";
export const RECENTRECORDDIRECTORY: string = "recentRECORDDirectory";
export const PREVIEWFREQUENCYDISPLAY: string = "previewFrequencyDisplay";
export const PREVIEWFFTSIZE: string = "previewFFTSize";

export type MouseLocation = {
  X: number;
  Y: number;
  dX: number;
  dY: number;
};

export type GeneratorType = Silent | Algorithmic | AudioFile | Stochastic;

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
  "Stochastic" = "Stochastic",
}

export type AlgorithmType =
  | ConstantValues
  | AutoregressiveValues
  | OscillatorValues
  | MarkovianValues
  | WienerValues
  | SequenceValues;

export enum ALGORITHMTYPE {
  "None" = "None",
  "Constant" = "Constant",
  "Autoregressive" = "Autoregressive",
  "Oscillator" = "Oscillator",
  "Markovian" = "Markovian",
  "Wiener" = "Wiener",
  "Sequencer" = "Sequencer",
}

export type ConstantType = {
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

export const parameterNames: string[] = [
  "noteP",
  "speedP",
  "attackP",
  "durationP",
  "volumeP",
  "panP",
];
export const atttributeTitles: string[] = [
  "Note (pitch)",
  "Speed (BPM)",
  "Attack [0-127]",
  "Duration (0,100]",
  "Volume [-10, +10]",
  "Pan [-1, +1]",
];

export const effectNames: string[] = ["tremolo", "vibrato"];

export enum SEQUENCEATTRIBUTE {
  "note" = "note",
  "speed" = "speed",
  "attack" = "attack",
  "duration" = "duration",
  "volume" = "volume",
  "pan" = "pan",
}
export const Attributes: SEQUENCEATTRIBUTE[] = [
  SEQUENCEATTRIBUTE.note,
  SEQUENCEATTRIBUTE.speed,
  SEQUENCEATTRIBUTE.attack,
  SEQUENCEATTRIBUTE.duration,
  SEQUENCEATTRIBUTE.volume,
  SEQUENCEATTRIBUTE.pan,
];
export type SequenceItem = {
  id: string;
  value: number;
  beats: number;
};
export type SequenceType = {
  name: string;
  sequenceAttribute: SEQUENCEATTRIBUTE;
  transpose: number;
  items: SequenceItem[];
  reverseSequence: boolean;
  reflectSequence: boolean;
  reflectPitch: number;
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

export type GainEnvelope = {
  t: number;
  g: number;
}[];
// the data that is needed to realize a source and manage it during preview and record
export type RawSourceData = {
  gen: GeneratorType;
  index: number;
  source: {
    note: number; // pitch number of the source
    sample: Float32Array[]; // the sf instrument sample converted to float32 or noise as float32 - length is sampleRate * totalTime * playbackRate
    // or the audiofile samples
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
  vol: { value: number };
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
    attackEnabled: boolean;
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
    envelope: GainEnvelope;
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

export enum SectionType {
  "Instrument" = "Instrument",
  "Percussion" = "Percussion",
  "AudioFile" = "AudioFile",
  "Stochastic" = "Stochastic",
  "None" = "None",
}
export type DrawingSection = {
  type: SectionType;
  verticalOffset: number;
  height: number;
  loValue: number;
  hiValue: number;
};
export type SourceToDrawingSectionEntry = {
  sourceIndex: number;
  sectionIndex: number;
};

export type SignalLevelsType = {
  leftVolume: number;
  leftMax: number;
  rightVolume: number;
  rightMax: number;
  leftSpectrum: Uint8Array;
  rightSpectrum: Uint8Array;
};

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
};
export type FileEntry = { data: Buffer; type: string };
export type FSResponse = {
  error: boolean;
  status?: string;
  list?: DirectoryEntry[];
  file?: FileEntry;
};
export type DirectoryList = string[];
export type FSEntry = {
  mountPoint: string;
  list: string[];
};
export type FSList = FSEntry[];
export enum DBRESPONSETYPE {
  "error" = "error",
  "info" = "info",
  "notesequencevalidnamelist" = "notesequencevalidnamelist",
  "speedsequencevalidnamelist" = "speedsequencenvalidamelist",
  "attacksequencevalidnamelist" = "attacksequencevalidnamelist",
  "durationsequencevalidnamelist" = "durationsequencevalidnamelist",
  "volumesequencevalidnamelist" = "volumesequencevalidnamelist",
  "pansequencevalidnamelist" = "pansequencevalidnamelist",
  "notesequencevalue" = "notesequencevalue",
  "speedsequencevalue" = "speedsequencevalue",
  "attacksequencevalue" = "attacksequencevalue",
  "durationequencevalue" = "durationequencevalue",
  "volumesequencevalue" = "volumesequencevalue",
  "pansequencevalue" = "pansequencevalue",
}
export type SequenceName = {
  name: string;
};

export type DbErrorType = {
  type: DBRESPONSETYPE;
  message: string;
};
export type DbSequenceValidNamesType = {
  type: DBRESPONSETYPE;
  value: SequenceName[];
};
export type DbSequenceItem = {
  name: string;
  items: string;
  tags: string;
};
export type DbSequenceType = {
  type: DBRESPONSETYPE;
  value: DbSequenceItem;
};

export type DbResponseType =
  | DbErrorType
  | DbSequenceValidNamesType
  | DbSequenceType;

// stochastic generator types

// timbre object type names
export enum TIMBRE {
  "None" = "None",
  "Sustained" = "Sustained",
  "Pizzicato" = "Pizzicato",
  "Percussion" = "Percussion",
  "Glissando" = "Glissando",
}
// the collection of timbres making up a composition
export type Ensemble = Timbre[];

export type CompositionCell = {
  mean: number; // the mean number of in a cell
  type: CloudType | null; // the type of cloud (based on the timbre)
};
// the event count and cloud type matrix of the composition
export type Composition = {
  cell: CompositionCell;
}[][]; // time cell by ensemble cell

export type StochasticValues = {
  length: number; // the number of measures in the composition
  Tc: number; // length of composition (seconds)
  B: number; // measure speed (measures/minute)
  deltaT: number; // time cell length (seconds)
  Nm: number; // number of measures per time cell
  cellCount: number; // the total number cells in the composition
  Nt: number; // the number of time columns
  Ne: number; // the number of ensembleRows
  pizzDuration: number; // the duration used by pizzaccato timbre
  percDuration: number; // the curation used by percussion timbre

  timbres: TIMBRE[];
  
  composition: Composition; // the composition matrix (Nt X ensemble size)

  lambda: number; // the average number of events (clouds) per unit
  delta: number; // sound density (sounds/second)

  cellDistribution: number[]; // the distribution of events (Nt * ensembleSize * P(i))
};
// the collection of compsition versions
export type CompositionVersionEntry = {
  comment: string;
  dateCreated: Date;
  dateUpdated: Date;
  values: StochasticValues;
};
export type CompositionVersions = Map<string, CompositionVersionEntry>;
export type CompositionVersionList = {
  name: string;
  comment: string;
  dateCreated: Date;
  dateUpdated: Date;
};

export type Range = {
  lo: number;
  hi: number;
}
export type DensityAttribute = {
  mean: number;
  unit: number;
  range: Range;
};

export type CloudType =
  | SustainedCloud
  | PercussionCloud
  | PizzicatoCloud
  | GlissandoCloud;
export type TimbreType = Sustained | Percussion | Pizzicato | Glissando;

export type ElementBuffer = {
  time: number; // seconds
  buffer: number[]; // a single channel buffer

}
