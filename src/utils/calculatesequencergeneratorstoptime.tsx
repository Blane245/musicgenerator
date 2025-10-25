// the stop time of a sequencer is dependent on the items in the note and the speed
// as it changes during the sequence. Each note may be running at a different

import { AlgorithmValues } from "classes/algorithmvalues";
import { SequenceItem } from "classes/sequenceitems";
import { Algorithm } from "types";

// Each note in a sequencer may be runniing at a different speed.
// The total run time is the sum of these the beat size / speed over the note sequence
export function calulateSequencerGeneratorStopTime(
  startTime: number,
  noteItems: SequenceItem[],
  speedP: AlgorithmValues
): number {
  if (noteItems.length == 0) return startTime;
  let time: number = 0;
  for (let i = 0; i < noteItems.length; i++) {
    const beats = noteItems[i].beats;
    const speed = speedP.getCurrentValue(time, beats);
    time += speed != 0 ? (beats * 60) / speed : 0;
  }
  return startTime + time;
}
