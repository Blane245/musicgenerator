import { GainEnvelope } from "types";
import { linearInterpolate } from "utils/interpolation";

// const tremeloDelta: number = 0.01; // 10 ms between tremolo samples
export default function buildEnvelope(
  delayEnd: number,
  attackEnd: number,
  holdEnd: number,
  decayEnd: number,
  noteEnd: number,
  releaseEnd: number,
  volumeGain: number,
  sustainGain: number,
  attenuation: number
): { envelope: GainEnvelope; noteEndGain: number } {
  // get the envelope curve
  let noteEndGain: number = 0;
  const envelope: { t: number; g: number }[] = [{ t: 0, g: 0 }];
  if (noteEnd < delayEnd) {
    envelope.push({ t: noteEnd, g: 0 });
  } else {
    envelope.push({ t: delayEnd, g: 0 });
  }

  if (noteEnd >= delayEnd && noteEnd < attackEnd) {
    noteEndGain = linearInterpolate(noteEnd, delayEnd, attackEnd, 0, 1);
    envelope.push({ t: noteEnd, g: noteEndGain });
    if (noteEnd != releaseEnd) envelope.push({ t: releaseEnd, g: 0 });
  } else if (noteEnd >= attackEnd) {
    envelope.push({ t: attackEnd, g: volumeGain * attenuation });
    noteEndGain = volumeGain * attenuation;
  }

  if (noteEnd >= attackEnd && noteEnd < holdEnd) {
    envelope.push({ t: noteEnd, g: volumeGain * attenuation });
    if (noteEnd != releaseEnd) envelope.push({ t: releaseEnd, g: 0 });
    noteEndGain = volumeGain * attenuation;
  } else if (noteEnd >= holdEnd) {
    envelope.push({ t: holdEnd, g: volumeGain * attenuation });
    noteEndGain = volumeGain * attenuation;
  }

  if (noteEnd >= holdEnd && noteEnd < decayEnd) {
    noteEndGain = linearInterpolate(
      noteEnd,
      holdEnd,
      decayEnd,
      noteEndGain,
      sustainGain
    );
    envelope.push({ t: noteEnd, g: noteEndGain });
    if (noteEnd != releaseEnd) envelope.push({ t: releaseEnd, g: 0 });
  } else if (noteEnd >= decayEnd) {
    envelope.push({ t: decayEnd, g: sustainGain });
    envelope.push({ t: noteEnd, g: sustainGain });
    noteEndGain = sustainGain;
  }

  envelope.push({ t: releaseEnd, g: 0 });

   return { envelope, noteEndGain };
  // now that the basic envelope has been built, apply tremolo if present
  // if (tremolo.values.depth == 0 || tremolo.values.speed == 0 || !tremoloEnabled)
  //   return { envelope, noteEndGain };
  // const newEnvelope: { t: number; g: number }[] = [];
  // const endTime: number = envelope[envelope.length - 1].t;
  // const deltaT: number = tremeloDelta;
  // let envelopIndex: number = 0;
  // for (let t = 0; t <= endTime; t += deltaT) {
  //   if (envelopIndex <= envelope.length - 2 &&  t > envelope[envelopIndex + 1].t)
  //     envelopIndex = Math.min(envelopIndex + 1, envelope.length - 1);
  //   const nextIndex:number = Math.min(envelopIndex + 1, envelope.length - 1);
  //   const currentGain: number = linearInterpolate(t, envelope[envelopIndex].t ,
  //       envelope[nextIndex].t, envelope[envelopIndex].g, envelope[nextIndex].g);
  //   const deltaGain: number = dBToGain(tremolo.getCurrentValue(t, 0));
  //   // console.log('envelope: current, delta, total gain', currentGain, deltaGain, Math.min(Math.max(currentGain + deltaGain, 0),1));
  //   newEnvelope.push({ t: t, g: Math.min(Math.max(currentGain + deltaGain, 0),1) });
  // }
  // return { envelope: newEnvelope, noteEndGain };
}
