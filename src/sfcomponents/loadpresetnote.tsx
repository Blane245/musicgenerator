import SFPG from "../classes/sfpg";
import SFRG from "../classes/sfrg";
import { CMGeneratorType, RawSourceData } from "../types";
import { getGeneratorValues } from "./generators";
import { samplePool } from "./samplepool";
import { InstrumentZone, Preset, PresetZone } from "./types";
import { precision, tc2s } from "./util";

const isActiveZone = (
  zone: PresetZone | InstrumentZone,
  midi: number
): boolean =>
  !zone.keyRange || (zone.keyRange.lo <= midi && midi <= zone.keyRange.hi);

const getActiveZones = (preset: Preset, midi: number) => {
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

export const getPresetNote = (
  gen: CMGeneratorType,
  preset: Preset,
  interval: number,
  pitchValue: number,
  volumeValue: number,
  panValue: number,
  time: number,
): RawSourceData[] => {
  const zones = getActiveZones(preset, Math.round(pitchValue));
  const result: RawSourceData[] = zones.map((zone) => {
    // get the sample
    const { sample, header } = samplePool(zone.sample);

    // get the preset merged generator attributes
    const { startLoop, endLoop, originalPitch, pitchCorrection, sampleRate } =
      header;
    const {
      overridingRootKey,
      fineTune = 0,
      startloopAddrsOffset = 0,
      startloopAddrsCoarseOffset = 0,
      endloopAddrsOffset = 0,
      endloopAddrsCoarseOffset = 0,
      attackVolEnv = -12000,
      releaseVolEnv = -12000,
    } = zone.mergedGenerators;

    // get the playback rate
    const rootKey =
      overridingRootKey !== undefined && overridingRootKey !== -1
        ? overridingRootKey
        : originalPitch;
    const baseDetune = 100 * rootKey + pitchCorrection - fineTune;
    const cents = pitchValue * 100 - baseDetune;
    const playbackRate = 1.0 * Math.pow(2, cents / 1200);

    // get the sample looping parameters
    const loopStart =
      startLoop + startloopAddrsOffset + startloopAddrsCoarseOffset * 32768;
    const loopEnd =
      endLoop + endloopAddrsOffset + endloopAddrsCoarseOffset * 32768;
    const loop = (gen as SFPG | SFRG).isLooping;

    // get the attack, hold, and release intervals
    const attack = precision(tc2s(attackVolEnv), 4);
    const release = precision(tc2s(releaseVolEnv), 4);
    const attackInterval: number = Math.max(
      Math.min(0.1 * interval, attack),
      0.01
    );
    const releaseInterval: number = Math.max(
      Math.min(0.1 * interval, release),
      0.01
    );
    const holdInterval: number = interval - attackInterval;
    return {
      gen,
      source: {
        sample,
        sampleRate,
        playbackRate,
        loopStart,
        loopEnd,
        loop,
        startTime: time,
        duration: attackInterval + holdInterval + releaseInterval,
        stopTime: time + attackInterval + holdInterval + releaseInterval,
        started: false,
        },
      panner: {
        value: panValue,
      },
      vol: {
        attackInterval,
        holdInterval,
        releaseInterval,
        value: volumeValue,
      },
    };
  });
  return result;
};
