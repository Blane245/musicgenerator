import SFPG from "../classes/sfpg";
import SFRG from "../classes/sfrg";
import { CMGeneratorType, SourceData } from "../types";
import { normalizePermille, precision, tc2s } from "./util";

export function applyOptions(
  ctx: AudioContext | OfflineAudioContext,
  gen: CMGeneratorType,
  source: AudioBufferSourceNode,
  destination: AudioNode,
  duration: number,
  pitchValue: number,
  volumeValue: number,
  panValue: number,
  options: any
): SourceData {
  let { time = ctx.currentTime } = options;
  const {
    // midi,
    start,
    velocity = 0.3,
    startLoop,
    endLoop,
    sampleRate,
    originalPitch,
    pitchCorrection,
    type,
    sampleModes = 0,
    overridingRootKey,
    fineTune = 0,
    startloopAddrsOffset = 0,
    startloopAddrsCoarseOffset = 0,
    endloopAddrsOffset = 0,
    endloopAddrsCoarseOffset = 0,
    delayVolEnv = -12000,
    attackVolEnv = -12000,
    holdVolEnv = -12000,
    decayVolEnv = -12000,
    sustainVolEnv = 0,
    releaseVolEnv = -12000,
    // pan = 0,
    ...rest
  } = options;
  // console.log("options", options);
  const rootKey =
    overridingRootKey !== undefined && overridingRootKey !== -1
      ? overridingRootKey
      : originalPitch;

  // const baseDetune = 100 * rootKey + pitchCorrection - fineTune;
  const baseDetune = 100 * rootKey + pitchCorrection - fineTune;
  const cents = pitchValue * 100 - baseDetune;
  // console.log("rootkey", rootKey);
  // console.log("basedetune", baseDetune);
  // console.log("pitchValue", pitchValue);
  // console.log("cents", cents);
  const playbackRate = 1.0 * Math.pow(2, cents / 1200);
  // console.log("playbackRate", playbackRate);
  source.playbackRate.value = playbackRate;
  const loopStart =
    startLoop + startloopAddrsOffset + startloopAddrsCoarseOffset * 32768;
  const loopEnd =
    endLoop + endloopAddrsOffset + endloopAddrsCoarseOffset * 32768;
  if (loopEnd > loopStart && sampleModes === 1) {
    source.loopStart = loopStart / sampleRate;
    source.loopEnd = loopEnd / sampleRate;
    source.loop = (gen as SFPG | SFRG).isLooping;
    // console.log("loopstart", source.loopStart, "loopend", source.loopEnd);
  } else if (sampleModes === 3) {
    console.warn("unimplemented sampleMode 3 (play till end on note off)");
  }
  // type === sampleModes ?
  const unimplemented = Object.keys(rest).filter(
    (k) => !["name", "instrument", "keyRange", "sampleID", "end"].includes(k)
  );
  if (unimplemented.length) {
    /*     console.warn(
        "unimplemented options:",
        Object.fromEntries(unimplemented.map((key) => [key, rest[key]]))
      ); */
  }
  // console.log(
  //   'volume', volumeValue,
  // )
  // TODO volume is not following changes maybe sustain problem
  const vol: GainNode = ctx.createGain();
  const min = 0.001;
  const max = volumeValue;
  const delay = Math.max(precision(tc2s(delayVolEnv), 4), 0.001);
  const attack = Math.max(precision(tc2s(attackVolEnv), 4), 0.001);
  const hold = duration;
  const decay = Math.max(precision(tc2s(decayVolEnv), 4), 0.001);
  const sustain =
    sustainVolEnv >= 960 ? 0 : 1 - normalizePermille(sustainVolEnv);
  const release = precision(tc2s(releaseVolEnv), 4);
  let t = time;
  vol.gain.setValueAtTime(min, t);
  // console.log('set value at', min, t);
  vol.gain.setValueAtTime(min, (t += delay));
  // console.log('set value at', min, t);
  vol.gain.exponentialRampToValueAtTime(max, (t += attack));
  // console.log('ramp value to', max, t);
  vol.gain.setValueAtTime(max, (t += hold));
  // console.log('set value at', max, t);
  vol.gain.exponentialRampToValueAtTime(
    Math.max(sustain * max, 0.0001),
    (t += decay)
  );
  // console.log('ramp value to', Math.max(sustain* max, 0.0001), t);
  vol.gain.cancelAndHoldAtTime(t);
  // console.log('cancel and hold at', t);
  vol.gain.exponentialRampToValueAtTime(min, (t += release));
  // console.log('ramp value to', min, t);
  // console.log(
  //   'min', min,
  //   'max', max,
  //   'delay', delay,
  //   'attack', attack,
  //   'hold', hold,
  //   'decay', decay,
  //   'sustain', sustain,
  //   'release', release,
  // )

  const panner = ctx.createStereoPanner();
  // console.log('pan', panValue);
  panner.pan.value = panValue;
  source.connect(vol);
  vol.connect(panner);
  panner.connect(destination);
  // source.start(time);

  return { source, gen, duration, startTime: time, started: false};
}
