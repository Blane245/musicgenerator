import Track from "../classes/track";
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

export function getGeneratorUID (tracks: Track[]): number {
  let next = 0;
  let found = false;
  while(!found) {
    found = tracks.find((t) => {
      return (
        t.generators.find((g) => (g.name == 'G'.concat(next.toString())))
      )
    }) == undefined;
    if (!found) next++;
  }
  return next;
}

// function to determine whcih generator type an object is 
