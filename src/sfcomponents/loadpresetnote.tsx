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
  time: number
): RawSourceData[] => {
  const zones = getActiveZones(preset, Math.round(pitchValue));
  console.log("zones", zones);
  const result: RawSourceData[] = zones.map((zone) => {
    // get the sample
    const { sample, header } = samplePool(zone.sample);

    // get the preset merged generator attributes
    const { startLoop, endLoop, originalPitch, pitchCorrection, sampleRate } =
      header;
    const {
      // @ts-ignore
      overridingRootKey,
      // @ts-ignore
      fineTune = 0,
      // @ts-ignore
      startloopAddrsOffset = 0,
      // @ts-ignore
      startloopAddrsCoarseOffset = 0,
      // @ts-ignore
      endloopAddrsOffset = 0,
      // @ts-ignore
      endloopAddrsCoarseOffset = 0,
      // @ts-ignore
      delayVolEnv = -12000,
      // @ts-ignore
      attackVolEnv = -12000,
      // @ts-ignore
      holdVolEnv = -12000,
      // @ts-ignore
      decayVolEnv = -12000,
      // @ts-ignore
      sustainVolEnv = 0,
      // @ts-ignore
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

    // get the delay, attack, hold, decay, sustain, and release intervals
    const delay = precision(tc2s(delayVolEnv), 4);
    const attack = precision(tc2s(attackVolEnv), 4);
    const hold = precision(tc2s(holdVolEnv), 4);
    const decay = precision(tc2s(decayVolEnv), 4);
    const release = precision(tc2s(releaseVolEnv), 4);
    const delayInterval: number = delay;
    const attackInterval: number = attack;
    const holdInterval: number = hold;
    const decayInterval: number = decay;
    const sustainInterval: number = Math.max(
      0,
      interval - delay - attack - hold - decay
    );
    const releaseInterval: number = release;
    const duration: number = interval + release;
    // sustain level multiplier has some special cases
    // When it is <= 0, there is decay and the multiplier is 1
    // When it is > 0, and less that 960, the multiplier is between 1 and 0.040
    // When it is >= 960, multipler is 0
    let sustainLevel = sustainVolEnv;
    
    const aResult: RawSourceData = {
      gen,
      source: {
        sample: [sample],
        sampleRate,
        playbackRate,
        loopStart,
        loopEnd,
        loop,
        startTime: time,
        duration,
        stopTime: time + duration,
        started: false,
      },
      panner: {
        value: panValue,
      },
      vol: {
        delayInterval,
        attackInterval,
        holdInterval,
        decayInterval,
        sustainInterval,
        releaseInterval,
        sustainLevel,
        value: volumeValue,
      },
    };
    console.log("loadpresetnote result vol", aResult.vol, 'interval', interval);
    return aResult;
  });
  return result;
};
