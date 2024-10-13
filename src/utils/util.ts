import { Preset } from "types/soundfonttypes";

export const tokenizeNote = (note: any) => {
  if (typeof note !== 'string') {
    return [];
  }
  const [pc, acc = '', oct] = note.match(/^([a-gA-G])([#bs]*)([0-9])?$/)?.slice(1) || [];
  if (!pc) {
    return [];
  }
  return [pc, acc, oct ? Number(oct) : undefined];
};
const accs = { '#': 1, b: -1, s: 1 };
// turns the given note into its midi number representation
export const toMidi = (note: any): number => {
  if (typeof note === 'number') {
    return note;
  }
  const [pc, acc, oct] = tokenizeNote(note);
  if (!pc) {
    throw new Error('not a note: "' + note + '"');
  }
  const chroma = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[(pc as string).toLowerCase()];
  const offset = (acc as string)?.split('').reduce((o, char) => o + accs[char], 0) || 0;
  return (Number(oct) + 1) * 12 + (chroma as number) + offset;
};

// timecents to seconds
export const tc2s = (timecents: number) => Math.pow(2, timecents / 1200);
// seconds to timecents
export const s2tc = (seconds: number) => Math.round(Math.log2(seconds) * 1200);
export const normalizePermille = (permille: number) => permille / 1000;

export const precision = (n: number, digits: number) => {
  const factor: number = Math.pow(10, digits);
  return Math.round(n * factor) / factor;
};

const noteNames: string[] = ['C', 'C#', "D", 'D#', "E", "F", "F#", "G", "G#", "A", "A#", "B"]
export const toNote = (midi: number): string => {
  const baseMidi = Math.trunc(midi);
  const octave = Math.trunc(baseMidi / 12) - 1;
  const noteNumber = baseMidi - 12 * (octave + 1);
  const extra: string = (baseMidi != midi ? '+' : '')
  const noteName: string = (noteNumber >= 0 && noteNumber < 12 ? noteNames[noteNumber] : '?');
  return noteName.concat(octave.toString().concat(extra));
}

export function bankPresettoName(preset: Preset): string {
  return (
  ("00" + preset.header.bank).slice(-3)
    .concat(":")
    .concat(("00" + preset.header.preset).slice(-3))
    .concat(':')
    .concat(preset.header.name));
}
