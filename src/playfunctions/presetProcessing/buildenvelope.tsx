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
}
