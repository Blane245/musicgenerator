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
    console.log('source sample for note ', rawSourceData.source.note, 'length', cD.length);
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
      let gainCurve: string = `Gain Curve @${ctx.currentTime}::`;
      if (gain > minGain) {
        const t0: number = precision(rawSourceData.source.startTime,2);
        let t1: number = precision(rawSourceData.vol.delayInterval + t0, 2);
        let t2: number = precision(rawSourceData.vol.attackInterval + t1,2 );
        let t3: number = precision(rawSourceData.vol.holdInterval + t2,2);
        let t4: number = precision(rawSourceData.vol.decayInterval + t3,2);
        const t5: number = precision(rawSourceData.source.stopTime - rawSourceData.vol.releaseInterval,2);
        const t6: number = precision(rawSourceData.source.stopTime,2);
        const sustainGain: number = precision(rawSourceData.vol.sustainLevel * gain, 2);
        console.log('sustain gain', sustainGain, 'release interval', rawSourceData.vol.releaseInterval);

        // make use case adjustments
        // case 1 - t4 <= t5 (full delay, attack, hold, decay)
        if (t4 <= t5) {
          gainCurve+= "case 1: "
          if (t1 != t0) { 
            vol.gain.setValueAtTime(minGain, t0);
            vol.gain.setValueAtTime(minGain, t1); // delay
            gainCurve+= `@${t0} set to ${minGain}; `
            gainCurve+= `@${t1} set to ${minGain}; `
          }
          if (t2 != t1) {
            vol.gain.exponentialRampToValueAtTime(gain, t2); // attack
            gainCurve+= `@${t2} ramp to ${gain}; `
          }
          vol.gain.setValueAtTime(gain, t2);
          gainCurve+= `@${t2} set to ${gain}; `
          if (t3 != t2) {
            vol.gain.setValueAtTime(gain, t3); // hold
            gainCurve+= `@${t3} set to ${gain}; `
          }
          if (t4 != t3) {
            vol.gain.exponentialRampToValueAtTime(sustainGain, t4); // decay  
            gainCurve+= `@${t4} ramp to ${sustainGain}; `
          }
          vol.gain.setValueAtTime(sustainGain, t4); // hold
          gainCurve+= `@${t4} set to ${sustainGain}; `
          if (t5 != t4) {
            vol.gain.setValueAtTime(sustainGain, t5); // sustain
            gainCurve+= `@${t5} set to ${sustainGain}; `
          }
          vol.gain.cancelAndHoldAtTime(t5);
          gainCurve+= `@${t5}, cancel; `
          if (t6 != t5) {
            vol.gain.exponentialRampToValueAtTime(minGain, t6); // release
            gainCurve+= `@${t6} ramp to ${minGain}; `
          }
          else {
            vol.gain.setValueAtTime(minGain, t5 + 0.01)
            gainCurve+= `@${t5+0.01} set to ${minGain}; `
          }
        } 
        // case 2 - (full delay, attack, hold, interpolated decay)
        else if (t3 <= t5) {
          gainCurve+= "case 2: "

          if (t1 != t0) { 
            vol.gain.setValueAtTime(minGain, t0);
            vol.gain.setValueAtTime(minGain, t1); // delay
            gainCurve+= `@${t0} set to ${minGain}; `
            gainCurve+= `@${t1} set to ${minGain}; `
          }
          if (t2 != t1) {
            vol.gain.exponentialRampToValueAtTime(gain, t2); // attack
            gainCurve+= `@${t2} ramp to ${gain}; `
          }
          vol.gain.setValueAtTime(gain, t2);
          gainCurve+= `@${t2} set to ${gain}; `
          if (t3 != t2) {
            vol.gain.setValueAtTime(gain, t3); // hold
            gainCurve+= `@${t3} set to ${gain}; `
          }
          if (t4 != t3) {
            const t5Value = rampToTime(gain, sustainGain, t3, t4, t5);
            vol.gain.exponentialRampToValueAtTime(t5Value, t5); // decay to t5 
            gainCurve+= `@${t5} ramp to ${t5Value}; `
            vol.gain.setValueAtTime(t5Value, t5);
            gainCurve+= `@${t5} set to ${t5Value}; `
          }
          // vol.gain.cancelAndHoldAtTime(t5);
          // gainCurve+= `@${t5}, cancel; `
          if (t6 != t5) {
            vol.gain.exponentialRampToValueAtTime(minGain, t6); // release
            gainCurve+= `@${t6} ramp to ${minGain}; `
          }
          else {
            vol.gain.exponentialRampToValueAtTime(minGain, t5 + 1)
            gainCurve+= `@${t5+1} ramp to ${minGain}; `
          }
        }
        // case 3 - (full delay and attack, shortened hold, no decay)
        else if (t2 <= t5) {
          gainCurve+= "case 3: "
          if (t1 != t0) { 
            vol.gain.setValueAtTime(minGain, t0);
            vol.gain.setValueAtTime(minGain, t1); // delay
            gainCurve+= `@${t0} set to ${minGain}; `
            gainCurve+= `@${t1} set to ${minGain}; `
          }
          if (t2 != t1) {
            vol.gain.exponentialRampToValueAtTime(gain, t2); // attack
            gainCurve+= `@${t2} ramp to ${gain}; `
          }
          vol.gain.setValueAtTime(gain, t2); 
          gainCurve+= `@${t2} set to ${gain}; `
          vol.gain.setValueAtTime(gain, t5); // hold
          gainCurve+= `@${t2} set to ${gain}; `
          vol.gain.cancelAndHoldAtTime(t5);
          gainCurve+= `@${t5}, cancel; `
          if (t6 != t5) {
            vol.gain.exponentialRampToValueAtTime(minGain, t6); // release
            gainCurve+= `@${t6} ramp to ${minGain}; `
          }
          else {
            vol.gain.setValueAtTime(minGain, t5 + 0.01)
            gainCurve+= `@${t5+0.01} set to ${minGain}; `
          }
        }
        // case 4 - (full delay, shortened attack, no hold or decay)
        else if (t1 <= t5) {
          gainCurve+= "case 4: "
          if (t1 != t0) { 
            vol.gain.setValueAtTime(minGain, t0);
            vol.gain.setValueAtTime(minGain, t1); // delay
            gainCurve+= `@${t0} set to ${minGain}; `
            gainCurve+= `@${t1} set to ${minGain}; `
          }
          if (t5 != t1) {
            vol.gain.exponentialRampToValueAtTime(gain, t5); // attack
            gainCurve+= `@${t5} ramp to ${gain}; `
          }
          else {
            vol.gain.setValueAtTime(gain, t5);
            gainCurve+= `@${t5} set to ${gain}; `
          }
          vol.gain.cancelAndHoldAtTime(t5);
          gainCurve+= `@${t5}, cancel; `
          if (t6 != t5) {
            vol.gain.exponentialRampToValueAtTime(minGain, t6); // release
            gainCurve+= `@${t6} ramp to ${minGain}; `
          }
          else {
            vol.gain.setValueAtTime(minGain, t5 + 0.01)
            gainCurve+= `@${t5+0.01} set to ${minGain}; `
          }
        }
        // case 5 - (shortened delay - note will not sound)
        else {
          gainCurve+= "case 5: "
          vol.gain.value = minGain; // silence
          gainCurve+= `constant gain, ${minGain} `
        }

      } else {
        vol.gain.value = minGain;
        gainCurve+= `No case: constant gain, ${minGain} `
      }
      console.log(gainCurve);
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
        gen.connect(panner, destination);
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
function rampToTime(v0: number, v1: number, t0: number, t1: number, time: number) :number {
  if (time > t1) return v1;
  else return (v0 * ((v1/v0)**((time-t0)/(t1-t0))));
}
