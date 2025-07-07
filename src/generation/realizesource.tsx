// create a source/gain/pan set from the raw source data and
// connect it to the destination
// there are several use cases for the gain envelop
// see volumeprocessing.md for details
import { Algorithmic, AudioFile } from "../classes/generators";
import { attenuate, precision } from "../sfcomponents/util";
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
  // the source will either Silent, Algorithmic, or AudioFile
  if (rawSourceData.gen.type == GENERATORTYPE.Algorithmic) {
    source.buffer = ctx.createBuffer(
      1,
      rawSourceData.source.sample[0].length,
      rawSourceData.source.sampleRate
    );
    const cD: Float32Array = source.buffer.getChannelData(0);
    cD.set(rawSourceData.source.sample[0]);
  } else if (rawSourceData.gen.type == GENERATORTYPE.AudioFile) {
    (rawSourceData.gen as AudioFile).getSample(ctx, source);
  }
  if (rawSourceData.gen.type != GENERATORTYPE.Silent) {
    source.loopStart =
      rawSourceData.source.loopStart / rawSourceData.source.sampleRate;
    source.loopEnd =
      rawSourceData.source.loopEnd / rawSourceData.source.sampleRate;
    source.loop = rawSourceData.source.loop;
    source.playbackRate.value = rawSourceData.source.playbackRate;
    // build gain
    const vol: GainNode = ctx.createGain();
    // sample exists
    if (rawSourceData.source.sample) {
      const minGain = 0.001;
      const gain: number = v2g(rawSourceData.vol.value) * attenuate(1, rawSourceData.vol.initialAttenuation / 10);
      if (gain > minGain) {
        const t0: number = precision(rawSourceData.source.startTime,2);
        let t1: number = precision(rawSourceData.vol.delayInterval + t0, 2);
        let t2: number = precision(rawSourceData.vol.attackInterval + t1,2 );
        let t3: number = precision(rawSourceData.vol.holdInterval + t2,2);
        let t4: number = precision(rawSourceData.vol.decayInterval + t3,2);
        const t5: number = precision(rawSourceData.source.stopTime - rawSourceData.vol.releaseInterval,2);
        const t6: number = precision(rawSourceData.source.stopTime,2);
        const sustainGain: number = precision(rawSourceData.vol.sustainLevel * gain, 2);

        // make use case adjustments

        // case 1 - t4 <= t5 (full delay, attack, hold, decay)
        if (t4 <= t5) {
          vol.gain.setValueAtTime(minGain, t0);
          vol.gain.setValueAtTime(minGain, t1); // delay
          vol.gain.exponentialRampToValueAtTime(gain, t2); // attack
          vol.gain.setValueAtTime(gain, t2);
          vol.gain.setValueAtTime(gain, t3); // hold
          vol.gain.exponentialRampToValueAtTime(sustainGain, t4); // decay
          vol.gain.setValueAtTime(sustainGain, t4);
          vol.gain.setValueAtTime(sustainGain, t5); // sustain
          vol.gain.cancelAndHoldAtTime(t5);
          vol.gain.exponentialRampToValueAtTime(minGain, t6); // release
        } 
        // case 2 - (full delay, attack, hold, interpolated decay)
        else if (t3 <= t5) { 
          vol.gain.setValueAtTime(minGain, t0);
          vol.gain.setValueAtTime(minGain, t1); // delay
          vol.gain.exponentialRampToValueAtTime(gain, t2); // attack
          vol.gain.setValueAtTime(gain, t2); 
          vol.gain.setValueAtTime(gain, t3); // hold
            vol.gain.exponentialRampToValueAtTime(minGain, t4); // decay
            vol.gain.cancelAndHoldAtTime(t5);
            vol.gain.exponentialRampToValueAtTime(minGain, t6); // release
        }
        // case 3 - (full delay and attack, shortened hold, no decay)
        else if (t2 <= t5) {
          vol.gain.setValueAtTime(minGain, t0);
          vol.gain.setValueAtTime(minGain, t1); // delay
          vol.gain.exponentialRampToValueAtTime(gain, t2); // attack
          vol.gain.setValueAtTime(gain, t2);
          vol.gain.setValueAtTime(gain, t5); // hold
          vol.gain.cancelAndHoldAtTime(t5);
          vol.gain.exponentialRampToValueAtTime(minGain, t6); // release
        }
        // case 4 - (full delay, shortened attack, no hold or decay)
        else if (t1 <= t5) {
          vol.gain.setValueAtTime(minGain, t0);
          vol.gain.setValueAtTime(minGain, t1); // delay
          vol.gain.exponentialRampToValueAtTime(gain, t2); // attack
          vol.gain.cancelAndHoldAtTime(t5);
          vol.gain.exponentialRampToValueAtTime(minGain, t6); // release
        }
        // case 5 - (shortened delay - note will not sound)
        else {
          vol.gain.value = minGain; // silence
        }

      } else vol.gain.value = minGain;
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
