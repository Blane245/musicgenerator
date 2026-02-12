
import { Buffer } from "buffer";
import AutoregressiveValues from "classes/algorithms/autoregressivevalues";
import ConstantValues from "classes/algorithms/constantvalues";
import MarkovianValues from "classes/algorithms/markovianvalues";
import OscillatorValues from "classes/algorithms/oscillatorvalues";
import SequenceValues from "classes/algorithms/sequencevalues";
import WienerValues from "classes/algorithms/wienervalues";
import Algorithmic from "classes/generators/algorithmic";
import Silent from "classes/generators/silent";
import Stochastic from "classes/generators/stochastic";
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
import { Preset } from "sfcomponents/types";

// #region constants and preferences
export const SAMPLERATE: number = 44100;
export const EPS: number = 1e-4;

// Preferences that are composition related
export enum TIMELINETYPE {
  "Time" = "Time",
  "Measure" = "Measure",
}
export type TimeLinePreferences = {
  TimeSnappingEnabled: boolean;
  TimeLineSetting: TIMELINETYPE;
  MeasureSubdivisions: number;
};


export const RECORDFORMAT: string = "recordFormat";
export const DEFAULTRECORDFORMAT: string = "mp3";
export const SFFILELOCATION: string = "SFFileLocation";
export const DEFAULTLOCALSFURI: string = "/SoundFonts";
export const RECENTFILES: string = "recentFiles";
export const RECENTCMGDIRECTORY: string = "recentCMGDirectory";
export const RECENTRECORDDIRECTORY: string = "recentRECORDDirectory";
// export const PREVIEWFREQUENCYDISPLAY: string = "previewFrequencyDisplay";
// export const PREVIEWFFTSIZE: string = "previewFFTSize";
// #endregion

// #region mouse
export type MouseLocation = {
  X: number;
  Y: number;
  dX: number;
  dY: number;
};
// #endregion

// #region generators

export type GeneratorType = Silent | Algorithmic | Stochastic;

export type EditGenerator = {
  track: Track | null;
  generator: GeneratorType | null;
  type: GENERATORTYPE | null;
  newGenerator: boolean;
};

export enum GENERATORTYPE {
  "Silent" = "Silent",
  "Algorithmic" = "Algorithmic",
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
// #endregion
// #region algorithmic
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
// #endregion

// #region stochastic

// Stochastic generator types
// export const RMSFACTOR: number = 0.75; // speed standard deviation factor
export const UNIT: number = 100; // units for the probability table
export const RMSFACTOR: number = 2; // speed standard devision factor

// the number of clouds in each cell
export type Composition = number[][];
export const INTENSITY = {
  pppp: 'pppp',
  ppp: 'ppp',
  pp: 'pp',
  p: 'p',
  mp: 'mp',
  mf: 'mf',
  f: 'f',
  ff: 'ff', 
  fff: 'fff',
  ffff: 'ffff',
}

export type Intensity = (typeof INTENSITY)[keyof typeof INTENSITY];

// map of intensity names to dB and velocity
// velocity mapping from SmartScore 64 dynamics (wikipedia music dynamics)
export const IntensityProfile = new Map<Intensity, {dB: number, velocity: number}> ([
  [INTENSITY.pppp, {dB: -4, velocity: 30}],
  [INTENSITY.ppp, {dB: -5, velocity: 40}],
  [INTENSITY.pp, {dB:-2, velocity: 50}],
  [INTENSITY.p, {dB:-1, velocity: 60}],
  [INTENSITY.mp, {dB:0, velocity: 70}],
  [INTENSITY.mf, {dB:1, velocity: 80}],
  [INTENSITY.f, {dB:2, velocity: 90}],
  [INTENSITY.ff, {dB:3, velocity: 100}],
  [INTENSITY.fff, {dB:4, velocity: 110}],
  [INTENSITY.ffff, {dB:5, velocity: 120}]
]);

export type IntensityTransition = {
  start: Intensity;
  middle?: Intensity;
  end: Intensity;
}

// transition forms taken from Xenakis, p.143
// to be drawn at random
export const IntensityTransitions: IntensityTransition[] = [
  {start: INTENSITY.ppp, end:INTENSITY.ppp},
  {start: INTENSITY.ppp, end:INTENSITY.p},
  {start: INTENSITY.ppp, middle: INTENSITY.p, end:INTENSITY.ppp},
  {start: INTENSITY.ppp, end:INTENSITY.f},
  {start: INTENSITY.ppp, middle: INTENSITY.f, end:INTENSITY.ppp},
  {start: INTENSITY.ppp, end:INTENSITY.ff},
  {start: INTENSITY.ppp, middle: INTENSITY.ff, end:INTENSITY.ppp},
  {start: INTENSITY.ppp, middle: INTENSITY.f, end:INTENSITY.p},
  {start: INTENSITY.ppp, middle: INTENSITY.ff, end:INTENSITY.p},
  {start: INTENSITY.p, end:INTENSITY.ppp},
  {start: INTENSITY.p, middle: INTENSITY.f, end:INTENSITY.ppp},
  {start: INTENSITY.p, middle: INTENSITY.ppp, end:INTENSITY.f},
  {start: INTENSITY.p, middle: INTENSITY.ppp, end:INTENSITY.ff},
  {start: INTENSITY.p, middle: INTENSITY.ff, end:INTENSITY.ppp},
  {start: INTENSITY.p, end:INTENSITY.p},
  {start: INTENSITY.p, middle: INTENSITY.ppp, end:INTENSITY.p},
  {start: INTENSITY.p, end:INTENSITY.f},
  {start: INTENSITY.p, middle: INTENSITY.f, end:INTENSITY.p},
  {start: INTENSITY.p, end:INTENSITY.ff},
  {start: INTENSITY.p, middle: INTENSITY.ff, end:INTENSITY.p},
  {start: INTENSITY.p, middle: INTENSITY.ff, end:INTENSITY.f},
  {start: INTENSITY.f, end:INTENSITY.ppp},
  {start: INTENSITY.f, middle: INTENSITY.ppp, end:INTENSITY.p},
  {start: INTENSITY.f, end:INTENSITY.p},
  {start: INTENSITY.f, middle: INTENSITY.ppp, end:INTENSITY.ff},
  {start: INTENSITY.f, middle: INTENSITY.ff, end:INTENSITY.ppp},
  {start: INTENSITY.f, middle: INTENSITY.p, end:INTENSITY.ff},
  {start: INTENSITY.f, middle: INTENSITY.ff, end:INTENSITY.p},
  {start: INTENSITY.f, end:INTENSITY.f},
  {start: INTENSITY.f, middle: INTENSITY.ppp, end:INTENSITY.f},
  {start: INTENSITY.f, middle: INTENSITY.p, end:INTENSITY.f},
  {start: INTENSITY.f, middle: INTENSITY.ff, end:INTENSITY.f},
  {start: INTENSITY.f, end:INTENSITY.ff},
  {start: INTENSITY.ff, end:INTENSITY.ppp},
  {start: INTENSITY.ff, middle: INTENSITY.ppp, end:INTENSITY.p},
  {start: INTENSITY.ff, middle: INTENSITY.ppp, end:INTENSITY.f},
  {start: INTENSITY.ff, middle: INTENSITY.p, end:INTENSITY.f},
  {start: INTENSITY.ff, end:INTENSITY.f},
  {start: INTENSITY.ff, end:INTENSITY.ff},
  {start: INTENSITY.ff, middle: INTENSITY.ppp, end:INTENSITY.ff},
  {start: INTENSITY.ff, middle: INTENSITY.p, end:INTENSITY.ff},
  {start: INTENSITY.ff, middle: INTENSITY.f, end:INTENSITY.ff},
]

export const INTENSITYOPTION = {
  none: 'none',
  composition: 'composition',
  voice: 'voice',
  cloud: 'cloud'
}
export type IntensityOption = (typeof INTENSITY)[keyof typeof INTENSITY];

export const INTENSITYTRANSITIONOPTION = {
  none: 'none',
  random: 'random', 
  persistent: 'persistent'
}
export type IntensityTransitionOption = 
(typeof INTENSITYTRANSITIONOPTION)[keyof typeof INTENSITYTRANSITIONOPTION]

export type IntensityParameters = {
  cycleTime: number; // average length of intensity transitions over the sample
}
export const DELTAPAN: number = 0.3; // step size for pan random walk
export const PANOPTION = {
  none: 'none',
  composition: 'composition',
  voice: 'voice',
  cloud: 'cloud'
}
export type PanOption = (typeof PANOPTION)[ keyof typeof PANOPTION];

export const PANALGORITHM = {none: 'none', glide: 'glide', walk: 'walk'};
export type PanAlgorithm = (typeof PANALGORITHM)[keyof typeof PANALGORITHM];

export type PanParameters = {
  cycleTime: number; // the length of time of a pan cycle
}

export type StochasticValues = {
  // user definition of composition
  ensemble: EnsembleType | null;
  ensembleName: string;
  Tc: number; // length of composition (seconds)
  Nt: number; // the number of time rows
  lambda: number; // the average number of events (clouds) per time cell
  compositionRN: RandomNumber;
  delta: number; // sounds / second
  dynamicsRN: RandomNumber;
  voices: Voices; // the voices that make up the ensemble
  intensityOption: IntensityOption; // none, composition, voice, cloud
  intensityTransitionOption: IntensityTransitionOption; // random, persistent
  intensityParameters: IntensityParameters; // averge duration of transition
  panOption: PanOption; // none, voice, cloud
  panAlgorithm: PanAlgorithm; // constant, walk, glide
  panParameters: PanParameters; // cycle time for pan sequences
  compositionSeed: string;
  dynamicsSeed: string;
  composition: Composition;
};

/**
 * Sustained hold the same pitch during the sound
 * Glissando changes the pitch during the sound. The next sound starts at the
 * previous ending pitch
 */
export const TIMBRE = {
  Sustained: "sustained",
  Glissando: "glissando",
} as const;

export type TIMBRETYPE = (typeof TIMBRE)[keyof typeof TIMBRE];

export type durationProperties = {
  mean: number; // the mean duration of sustained and glissando (elements/second) (0 for pizz and perc)
  fixed: number; // the fixed duration for pizz and perc (sec;0 for sust and glis)
  noiseFrequency: number; // for percussion, the frequency of added noise (Hz)
  noiseAmplitude: number; // the amplitude of added noise (dB)
};

export type Voice = {
  name: string; // the unique name of the voice
  description: string;
  soundFontFile: string;
  presetName: string;
  preset: Preset | undefined;
  timbre: TIMBRETYPE;
  registerLo: number;
  registerHi: number;
  duration: number;
  muted: boolean;
  volume: number;
  velocity: number;
}

export type Voices = Voice[];

export type CloudState = {
  offset: number;
  pitch: number;
}

export type CloudStates = CloudState[];

export type EnsembleType = {
    name: string;
    description: string;
    voices: string;
}
// #endregion

// #region noiseandmodulators
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
// #endregion

// #region soundfont
// place to hold the soundfont file and the presets in it
export type SoundFontGeneratorsType = {
  users: {generator:(Algorithmic | Stochastic), voiceNumber: number}[]; // the generators/voices that are using this soundfont
};

// the soundfont file collection for algorithmic generators
// used during loading a CMG file
export const SoundFontGenerators = new Map<string, SoundFontGeneratorsType> ([]);
// #endregion

// #region timeline
export enum TIMEFORMATTYPE {
  NUMBER,
  TIME,
}

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
// #endregion

// #region play
export enum PLAYMODE {
  play = "play",
  solo = "solo",
  idle = "idle",
}

export type GainEnvelope = {
  t: number;
  g: number;
}[];
// #endregion

// #region externalinterfaces
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
  "ensemblelist" = "ensemblelist",
  "ensemble" = "ensemble",
  "voicelist" = "voicelist",
  "voice" = "voice",
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

export type DbEnsembleListType = {
  type: DBRESPONSETYPE;
  value: EnsembleType[];
};

export type DbEnsembleType = {
  type: DBRESPONSETYPE;
  value: EnsembleType;
};

export type DbVoiceListType = {
  type: DBRESPONSETYPE;
  value: Voice[];
};
export type dBVoiceType = {
  type: DBRESPONSETYPE;
  value: Voice;
};
export type dBMessageType = {
  type: DBRESPONSETYPE;
  message: string;
};

export type DbResponseType =
  | DbErrorType
  | DbSequenceValidNamesType
  | DbSequenceType
  | DbEnsembleType
  | DbEnsembleListType
  | dBVoiceType
  | DbVoiceListType
  | dBMessageType;

export type ErrorMessage = string;
export type ErrorMessages = ErrorMessage[];
// #endregion

// #region playtypes
export type TimeMidiPoint = {
  time: number;
  midi: number;
  hue: number;
};
export type TimeMidiLine = {
  from: TimeMidiPoint;
  to: TimeMidiPoint;
};

export type SourceData = {
  audioBuffer: Float32Array[];
  audio: Blob; // in memory audio 
  image: HTMLImageElement;
  voiceHues: VoiceHues;
}

export type VoiceHues = Map<string, number>;
export type ReportInstrument = {
    name: string;
    loopEnabled: boolean;
    loopStart: number;
    loopEnd: number;
    rootKey: number;
    startCents: number;
    endCents: number;
    sampleRate: number;
    sampleCount: number;
    attackEnabled: boolean;
    envelope: GainEnvelope;
}
export type ReportSourceData = {
  generatorName: string;
  startTime: number;
  stopTime: number;
  soundFontName: string;
  presetName: string;
  startPitch: number;
  endPitch: number;
  instrument: ReportInstrument[];
}
// #endregion