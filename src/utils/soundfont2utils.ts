import { Envelop, Generator, Zone, Preset } from "../types/soundfonttypes";
import { Message } from "../types/types";

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
export function getGeneratorData(preset: Preset, midi: number, id: number, current: number | undefined): number {
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
  const iZone: Zone | undefined = preset.zones[0].instrument.zones
    .find((z) => (z.keyRange && midi >= z.keyRange.lo && midi <= z.keyRange.hi));
  const iZoneGenerator: Generator | undefined = iZone ? iZone.generators[id] : undefined;
  const iZonelValue = iZoneGenerator && 'value' in iZoneGenerator ? iZoneGenerator.value : undefined;
  const relativeValue = z0Value ?? pGlobalValue ?? 0;
  const absoluteValue = iZonelValue ?? iGlobalValue ?? current ?? 0;
  return absoluteValue + relativeValue;
}
export function getGeneratorValues(preset: Preset, midi: number): Map<number, number> {

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
    const newValue = getGeneratorData(preset, midi, key, map.get(key));
    map.set(key, newValue);
  });
  return result;
}


// this gets the midi sample from the preset and prepares it for the 
// player. The volume envelop is handled at the time the note is played
export function getBufferSourceNodeFromSample(
  context: AudioContext,
  preset: Preset,
  midi: number,
): 
{ source: {buffer: AudioBufferSourceNode, envelop: Envelop}, message: Message } {

  // sequence
  // get the generator parameter value from the preset, zone, and instrument
  // we only need generators 
  const generatorValues: Map<number, number> = getGeneratorValues(preset, midi);
  // get the sample for the midi number given and condition it

  const instrumentZones = preset.zones[0].instrument.zones
  let iZoneIndex: number = instrumentZones
    .findIndex((z) => (z.keyRange && midi >= z.keyRange.lo && midi <= z.keyRange.hi));
  if (iZoneIndex < 0) {
      return ({source: {buffer: context.createBufferSource(), envelop: {}}, message: {error:true, text: `could not find the zone for instrument ${preset.header.name}, midi ${midi}`}})    
  }

  // allow the midi to go below the first zone and above the last zone

  const { header, data } = instrumentZones[iZoneIndex].sample;
  const float32 = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) {
    float32[i] = data[i] / 32768.0;
  }
  const buffer = context.createBuffer(1, float32.length, header.sampleRate);
  const channelData = buffer.getChannelData(0);
  channelData.set(float32);
  const source = context.createBufferSource();
  source.buffer = buffer;

  // apply adjustments
  const startloopAddrsOffset:number | undefined = generatorValues.get(2);
  const endloopAddrsOffset:number | undefined = generatorValues.get(3);
  const startloopAddrsCoarseOffset:number | undefined = generatorValues.get(4);
  const endloopAddrsCoarseOffset:number | undefined = generatorValues.get(50);
  const overridingRootKey:number | undefined = generatorValues.get(58);
  const fineTune:number | undefined = generatorValues.get(52);
  const sampleModes:number | undefined = generatorValues.get(54);
  const velocity:number | undefined = generatorValues.get(47);

  const rootKey = overridingRootKey !== undefined && overridingRootKey !== -1 ? overridingRootKey : header.originalPitch;
  const baseDetune = 100 * rootKey + header.pitchCorrection - (fineTune? fineTune: 0);
  const cents = midi * 100 - baseDetune;
  const playbackRate = 1.0 * Math.pow(2, cents / 1200);
  source.playbackRate.value = playbackRate;
 
  const loopStart = header.startLoop + 
    (startloopAddrsOffset? startloopAddrsOffset: 0) + 
    (startloopAddrsCoarseOffset? startloopAddrsCoarseOffset * 32768: 0);
  const loopEnd = header.endLoop +
    (endloopAddrsOffset? endloopAddrsOffset: 0) + 
    (endloopAddrsCoarseOffset? endloopAddrsCoarseOffset * 32768: 0);
if (loopEnd > loopStart && sampleModes === 1) {
    source.loopStart = loopStart / header.sampleRate;
    source.loopEnd = loopEnd / header.sampleRate;
    source.loop = true;
  }
  // pass the envelop
  const attackVolEnv:number | undefined = generatorValues.get(34);
  const decayVolEnv:number | undefined = generatorValues.get(36);
  const envelop = {velocity, attackVolEnv, decayVolEnv};

  return {source:{buffer: source, envelop: envelop}, message: {error:false, text:''}}
}
// while the sfumato solution for playing soundfont files is very elegant
// it is a bit of overkill for what I need. It uses some but not all of the
// preset, zone, and instrument generators. TypeType is having trouble explicitly
// capturing the mapping of the modulators for some reason. I need fewer than that uses. The
// necessary list is
// http://www.synthfont.com/SFSPEC21.PDF page 38
  // startloopAddrsOffset (2) - start offset of looping samples
  // endloopAddrsOffset (3) - start offset of looping samples
  // startAddrsCoarseOffset (4) - 
  // endAddrsCoarseOffset (50) - 

// overridingrootkey(58) - overrides original key (midi number)
// fineTune(52) - pitch offset (cents)
// sampleModes(54) - 0,2 (no loop), 1 (continuous loop) others not implemented
// velocity(47) - ?
// delayVolEnv(33) - delay time (timecents) before note starts
//  there will be no delay
// attackVolEnv(34) - attack time (timecents) (use)
//  attack phase will be implemented
// holdVolEnv(35) - hold time (timecents)
//  hold phase will not be implemented
// decayVolEnv(36) - decay time (timecents) (use)
//  decay will be will implemented
// sustainVolEnv(37) - sustain time (timecents)
//  sustain period will depend on the playback rate
// releaseVolEnv(38) - release time (timecents)
//  will not be implemented
// values from sample header
// pitchCorrection (cents)
// originalPitch (midi number)
// startLoop (index to sample)
// endLoop (index to sample)

// the note time period is split up as follows:
// playbackrate(sec) = 1/BPM * 60 which is the time between notes
// t0 will be the time that the note is to played
// attack time is from t0 to attack exponential ramp
// sustain time is from t0 + attack to playbackrate - attack - decay
// decay time is t0+playbackrate - decay linear ramp

// so I need modulators 58, 52, 54, 47, 34, 36
// they will come (relatively from the preset and absolutely from the instrument)

// to get the generator values for a specific note for a specific instrument (preset)
// NOTE only using preset with one zone (instrument)
// check preset globalzone generators
// check the presetzone's generators
// check the instument's global zone
// get the note's zone
// check the zone's generators

