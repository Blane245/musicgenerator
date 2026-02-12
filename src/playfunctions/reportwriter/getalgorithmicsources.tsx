import SequenceValues from "classes/algorithms/sequencevalues";
import Algorithmic from "classes/generators/algorithmic";
import RandomNumber from "classes/randomnumber";
import { getPresetReport } from "playfunctions/presetProcessing/getpresetreport";
import { ALGORITHMTYPE, ReportSourceData } from "types";

export default function getAlgorithmicSources(
  generator: Algorithmic,
): ReportSourceData[] {
  // mimic the build source from algorithmic
  const {
    startTime,
    stopTime,
    preset,
    presetName,
    soundFontFile,
    noteP,
    attackP,
    speedP,
    durationP,
    volumeP,
    panP,
    parent,
  } = generator;
  if (!preset) return [];
  let time = startTime;
  // seed the random number generators for the algorithms that use randon numbers
  if (noteP.values && noteP.values["rn"])
    noteP.values["rn"] = new RandomNumber(noteP.values["seed"]);
  if (speedP.values && speedP.values["rn"])
    speedP.values["rn"] = new RandomNumber(speedP.values["seed"]);
  if (attackP.values && attackP.values["rn"])
    attackP.values["rn"] = new RandomNumber(attackP.values["seed"]);
  if (durationP.values && durationP.values["rn"])
    durationP.values["rn"] = new RandomNumber(durationP.values["seed"]);
  if (volumeP.values && volumeP.values["rn"])
    volumeP.values["rn"] = new RandomNumber(volumeP.values["seed"]);
  if (panP.values && panP.values["rn"])
    panP.values["rn"] = new RandomNumber(panP.values["seed"]);
  generator.initialSequence();
  const result: ReportSourceData[] = [];
  if (noteP.algorithmType != ALGORITHMTYPE.Sequencer) {
    while (time < stopTime - 0.001) {
      let {
        beat: hitBeat,
        note,
        speed,
        duration: noteDuration,
        attack,
        volume,
      } = generator.getCurrentValues(time - startTime, 0);
      volume = volume + parent.volume;
      const interval: number = Math.min(60.0 / speed, stopTime - time);
      if (preset) {
        const duration = (interval * noteDuration) / 100;
        if (hitBeat) {
          const sourceReport: ReportSourceData = getPresetReport({
            generatorName: generator.name,
            startTime: time,
            stopTime: time + duration,
            soundFontName: soundFontFile,
            presetName,
            preset,
            isLooping: generator.isLooping,
            pitch: note,
            interval,
            duration,
            attackEnabled: generator.attackEnabled,
            velocity: attack,
            volume,
          });
          result.push(sourceReport);
        }
      }
      time += interval;
    }
  } else {
    // sequencing based on note beats
    let time: number = startTime;
    const seqNoteP: SequenceValues = (noteP as SequenceValues).copy();
    let beats: number = 1;
    const transpose: number = seqNoteP.values.transpose;
    seqNoteP.setReverse();
    seqNoteP.setReflect();

    for (
      let iItem = 0;
      iItem < seqNoteP.values.items.length && time <= stopTime;
      iItem++
    ) {
      const note =
        seqNoteP.values.items[iItem].value > 0
          ? seqNoteP.values.items[iItem].value + transpose
          : -1;
      const beat: number = seqNoteP.values.items[iItem].beats;
      let {
        speed,
        duration: noteDuration,
        attack,
        volume,
      } = generator.getCurrentValues(time - startTime, beats);

      const interval: number = (beat * 60.0) / speed;
      const duration = (interval * noteDuration) / 100;
      volume+=generator.parent.volume;

      if (note >= 0) {
        // Note may be a rest
        // get the pan samples and merge them with the total audio
        const sourceReport: ReportSourceData = getPresetReport({
          generatorName: generator.name,
          startTime: time,
          stopTime: time + duration,
          soundFontName: soundFontFile,
          presetName,
          preset,
          isLooping: generator.isLooping,
          pitch: note,
          interval,
          duration,
          attackEnabled: generator.attackEnabled,
          velocity: attack,
          volume,
        });
        result.push(sourceReport);
      }
      time += interval;
      beats += beat;
    }
  }
  return result;
}
