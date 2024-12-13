import { NoteConnection } from "../types";
import { normalizePermille, precision, tc2s } from "./util";

export function applyOptions(
  ctx: AudioContext | OfflineAudioContext,
  source: AudioBufferSourceNode,
  destination: AudioNode,
  duration: number,
  pitchValue: number,
  volumeValue: number,
  panValue: number,
  options: any
): NoteConnection {
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
  console.log("options", options);
  const rootKey =
    overridingRootKey !== undefined && overridingRootKey !== -1
      ? overridingRootKey
      : originalPitch;

  // const baseDetune = 100 * rootKey + pitchCorrection - fineTune;
  const baseDetune = 100 * rootKey + pitchCorrection - fineTune;
  const cents = pitchValue * 100 - baseDetune;
  console.log("rootkey", rootKey);
  console.log("basedetune", baseDetune);
  console.log("pitchValue", pitchValue);
  console.log("cents", cents);
  const playbackRate = 1.0 * Math.pow(2, cents / 1200);
  console.log("playbackRate", playbackRate);
  source.playbackRate.value = playbackRate;
  const loopStart =
    startLoop + startloopAddrsOffset + startloopAddrsCoarseOffset * 32768;
  const loopEnd =
    endLoop + endloopAddrsOffset + endloopAddrsCoarseOffset * 32768;
  if (loopEnd > loopStart && sampleModes === 1) {
    source.loopStart = loopStart / sampleRate;
    source.loopEnd = loopEnd / sampleRate;
    source.loop = true;
    console.log("loopstart", source.loopStart, "loopend", source.loopEnd);
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
  const vol: GainNode = ctx.createGain();
  const min = 0.001;
  const max = volumeValue;
  const delay = tc2s(delayVolEnv);
  const attack = Math.max(precision(tc2s(attackVolEnv), 4), 0.001);
  const hold = duration;
  const decay = Math.max(precision(tc2s(decayVolEnv), 4), 0.001);
  const sustain =
    sustainVolEnv >= 960 ? 0 : 1 - normalizePermille(sustainVolEnv);
  const release = precision(tc2s(releaseVolEnv), 4);
  let t = time;
  vol.gain.setValueAtTime(min, t);
  vol.gain.setValueAtTime(min, (t += delay));
  vol.gain.exponentialRampToValueAtTime(max, (t += attack));
  vol.gain.setValueAtTime(max, (t += hold));
  vol.gain.exponentialRampToValueAtTime(
    Math.max(sustain * max, 0.0001),
    (t += decay)
  );
  vol.gain.cancelAndHoldAtTime(t);
  vol.gain.exponentialRampToValueAtTime(min, (t = +release));

  const panner = ctx.createStereoPanner();
  panner.pan.value = panValue;
  source.connect(vol);
  vol.connect(panner);
  panner.connect(destination);
  // source.start(time);

  return { source, vol, panner };
}
