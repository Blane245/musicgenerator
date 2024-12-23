import { CMGeneratorType, SourceData } from "../types";
import { applyOptions } from "./applyoptions";
import { bufferPool } from "./bufferpool";
import {
  generators,
  getGeneratorValue,
  getGeneratorValues,
} from "./generators";
import {
  Instrument,
  InstrumentZone,
  Preset,
  PresetZone,
  Sample,
} from "./types";

export function getBufferSourceFromSample(
  ctx: AudioContext | OfflineAudioContext,
  gen: CMGeneratorType,
  duration: number,
  pitchValue: number,
  volumeValue: number,
  panValue: number,
  sample: Sample,
  options: {} = {}
) {
  const { header } = sample;
  const source: AudioBufferSourceNode = ctx.createBufferSource();
  source.buffer = bufferPool (ctx, sample);
  const theseOptions: {} = { ...header, ...options }; // merge sample header and options
  return applyOptions(ctx, gen, source, duration, pitchValue, volumeValue, panValue, theseOptions);
}

export const isActiveZone = (
  zone: PresetZone | InstrumentZone,
  midi: number
): boolean =>
  !zone.keyRange || (zone.keyRange.lo <= midi && midi <= zone.keyRange.hi);

export const mergeGenerators = (
  preset: Preset,
  instrument: Instrument,
  izone: InstrumentZone,
  pzone: PresetZone
) => {
  Object.fromEntries(
    Object.entries(generators).map(([index, key]) => [
      key,
      getGeneratorValue(parseInt(index), izone, instrument, pzone, preset),
    ])
  );
};

export const getActiveZones = (preset: Preset, midi: number) => {
  // console.log('preset', preset);
  const activeZones = preset.zones
    .filter(
      (pzone: PresetZone) => isActiveZone(pzone, midi) && pzone.instrument
    )
    .map((pzone: PresetZone) => {
      return pzone.instrument.zones
        .filter((izone: InstrumentZone) => isActiveZone(izone, midi))
        .map((izone: InstrumentZone) => {
          const mergedGenerators = getGeneratorValues(izone, pzone, preset);
          // console.log('generators', mergedGenerators);
          return {
            ...izone,
            mergedGenerators: mergedGenerators,
          };
        });
    })
    .flat();
  // console.log('activeZones', activeZones);
  return activeZones;
};

export const connectPresetNote = (
  ctx: AudioContext | OfflineAudioContext,
  gen: CMGeneratorType,
  preset: Preset,
  duration: number,
  pitchValue: number,
  volumeValue: number,
  panValue: number,
  time: number
): SourceData[] => {
  const zones = getActiveZones(preset, Math.round(pitchValue));
  const result: SourceData[] = zones.map((zone) =>
    getBufferSourceFromSample(
      ctx,
      gen,
      duration,
      pitchValue,
      volumeValue,
      panValue,
      zone.sample,
      {
        ...zone.mergedGenerators,
        time,
      }
    )
  );
  return result;
};
