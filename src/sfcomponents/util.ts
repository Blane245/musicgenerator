import { Preset } from "./types";
export const tokenizeNote = (note: any) => {
  if (typeof note !== "string") {
    return [];
  }
  const [pc, acc = "", oct] =
    note.match(/^([a-gA-G])([#bs]*)([0-9])?$/)?.slice(1) || [];
  if (!pc) {
    return [];
  }
  return [pc, acc, oct ? Number(oct) : undefined];
};
const accs = { "#": 1, b: -1, s: 1 };
// turns the given note into its pitch number representation
export const toMidi = (note: any) => {
  if (typeof note === "number") {
    return note;
  }
  const [pc, acc, oct] = tokenizeNote(note);
  if (!pc) {
    throw new Error('not a note: "' + note + '"');
  }
  const chroma = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[
    (pc as string).toLowerCase()
  ];
  const offset =
    (acc as string)
      ?.split("")
      .reduce((o, char) => o + (accs as any)[char], 0) || 0;
  return (Number(oct) + 1) * 12 + (chroma as number) + offset;
};

// timecents to seconds
export const tc2s = (timecents: number) => {
  const result = (timecents == -32768 ? 0: Math.max(0.01, Math.pow(2, timecents / 1200)));
  return result;
}

// attenuate gain by dB
export const attenuate = (gain: number, dB:number): number => {
  if (dB <= 0) return gain;
  return gain * Math.pow(10, -dB);
}
export const dBToGain = (dB: number): number => { 
  return Math.pow(10, (dB-7)/20);
}
// seconds to timecents
export const s2tc = (seconds: number):number => Math.round(Math.log2(seconds) * 1200);
export const normalizePermille = (permille: number):number => permille / 1000;

export const precision = (n: number, digits: number):number => {
  const factor = Math.pow(10, digits);
  return (Math.ceil(n * factor) / factor);
};
export const precisionString = (n: number, digits: number):string => {
  return precision(n, digits).toFixed(digits);
};

const noteNames: string[] = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

export const toNote = (pitch: number): string => {
  if (pitch < 0) return "REST";
  const baseMidi:number = Math.round(pitch);
  const cents: number = Math.round((pitch - baseMidi) * 100);
  const octave = Math.trunc(baseMidi / 12) - 1;
  const noteNumber = baseMidi - 12 * (octave + 1);
  const extra: string = cents == 0 ? "" : Intl.NumberFormat("en-US", {
    signDisplay: "exceptZero"}).format(cents);
  const noteName: string =
    noteNumber >= 0 && noteNumber < 12 ? noteNames[noteNumber] : "?";
  return noteName.concat(octave.toString().concat(extra));
};

export function bankPresettoName(preset: Preset): string {
  return ("00" + preset.header.bank)
    .slice(-3)
    .concat(":")
    .concat(("00" + preset.header.preset).slice(-3))
    .concat(":")
    .concat(preset.header.name);
}

// find the preset in the soundfont file. If it is not found, set the
// preset to the first one in the file
export function presetNameToPreset(
  name: string | undefined,
 presets: Preset[],
): { preset: Preset | undefined; name: string } {
  if (!name || name == "" || presets.length == 0) return { preset: undefined, name: "" };
  const presetName: string = name.split(":")[2];
  let preset: Preset = presets.find(
    (p) => p.header.name === presetName
  ) as Preset;
  if (!preset) {
    preset = presets[0] as Preset;
    name = bankPresettoName(preset);
  }
  return { preset, name };
}

//curtesy of https://inspiredacoustics.com/en/MIDI_note_numbers_and_center_frequencies
export function midiToFrequency (pitch: number) : number {
  return 440.0 * Math.pow(2, (pitch - 69)/12);
}

export function frequencyToMidi(frequency: number) : number {
  return 69 + 12 * Math.log2(frequency / 440.0);
}