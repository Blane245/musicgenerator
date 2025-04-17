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
import { Algorithmic, AudioFile } from "../classes/generators";
import { ActiveSource, GENERATORTYPE, RawSourceData } from "../types";
import { v2g } from "../utils/v2g";

export function realizeSource(
  ctx: AudioContext | OfflineAudioContext,
  rawSourceData: RawSourceData,
  sourceIndex: number,
  destination: AudioNode
): ActiveSource {
  // build source
  const source: AudioBufferSourceNode = ctx.createBufferSource();
  // the source will either CMG, Algorithmic, or AudioFile
  if (rawSourceData.gen.type == GENERATORTYPE.Algorithmic) {
    source.buffer = ctx.createBuffer(
      1,
      rawSourceData.source.sample[0].length,
      rawSourceData.source.sampleRate
    );
    const cD: Float32Array = source.buffer.getChannelData(0);
    cD.set(rawSourceData.source.sample[0]);
    // console.log("sample length", rawSourceData.source.sample[0].length);
  } else if (rawSourceData.gen.type == GENERATORTYPE.AudioFile) {
    (rawSourceData.gen as AudioFile).getSample(ctx, source);
  }
  if (rawSourceData.gen.type != GENERATORTYPE.CMG) {
    source.loopStart =
      rawSourceData.source.loopStart / rawSourceData.source.sampleRate;
    source.loopEnd =
      rawSourceData.source.loopEnd / rawSourceData.source.sampleRate;
    source.loop = rawSourceData.source.loop;
    source.playbackRate.value = rawSourceData.source.playbackRate;
    //   console.log(rawSourceData.source);
    // build gain
    const vol: GainNode = ctx.createGain();
    // sample exists
    if (rawSourceData.source.sample) {
      const min = 0.001;
      const gain: number = v2g(rawSourceData.vol.value);
      if (gain > min) {
        // const gain: number = rawSourceData.vol.value;
        const t0: number = rawSourceData.source.startTime;
        let t1: number = rawSourceData.vol.delayInterval + t0;
        let t2: number = rawSourceData.vol.attackInterval + t1;
        let t3: number = rawSourceData.vol.holdInterval + t2;
        let t4: number = rawSourceData.vol.decayInterval + t3;
        const t5: number = rawSourceData.source.stopTime - rawSourceData.vol.releaseInterval;
        // rawSourceData.source.stopTime - rawSourceData.vol.releaseInterval;
        const t6: number = rawSourceData.source.stopTime;
        const sustainLevel: number = Math.max(
          rawSourceData.vol.sustainLevel,
          0
        );
        // console.log('times', t0, t1, t2, t3, t4, t5, t6);
        let sustainMultipler: number = sustainLevel;
        if (sustainMultipler == 0) sustainMultipler = 1.0;
        // When 96 dB (0.04) of attenuation is reached in the final gain amplifier, an abrupt jump to zero gain (infinite dB
        //   of attenuation) occurs. In a 16-bit system, this jump is inaudible.
        else if (sustainMultipler >= 960) sustainMultipler = 0;
        else sustainMultipler = 1 - normalizePermille(sustainMultipler);
        // const modGain: number = Math.max(gain * sustainMultipler, 0.001);
        const modGain: number = gain;

        // make use case adjustments

        // case 1 - delay time is greater than note duration (may not be audible)
        if (t1 >= t5) {
          vol.gain.setValueAtTime(gain, t0);
          vol.gain.setValueAtTime(gain, t5);
          vol.gain.cancelAndHoldAtTime(t5);
          vol.gain.exponentialRampToValueAtTime(min, t6); // release
          // console.log(
          //   "delay >= stop, note, gain, t0, stop, release",
          //   rawSourceData.source.note,
          //   gain,
          //   t0,
          //   t5,
          //   t6
          // );
        }

        // case 2 - delay time + attack time is greater than note duration (truncate attack)
        else if (t2 >= t5) {
          vol.gain.setValueAtTime(min, t0);
          if (t0 != t1) vol.gain.setValueAtTime(min, t1);
          const maxAttack: number =
            t2 != t1 ? min + ((gain - min) * (t5 - t1)) / (t2 - t1) : min;
          vol.gain.exponentialRampToValueAtTime(maxAttack, t5);
          vol.gain.setValueAtTime(maxAttack, t5);
          vol.gain.cancelAndHoldAtTime(t5);
          vol.gain.exponentialRampToValueAtTime(min, t6);
          // console.log(
          //   "attack >= stop, note, maxAttack, t0, t1, t2, stop, release",
          //   rawSourceData.source.note,
          //   maxAttack,
          //   t0,
          //   t1,
          //   t2,
          //   t5,
          //   t6
          // );
          // two paths based on sustainLevel for handling t3 and t4
        } else if (sustainLevel == 0) {
          // when sustainLevel = 0, there is no hold or decay
          // when sustainLevel > 0, hold and decay depend on time frames

          // case 3 has no hold or decay, so delay, attack, sustain, release

          vol.gain.setValueAtTime(min, t0);
          if (t0 != t1) vol.gain.setValueAtTime(min, t1);
          if (t1 != t2) {
            vol.gain.exponentialRampToValueAtTime(modGain, t2);
            vol.gain.setValueAtTime(modGain, t2);
          } else vol.gain.setValueAtTime(modGain, t2);
          vol.gain.setValueAtTime(modGain, t5);
          vol.gain.cancelAndHoldAtTime(t5);
          vol.gain.exponentialRampToValueAtTime(min, t6);
          // console.log(
          //   "sustain level zero, note, modgain, t0, t1, t2, stoptime, release",
          //   rawSourceData.source.note,
          //   modGain,
          //   t0,
          //   t1,
          //   t2,
          //   t5,
          //   t6
          // );
        } else if (sustainLevel > 0 && t3 >= t5) {
          // case 4 hold is past end, so delay, attack, hold, release
          if (t0 != t1) {
            vol.gain.setValueAtTime(min, t0);
            vol.gain.setValueAtTime(min, t1);
          } else vol.gain.setValueAtTime(modGain, t0);
          if (t1 != t2) {
            vol.gain.exponentialRampToValueAtTime(modGain, t2);
            vol.gain.setValueAtTime(modGain, t2);
          }
          vol.gain.setValueAtTime(modGain, t5);
          vol.gain.cancelAndHoldAtTime(t5);
          vol.gain.exponentialRampToValueAtTime(min, t6);
          // console.log(
          //   "sustainlevel > 0 && hold >= end, note, modGain, t0, t1, t2, t3, stop, release",
          //   rawSourceData.source.note,
          //   modGain,
          //   t0,
          //   t1,
          //   t2,
          //   t3,
          //   t5,
          //   t6
          // );
        } else if (sustainLevel > 0 && t4 >= t5) {
          // case 5 decay is past end, so delay, attack, hold, partial decay, release
          if (t0 != t1) {
            vol.gain.setValueAtTime(min, t0);
            vol.gain.setValueAtTime(min, t1);
          } else vol.gain.setValueAtTime(modGain, t0);
          if (t1 != t2) {
            vol.gain.exponentialRampToValueAtTime(modGain, t2);
            vol.gain.setValueAtTime(modGain, t2);
          }
          if (t2 != t3) vol.gain.setValueAtTime(modGain, t3);
          const minDecay: number =
            t3 != t4 ? modGain + ((modGain - min) * (t5 - t3)) / (t3 - t4) : modGain;
          vol.gain.setValueAtTime(modGain, t3);
          vol.gain.exponentialRampToValueAtTime(minDecay, t5);
          vol.gain.setValueAtTime(minDecay, t5);
          vol.gain.cancelAndHoldAtTime(t5);
          vol.gain.exponentialRampToValueAtTime(min, t6);
          // console.log(
          //   "sustainlevel > 0 && decay >= end, note, modGain, minDecay, t0, t1, t2, t3, t4, stop, release",
          //   rawSourceData.source.note,
          //   modGain,
          //   minDecay,
          //   t0,
          //   t1,
          //   t2,
          //   t3,
          //   t4,
          //   t5,
          //   t6
          // );
        } else if (sustainLevel > 0 && t4 <= t5) {
          // case 6 - decay complete before stop time - delay, attack, hold, decay, no release
          if (t0 != t1) {
            vol.gain.setValueAtTime(min, t0);
            vol.gain.setValueAtTime(min, t1);
          } else vol.gain.setValueAtTime(modGain, t0);
          if (t1 != t2) {
            vol.gain.exponentialRampToValueAtTime(modGain, t2);
            vol.gain.setValueAtTime(modGain, t2);
          }
          if (t2 != t3) vol.gain.setValueAtTime(modGain, t3);
          if (t3 != t4) {
            vol.gain.exponentialRampToValueAtTime(min, t4);
            vol.gain.setValueAtTime(min, t4);
          }
          vol.gain.cancelAndHoldAtTime(t4);
          // console.log(
          //   "sustainLevel > 0 && decay <= end, note, modGain, t0, t1, t2, t3, t4 stop",
          //   rawSourceData.source.note,
          //   modGain,
          //   t0,
          //   t1,
          //   t2,
          //   t3,
          //   t4,
          //   t5
          // );
        } else {
          vol.gain.value = gain;
          // console.log("no condition set - set gain");
        }
      } else vol.gain.value = min;
    }

    // array buffer exists
    else vol.gain.value = v2g(rawSourceData.vol.value);

    // build pan
    const panner: StereoPannerNode = ctx.createStereoPanner();
    panner.pan.value = rawSourceData.panner.value;
    // connect everything
    source.connect(vol).connect(panner).connect(destination);
    // connect the reverb if implemented
    if (rawSourceData.gen.type == GENERATORTYPE.Algorithmic) {
      const gen = rawSourceData.gen as Algorithmic;
      if (gen.reverbDecay > 0 && gen.reverbDuration > 0) {
        gen.setContext(ctx);
        gen.connect(vol, destination);
      }
    }
    return {
      gen: rawSourceData.gen,
      source,
      sourceIndex,
      vol,
      panner,
      stopTime: rawSourceData.source.stopTime,
    };
  } else {
    return {
      gen: rawSourceData.gen,
      source: ctx.createBufferSource(),
      sourceIndex,
      vol: ctx.createGain(),
      panner: ctx.createStereoPanner(),
      stopTime: rawSourceData.gen.stopTime,
    };
  }
}
