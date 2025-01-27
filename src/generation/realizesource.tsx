// create a source/gain/pan set from the raw source data and
// connect it to the destination
// there are several use cases for the gain envelop
// t0 - the time that the sounds starts
// t1 - the time to the delay interval (d)
// t2 - the time to the attack interval (a)
// t3 - the time to the hold interval (h)
// t4 - the time to the decay interval (c)
// t5 - the time to the sound's duration (s)
// t6 - the time to the sound release (r)
// some of the time intervals may become zero indicating that phase is not present
// case 1 - the sustain level > 0 && d+a+h+c < i (full delay, attack, hold, decay, sustain, release curve)
// case 2 - sustain level = 0 (no decay, only delay, attack, hold, sustain (at 1), release)
// case 3 - sustain level > 0 && d+a+h+c > i (long decay time: delay, attack, hold, decay, release)
// case 4 - delay > i: t1=t2=t3=t4=t5=t0, level is volume gain (no sound may result)
// case 5 - d <= i && d+a > i: t2=t3=t4=t5=t1, t0: min, t1: gain volume (cutoff attack)
// case 6 - d+a <=i && d+a+h > i: t3=t4=t5=t2, t0: min, t1:min, t2: gain volume (cutoffhold)
import { normalizePermille } from "../sfcomponents/util";
import AudioFile from "../classes/audiofile";
import { ActiveSource, RawSourceData } from "../types";
import { v2g } from "../utils/v2g";

export function realizeSource(
  ctx: AudioContext | OfflineAudioContext,
  RawSourceData: RawSourceData,
  sourceIndex: number,
  destination: AudioNode
): ActiveSource {
  // build source
  const source: AudioBufferSourceNode = ctx.createBufferSource();

  // the source will either have a sample or a fileBuffer
  if (RawSourceData.source.sample) {
    source.buffer = ctx.createBuffer(
      1,
      RawSourceData.source.sample[0].length,
      RawSourceData.source.sampleRate
    );
    const cD: Float32Array = source.buffer.getChannelData(0);
    cD.set(RawSourceData.source.sample[0]);
  } else {
    (RawSourceData.gen as AudioFile).getSample(ctx, source);
  }
  source.loopStart =
    RawSourceData.source.loopStart / RawSourceData.source.sampleRate;
  source.loopEnd =
    RawSourceData.source.loopEnd / RawSourceData.source.sampleRate;
  source.loop = RawSourceData.source.loop;
  source.playbackRate.value = RawSourceData.source.playbackRate;
  //   console.log(RawSourceData.source);
  // build gain
  const vol: GainNode = ctx.createGain();
  // sample exists
  if (RawSourceData.source.sample) {
    const min = 0.001;
    const gain: number = v2g(RawSourceData.vol.value);
    if (gain > min) {
      // const gain: number = RawSourceData.vol.value;
      const t0: number = RawSourceData.source.startTime;
      let t1: number = RawSourceData.vol.delayInterval + t0;
      let t2: number = RawSourceData.vol.attackInterval + t1;
      let t3: number = RawSourceData.vol.holdInterval + t2;
      let t4: number = RawSourceData.vol.decayInterval + t3;
      const stopTime: number =
        RawSourceData.source.stopTime - RawSourceData.vol.releaseInterval;
      const t6: number = RawSourceData.source.stopTime;
      const sustainLevel: number = Math.max(RawSourceData.vol.sustainLevel, 0);
      let sustainMultipler: number = sustainLevel;
      if (sustainMultipler == 0) sustainMultipler = 1.0;
      // When 96 dB (0.04) of attenuation is reached in the final gain amplifier, an abrupt jump to zero gain (infinite dB
      //   of attenuation) occurs. In a 16-bit system, this jump is inaudible.
      else if (sustainMultipler >= 960) sustainMultipler = 0;
      else sustainMultipler = 1 - normalizePermille(sustainMultipler);

      // make use case adjustments

      // case 1 - delay time is greater than note duration (may not be audible)
      if (t1 > stopTime) {
        vol.gain.setValueAtTime(gain, t0);
        vol.gain.setValueAtTime(gain, stopTime);
        vol.gain.cancelAndHoldAtTime(stopTime);
        vol.gain.exponentialRampToValueAtTime(min, t6); // release
        console.log("t1 > stopTime, t0, t1, stoptime", t0, t1, stopTime);
      }

      // case 2 - delay time + attack time is greater than note duration (truncate attack)
      else if (t2 > stopTime) {
        vol.gain.setValueAtTime(min, t0);
        vol.gain.setValueAtTime(min, t1);
        const maxAttack: number =
          min + ((gain - min) * (stopTime - t1)) / (t2 - t1);
        vol.gain.exponentialRampToValueAtTime(maxAttack, stopTime);
        vol.gain.setValueAtTime(maxAttack, stopTime);
        vol.gain.cancelAndHoldAtTime(stopTime);
        vol.gain.exponentialRampToValueAtTime(min, t6);
        console.log(
          "t2 > stopTime, maxAttack, t0, t1, t2, stoptime",
          maxAttack,
          t0,
          t1,
          t2,
          stopTime
        );
        // two paths based on sustainLevel for handling t3 and t4
      } else if (sustainLevel == 0) {
        // when sustainLevel = 0, there is no hold or decay
        // when sustainLevel > 0, hold and decay depend on time frames

        // case 3 has no hold or decay, so delay, attack, sustain, release
        vol.gain.setValueAtTime(min, t0);
        vol.gain.setValueAtTime(min, t1);
        vol.gain.exponentialRampToValueAtTime(gain, t2);
        vol.gain.setValueAtTime(gain, t2);
        vol.gain.setValueAtTime(gain, stopTime);
        vol.gain.cancelAndHoldAtTime(stopTime);
        vol.gain.exponentialRampToValueAtTime(min, t6);
        console.log(
          "sustain level zero, t0, t1, t2, stoptime",
          t0,
          t1,
          t2,
          stopTime
        );
      } else if (sustainLevel > 0 && t3 > stopTime) {
        // case 4 hold is past end, so delay, attack, hold, release
        vol.gain.setValueAtTime(min, t0);
        vol.gain.setValueAtTime(min, t1);
        vol.gain.exponentialRampToValueAtTime(gain, t2);
        vol.gain.setValueAtTime(gain, t2);
        vol.gain.setValueAtTime(gain, stopTime);
        vol.gain.cancelAndHoldAtTime(stopTime);
        vol.gain.exponentialRampToValueAtTime(min, t6);
        console.log(
          "sustainlevel > 0 && hold > end, t0, t1, t2, t3, stoptime",
          t0,
          t1,
          t2,
          t3,
          stopTime
        );
      } else if (sustainLevel > 0 && t4 > stopTime) {
        // case 5 decay is past end, so delay, attack, hold, partial decay, release
        vol.gain.setValueAtTime(min, t0);
        vol.gain.setValueAtTime(min, t1);
        vol.gain.exponentialRampToValueAtTime(gain, t2);
        vol.gain.setValueAtTime(gain, t2);
        vol.gain.setValueAtTime(gain, t3);
        const minDecay: number =
          min + ((gain - min) * (stopTime - t3)) / (t4 - t3);
        vol.gain.exponentialRampToValueAtTime(minDecay, stopTime);
        vol.gain.setValueAtTime(gain, stopTime);
        vol.gain.cancelAndHoldAtTime(stopTime);
        vol.gain.exponentialRampToValueAtTime(min, t6);
        console.log(
          "sustainlevel > 0 && decay > end, gain, minDecay, t0, t1, t2, t3, t4, stoptime",
          gain,
          minDecay,
          t0,
          t1,
          t2,
          t3,
          t4,
          stopTime
        );
      } else if (sustainLevel > 0 && t4 <= stopTime) {
        // case 6 - decay complete before stop time - delay, attack, hold, decay
        vol.gain.setValueAtTime(min, t0);
        vol.gain.setValueAtTime(min, t1);
        vol.gain.exponentialRampToValueAtTime(gain, t2);
        vol.gain.setValueAtTime(gain, t2);
        vol.gain.exponentialRampToValueAtTime(min, t4);
        vol.gain.setValueAtTime(gain, t4);
        vol.gain.cancelAndHoldAtTime(t4);
        console.log(
          "susteinLevel > 0 && decay < end, t0, t1, t2, t3, t4",
          t0,
          t1,
          t2,
          t3,
          t4
        );
      } else {
        vol.gain.value = gain;
        console.log("no condition set - set gain");
      }
    }
    vol.gain.value = min;
  }

  // array buffer exists
  else vol.gain.value = v2g(RawSourceData.vol.value);

  // build pan
  const panner: StereoPannerNode = ctx.createStereoPanner();
  panner.pan.value = RawSourceData.panner.value;
  // connect everything
  source.connect(vol).connect(panner).connect(destination);
  return {
    gen: RawSourceData.gen,
    source,
    sourceIndex,
    vol,
    panner,
    stopTime: RawSourceData.source.stopTime,
  };
}
