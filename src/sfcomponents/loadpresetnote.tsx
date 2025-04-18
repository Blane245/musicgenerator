import { Algorithmic } from "../classes/generators";
import { RawSourceData } from "../types";
import { gaussianRandom } from "../utils/gaussianrandom";
import { getGeneratorValues } from "./generators";
import { samplePool } from "./samplepool";
import { InstrumentZone, Preset, PresetZone } from "./types";
import { attenuate, precision, tc2s } from "./util";

// select mid range velocity Range
const isActiveZone = (
  zone: PresetZone | InstrumentZone,
  midi: number,
  velocity: number
): boolean => {
  // const keyRange: any = zone.generators[43];
  // const velRange: any = zone.generators[44];
  const keyRange: any = zone.keyRange;
  const velRange: any = zone.velRange;
  // console.log('ranges', 'key', keyRange, 'vel', velRange);
  const keyCheck: boolean = !keyRange || (keyRange.lo <= midi && midi <= keyRange.hi);
  const velCheck: boolean = !velRange || (velRange.lo <= velocity && velocity <= velRange.hi);
  return keyCheck && velCheck;
};

// Soundfont2 appears to be missing the velocityRange from the zones.
// this change will return only the first preset zone for the midi and then
// the first instrument zones for the midi
// const getActiveZones = (preset: Preset, midi: number) => {
//   const activeZones: {
//     mergedGenerators: Object;
//     sample: Sample;
//     keyRange?: RangeGenerator | undefined;
//     modulators?: {};
//     generators: {
//         [key: number]: Generator;
//     };
// }[] = [];
// // find the first preset that is active
// const presetZoneIndex: number = preset.zones.findIndex((pZone) => isActiveZone(pZone, midi));
// // if there isn't one, throuh an error
// if (presetZoneIndex < 0) throw new Error(`preset ${preset.header.name} missing a zone for midi ${midi}`);
// const presetZone: PresetZone = preset.zones[presetZoneIndex];
// // find the first instrument that is active
// const instrument: Instrument = preset.zones[presetZoneIndex].instrument;
// const instrumentZoneIndex: number = instrument.zones.findIndex((iZone) => isActiveZone(iZone, midi));
// if (instrumentZoneIndex < 0) throw new Error(`instrument ${instrument.header.name} missing a zone for midi ${midi}`);
// const instrumentZone: InstrumentZone = instrument.zones[instrumentZoneIndex];
// const mergedGenerators: Object = getGeneratorValues(instrumentZone, presetZone, preset)
// activeZones.push ({...instrumentZone, mergedGenerators:mergedGenerators});
// return activeZones;

// }
// TODO this version has problems with presets that have multiple
// velocity ranges for the same notes sicen there is no velocity range
// filter. All of the presets for a given midi are loaded and
// are all played. Some investigations is needed to understand
// velocity ranges better and why SoundFont2 does not include them
const getActiveZones = (preset: Preset, midi: number, velocity: number) => {
  // console.log('preset', preset);
  const activeZones = preset.zones
    .filter(
      (pzone: PresetZone) => isActiveZone(pzone, midi, velocity) && pzone.instrument
    )
    .map((pzone: PresetZone) => {
      return pzone.instrument.zones
        .filter((izone: InstrumentZone) => isActiveZone(izone, midi, velocity))
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
  // console.log("activeZones", activeZones);
  return activeZones;
};

export const getPresetNote = (
  gen: Algorithmic,
  preset: Preset,
  noiseAmplitude: number,
  noiseDispersion: number,
  interval: number,
  pitchValue: number,
  velocity: number,
  volumeValue: number,
  panValue: number,
  time: number
): RawSourceData[] => {
  const zones = getActiveZones(preset, Math.round(pitchValue), velocity);
  // console.log("zones", zones);
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
      // @ts-ignore
      sampleModes = 0,
    } = zone.mergedGenerators;

    // get the playback rate
    const rootKey =
      overridingRootKey !== undefined && overridingRootKey !== -1
        ? overridingRootKey
        : originalPitch;
    const baseDetune = 100 * rootKey + pitchCorrection - fineTune;
    const cents = pitchValue * 100 - baseDetune;
    const playbackRate = 1.0 * Math.pow(2, cents / 1200);
    // console.log('getpreset',
    //   'rootKey',
    //   rootKey,
    //   'baseDetune',
    //   baseDetune,
    //   'cents',
    //   cents,
    //   'playbackRate',
    //   playbackRate,
    // )

    // get the sample looping parameters and override looping if requested
    let loopStart: number = 0;
    let loopEnd: number = 0;
    let loop = false;
    if (sampleModes == 1) {
      loopStart =
        startLoop + startloopAddrsOffset + startloopAddrsCoarseOffset * 32768;
      loopEnd = endLoop + endloopAddrsOffset + endloopAddrsCoarseOffset * 32768;
      loop = (gen as Algorithmic).isLooping;
    }

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
    let sustainLevel = attenuate(1.0, sustainVolEnv/ 10);
    let noisySample: Float32Array = new Float32Array(0);
    // add noise to the sample if necessary
    if (noiseAmplitude > 0 && noiseDispersion > 0) {
      noisySample = addNoise(
        gen as Algorithmic,
        loopStart,
        loopEnd,
        loop,
        duration,
        sample,
        sampleRate,
        noiseAmplitude,
        noiseDispersion
      );
    }
    const aResult: RawSourceData = {
      gen,
      source: {
        note: pitchValue,
        sample: noisySample.length > 0 ? [noisySample] : [sample],
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
    // console.log("loadpresetnote result vol", aResult.vol, "interval", interval);
    return aResult;
  });
  return result;
};

function addNoise(
  gen: Algorithmic,
  loopStart: number,
  loopEnd: number,
  isLooping: boolean,
  duration: number,
  sample: Float32Array,
  sampleRate: number,
  amplitude: number,
  dispersion: number
) {
  // build the looping sample
  let thisSample: Float32Array = sample;
  if (isLooping) {
    const nSamples = Math.ceil(duration * sampleRate);
    thisSample = new Float32Array(nSamples);
    let iSample: number = loopStart;
    for (let i = 0; i < nSamples; i++) {
      if (i < sample.length) {
        thisSample[i] = sample[i];
      } else {
        thisSample[i] = sample[iSample];
        iSample++;
        if (iSample >= loopEnd) iSample = loopStart;
      }
    }
  }

  // get the current signal level
  let signalLevel: number = 0;
  thisSample.forEach((s) => {
    signalLevel = Math.max(Math.abs(s), signalLevel);
  });

  // add a gaussian noise signal at the request amplitude, frequency and dispersion
  let noisySample: Float32Array = new Float32Array(thisSample);
  let newSignalLevel: number = 0;
  let time: number = 0;
  const deltaT: number = 1 / sampleRate;
  noisySample.forEach((s, i) => {
    const noise: number = amplitude * gaussianRandom(0, dispersion, gen.rn);
    noisySample[i] = s + noise;
    newSignalLevel = Math.max(newSignalLevel, Math.abs(noisySample[i]));
    time += deltaT;
  });

  // normalize to the original signal level
  noisySample = noisySample.map((s) => (s * signalLevel) / newSignalLevel);
  // console.log(
  //   `add noise to sample at frequency, amplitude, std, samples, sampleRate, signalLevel, newSignalLevel`,
  //   frequency,
  //   amplitude,
  //   std,
  //   noisySample.length,
  //   sampleRate,
  //   signalLevel,
  //   newSignalLevel
  // );
  return noisySample;
}
