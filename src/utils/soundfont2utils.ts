import { Generator, Zone, Preset, InstrumentZone } from "../types/soundfonttypes";

export const tokenizeNote = (note: string): string[] => {
  const [pc, acc = '', oct] = note.replace('/', '').match(/^([a-gA-G])([#bs]*)([0-9])?$/)?.slice(1) || [];
  if (!pc) {
    return [];
  }
  return [pc, acc, oct];
};
// turns the given note into its midi number representation
export const toMidi = (note: string): number | undefined => {
  try {
    const [pc, acc, oct] = tokenizeNote(note);
    const chroma: number | undefined = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[(pc as string).toLowerCase()];
    if (chroma == undefined) return undefined
    const getOffset = (acc: string) => {
      if (acc == '') return 0;
      if (acc == '#' || acc == 's') return 1;
      return -1;
    }
    const offset: number = getOffset(acc);
    return ((Number(oct) + 1) * 12 + (chroma as number) + offset);

  } catch (e) {
    return undefined;
  }
};

// timecents to seconds
export const tc2s = (timecents: number | undefined) => timecents? Math.pow(2, timecents / 1200): 0;
// seconds to timecents
export const s2tc = (seconds: number | undefined) => seconds? Math.round(Math.log2(seconds) * 1200): 0;
export const normalizePermilli = (permilli: number) => permilli / 1000;

export const precision = (n: number | undefined, digits: number) => {
  if (n != undefined) {
  const factor = Math.pow(10, digits);
  return Math.round(n * factor) / factor;
  }
  return 0;
};

// get the value for the midi number and identifed generator for a preset with a single instrument
export function getSFGeneratorData(preset: Preset, zone: InstrumentZone, id: number, current: number | undefined): number {
  // check the global zone preset
  // ccheck zones[0]
  // check the instrument global zone
  // find the instrument zone that contains the midi and check its generators
  // the preset zone values are relative
  // the instrument zone values are absolute

  const pGlobalZone: Zone | undefined = preset.globalZone;
  const pGlobalGenerator: Generator | undefined = pGlobalZone ? pGlobalZone.generators[id] : undefined;
  const pGlobalValue = pGlobalGenerator && 'value' in pGlobalGenerator ? pGlobalGenerator.value : undefined;
  const z0: Zone | undefined = preset.zones[0];
  const z0Generator: Generator | undefined = z0 ? z0.generators[id] : undefined;
  const z0Value = z0Generator && 'value' in z0Generator ? z0Generator.value : undefined;
  const iGlobalZone: Zone | undefined = preset.zones[0].instrument.globalZone;
  const iGlobalGenerator: Generator | undefined = iGlobalZone ? iGlobalZone.generators[id] : undefined;
  const iGlobalValue = iGlobalGenerator && 'value' in iGlobalGenerator ? iGlobalGenerator.value : undefined;
  // const iZone: Zone | undefined = preset.zones[0].instrument.zones
  //   .find((z) => (z.keyRange && midi >= z.keyRange.lo && midi <= z.keyRange.hi));
  const zoneGenerator: Generator | undefined = zone ? zone.generators[id] : undefined;
  const zonelValue = zoneGenerator && 'value' in zoneGenerator ? zoneGenerator.value : undefined;
  const relativeValue = z0Value ?? pGlobalValue ?? 0;
  const absoluteValue = zonelValue ?? iGlobalValue ?? current ?? 0;
  return absoluteValue + relativeValue;
}
export function getSFGeneratorValues(preset: Preset, zone: InstrumentZone): Map<number, number> {

  // setup the map for the desired generators
  // 
  // startloopAddrsOffset (2) - start offset of looping samples
  // endloopAddrsOffset (3) - start offset of looping samples
  // startAddrsCoarseOffset (4) - 
  // endAddrsCoarseOffset (50) - 
  // rootkey(58) - overrides original key (midi number)
  // fineTune(52) - pitch offset (cents)
  // sampleModes(54) - 0,2 (no loop), 1 (continuous loop) others not implemented
  // velocity(47) - ?
  // attackVolEnv(34) - attack time (timecents) (use)
  //  attack phase will be implemented
  // decayVolEnv(36) - decay time (timecents) (use)
  //  decay will be will implemented
  const result:Map<number, number> = new Map<number, number>([
    [2, 0], // startloopAddrsOffset
    [3, 0], // endloopAddrsOffset
    [4, 0], // startAddrsCoarseOffset
    [50, 0], // endAddrsCoarseOffset
    [58, 0], // overriderootkey
    [52, 0], // finetune
    [54, 0], // samplemodes
    [47, 0.3], // velocity
    [34, -12000],  // attackvolenv
    [36, -12000], //decayvolenv
  ]
  ); 

  result.forEach((_, key, map) => {
    const newValue = getSFGeneratorData(preset, zone, key, map.get(key));
    map.set(key, newValue);
  });
  return result;
}
