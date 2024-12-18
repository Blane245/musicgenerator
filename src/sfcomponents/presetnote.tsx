import { CMGeneratorType, SourceData } from "../types";
import { applyOptions } from "./applyoptions";
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
  destination: AudioNode,
  duration: number,
  pitchValue: number,
  volumeValue: number,
  panValue: number,
  sample: Sample,
  options: {} = {}
) {
  const { header, data } = sample;
  const float32: Float32Array = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++) {
    // scale Int16Array between -1 and 1
    float32[i] = data[i] / 32768;
  }
  const buffer: AudioBuffer = ctx.createBuffer(
    1,
    float32.length,
    header.sampleRate
  );
  const channelData: Float32Array = buffer.getChannelData(0);
  channelData.set(float32);
  const source: AudioBufferSourceNode = ctx.createBufferSource();
  source.buffer = buffer;
  const theseOptions: {} = { ...header, ...options }; // merge sample header and options
  return applyOptions(ctx, gen, source, destination, duration, pitchValue, volumeValue, panValue, theseOptions);
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
  destination: AudioNode,
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
      destination,
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
