import { SoundFont2 } from "../soundfont2";

export interface SampleHeader {
  name: string;
  end: number;
  endLoop: number;
  link: number;
  originalPitch: number;
  pitchCorrection: number;
  sampleRate: number;
  start: number;
  startLoop: number;
  type: number;
}

export interface Sample {
  header: SampleHeader;
  data: Int16Array;
}

export interface SoundFontItem {
  name: string;
  soundFont: SoundFont2;
}

export interface RangeGenerator {
  lo: number;
  hi: number;
}

declare interface ValueGenerator {
  id: number;
  value: number;
}
declare type Generator = RangeGenerator | ValueGenerator;

declare interface Zone {
  keyRange?: RangeGenerator | undefined;
  velRange?: RangeGenerator | undefined;
  modulators?: {};
  generators: {
    [key: number]: Generator;
  };
}

export interface InstrumentZone extends Zone {
  sample: Sample;
}

export interface Instrument {
  globalZone?: Zone;
  header: {
    name: string;
    bagIndex: number;
  };
  zones: InstrumentZone[];
}

export interface PresetZone extends Zone {
  instrument: Instrument;
}

export interface Preset {
  globalZone?: Zone;
  header: {
    name: string;
    bagIndex: number;
    bank: number;
    genre: number;
    library: number;
    morphology: number;
    preset: number;
  };
  zones: PresetZone[];
}
