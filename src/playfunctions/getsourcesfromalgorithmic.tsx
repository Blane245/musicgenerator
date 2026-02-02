// convert a generator to its audio samples and put sources

import SequenceValues from "classes/algorithms/sequencevalues";
import Chart from "classes/chart";
import Algorithmic from "classes/generators/algorithmic";
import RandomNumber from "classes/randomnumber";
import mergePanSamples from "helpers/mergepansamples";
import { ALGORITHMTYPE, VoiceHues } from "types";
import { getPresetNote } from "./presetProcessing/getpresetnote";

export default function getSourcesFromAlgorithmic(props: {
  generator: Algorithmic;
  audioBuffer: Float32Array[];
  chart: Chart;
  voiceHues: VoiceHues;
}): string {
  const { generator, audioBuffer, chart, voiceHues } = props;
  const {
    name,
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
  if (!preset) return `preset not defined for generator '${name}`;

  let time: number = startTime;
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

  // set the start values for each attributes
  generator.initialSequence();
  if (noteP.algorithmType != ALGORITHMTYPE.Sequencer) {
    // looping will either be on time or beats depending on whether the
    // not algorithm is a sequencer or not
    // loop through time from start to stop

    let {
      beat: hitBeat,
      note,
      speed,
      duration: noteDuration,
      attack,
      volume,
      pan,
    } = generator.getCurrentValues(time - startTime, 0);
    volume = volume + parent.volume;

    while (time < stopTime - 0.001) {
      const interval: number = Math.min(60.0 / speed, stopTime - time);

      const duration = (interval * noteDuration) / 100;
      if (hitBeat) {
        const presetSamples: Float32Array[] = getPresetNote(
          generator,
          preset,
          interval,
          duration,
          note,
          attack,
          volume, // in dB
          pan,
          time,
        );

        // merge the instrument samples with the total samples
        // and add it to the graphics
        const hue: number | undefined = voiceHues.get(
          soundFontFile + "|" + presetName,
        );

        mergePanSamples({
          time: startTime,
          panSamples: presetSamples,
          pitch1: note,
          pitch2: note,
          sampletime: time,
          audioBuffer,
          chart: chart,
          hue: hue,
        });
      }
      time += interval;

      ({
        beat: hitBeat,
        note,
        speed,
        duration: noteDuration,
        attack,
        volume,
        pan,
      } = generator.getCurrentValues(time - startTime, 0));
      volume = volume + parent.volume;
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
        pan,
      } = generator.getCurrentValues(time - startTime, beats);

      const totalVolume: number = volume + parent.volume;
      const interval: number = (beat * 60.0) / speed;
      const duration = (interval * noteDuration) / 100;

      if (note >= 0) {
        // Note may be a rest
        // get the pan samples and merge them with the total audio
        const presetSamples: Float32Array[] = getPresetNote(
          generator,
          preset,
          interval,
          duration,
          note,
          attack,
          totalVolume, // in dB
          pan,
          time,
        );
        const hue: number | undefined = voiceHues.get(
          soundFontFile + "|" + presetName,
        );

        mergePanSamples({
          time: startTime,
          panSamples: presetSamples,
          pitch1: note,
          pitch2: note,
          sampletime: time,
          audioBuffer,
          chart: chart,
          hue: hue,
        });
      }
      time += interval;
      beats += beat;
    }
  }
  return "";
}
