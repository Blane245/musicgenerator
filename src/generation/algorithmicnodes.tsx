import { ALGORITHMTYPE, RawSourceData } from "../types";
import { Algorithmic } from "../classes/generators";
import { getPresetNote } from "../sfcomponents/loadpresetnote";
import {
  AlgorithmValues,
  MarkovianValues,
  OscillatorValues,
  WienerValues,
} from "classes/algorithmvalues";
import RandomNumber from "../classes/randomnumber";

export function getBufferSourceNodesFromAlgorithmic(
  gen: Algorithmic
): RawSourceData[] {
  const { startTime, stopTime, preset } = gen;
  if (!preset)
    throw new Error(`Preset not defined for generator '${gen.name}'`);
  if (!gen.noteP || !gen.speedP || !gen.volumeP || !gen.panP)
    throw new Error(
      `Parameter definition incomplete for generator '${gen.name}'`
    );
  let time: number = startTime;
  const sourceData: RawSourceData[] = [];

  const noteP: AlgorithmValues = gen.noteP;
  const speedP: AlgorithmValues = gen.noteP;
  const volumeP: AlgorithmValues = gen.noteP;
  const panP: AlgorithmValues = gen.noteP;
  const noteAlgorithm: ALGORITHMTYPE = noteP.algorithmType;
  const speedAlgorithm: ALGORITHMTYPE = speedP.algorithmType;
  const volumeAlgorithm: ALGORITHMTYPE = volumeP.algorithmType;
  const panAlgorithm: ALGORITHMTYPE = panP.algorithmType;

  // seed the random number generators for the algorithms that use randon numbers
  if (noteAlgorithm == ALGORITHMTYPE.Markovian)
    (noteP as MarkovianValues).values.rn = new RandomNumber(
      (noteP as MarkovianValues).values.seed
    );
  if (noteAlgorithm == ALGORITHMTYPE.Wiener)
    (noteP as WienerValues).values.rn = new RandomNumber(
      (noteP as WienerValues).values.seed
    );
  if (speedAlgorithm == ALGORITHMTYPE.Markovian)
    (speedP as MarkovianValues).values.rn = new RandomNumber(
      (speedP as MarkovianValues).values.seed
    );
  if (speedAlgorithm == ALGORITHMTYPE.Wiener)
    (speedP as WienerValues).values.rn = new RandomNumber(
      (speedP as WienerValues).values.seed
    );
  if (volumeAlgorithm == ALGORITHMTYPE.Markovian)
    (volumeP as MarkovianValues).values.rn = new RandomNumber(
      (volumeP as MarkovianValues).values.seed
    );
  if (volumeAlgorithm == ALGORITHMTYPE.Wiener)
    (volumeP as WienerValues).values.rn = new RandomNumber(
      (volumeP as WienerValues).values.seed
    );
  if (panAlgorithm == ALGORITHMTYPE.Markovian)
    (panP as MarkovianValues).values.rn = new RandomNumber(
      (panP as MarkovianValues).values.seed
    );
  if (panAlgorithm == ALGORITHMTYPE.Wiener)
    (panP as WienerValues).values.rn = new RandomNumber(
      (panP as WienerValues).values.seed
    );

  // set the start values for each attributes
  let note: number = 0;
  let speed: number = 0;
  let volume: number = 0;
  let pan: number = 0;
  switch (noteAlgorithm) {
    case ALGORITHMTYPE.Oscillator:
      note = (noteP as OscillatorValues).values.center;
      break;
    case ALGORITHMTYPE.Markovian:
      note = (noteP as MarkovianValues).values.startValue;
      break;
    case ALGORITHMTYPE.Wiener:
      note = (noteP as WienerValues).values.initialValue;
      break;
  }
  switch (speedAlgorithm) {
    case ALGORITHMTYPE.Oscillator:
      speed = (speedP as OscillatorValues).values.center;
      break;
    case ALGORITHMTYPE.Markovian:
      speed = (speedP as MarkovianValues).values.startValue;
      break;
    case ALGORITHMTYPE.Wiener:
      speed = (speedP as WienerValues).values.initialValue;
      break;
  }
  switch (volumeAlgorithm) {
    case ALGORITHMTYPE.Oscillator:
      volume = (volumeP as OscillatorValues).values.center;
      break;
    case ALGORITHMTYPE.Markovian:
      volume = (volumeP as MarkovianValues).values.startValue;
      break;
    case ALGORITHMTYPE.Wiener:
      volume = (volumeP as WienerValues).values.initialValue;
      break;
  }
  switch (panAlgorithm) {
    case ALGORITHMTYPE.Oscillator:
      pan = (panP as OscillatorValues).values.center;
      break;
    case ALGORITHMTYPE.Markovian:
      pan = (panP as MarkovianValues).values.startValue;
      break;
    case ALGORITHMTYPE.Wiener:
      pan = (panP as WienerValues).values.initialValue;
      break;
  }

  // get the noise parameters
  const noiseAmplitude: number = gen.noiseAmplitude;
  const noiseDispersion: number = gen.noiseDispersion;

  // loop through time from start to stop
  while (time < stopTime) {
    const duration = 60.0 / speed;
    const connections: RawSourceData[] = getPresetNote(
      gen,
      preset,
      noiseAmplitude,
      noiseDispersion,
      duration,
      note,
      volume,
      pan,
      time
    );
    sourceData.push(...connections);
    time += duration;
    if (time < stopTime) {
      // get the next value for each parameter
      switch (noteAlgorithm) {
        case ALGORITHMTYPE.Oscillator:
          note = (noteP as OscillatorValues).getCurrentValue(time);
          break;
        case ALGORITHMTYPE.Markovian:
          note = (noteP as MarkovianValues).getCurrentValue(time);
          break;
        case ALGORITHMTYPE.Wiener:
          note = (noteP as WienerValues).getCurrentValue(time);
          break;
      }
      switch (speedAlgorithm) {
        case ALGORITHMTYPE.Oscillator:
          speed = (speedP as OscillatorValues).getCurrentValue(time);
          break;
        case ALGORITHMTYPE.Markovian:
          speed = (speedP as MarkovianValues).getCurrentValue(time);
          break;
        case ALGORITHMTYPE.Wiener:
          speed = (speedP as WienerValues).getCurrentValue(time);
          break;
      }
      switch (volumeAlgorithm) {
        case ALGORITHMTYPE.Oscillator:
          volume = (volumeP as OscillatorValues).getCurrentValue(time);
          break;
        case ALGORITHMTYPE.Markovian:
          volume = (volumeP as MarkovianValues).getCurrentValue(time);
          break;
        case ALGORITHMTYPE.Wiener:
          volume = (volumeP as WienerValues).getCurrentValue(time);
          break;
      }
      switch (panAlgorithm) {
        case ALGORITHMTYPE.Oscillator:
          pan = (panP as OscillatorValues).getCurrentValue(time);
          break;
        case ALGORITHMTYPE.Markovian:
          pan = (panP as MarkovianValues).getCurrentValue(time);
          break;
        case ALGORITHMTYPE.Wiener:
          pan = (panP as WienerValues).getCurrentValue(time);
          break;
      }
    }
  }

  return sourceData;
}
