//
// this genertors a random sample for the duration the generator
// and the modulated the volume and pan rules similarly to
// the SFPG generatr
// each node time starts when the last one stops as determined by the spped attribute

import Noise from "../classes/noise";
import { RawSourceData } from "../types";
import { setRandomSeed } from "../utils/seededrandom";

// the node's midi, volume, and pan values is plugged in from their respective chains
export function getBufferSourceNodesFromNoise(
  gen: Noise,
): RawSourceData[] {

  const { startTime, stopTime, duration } = gen;
  const sourceData: RawSourceData[] = [];

  setRandomSeed(gen.seed);
  const steps = Math.ceil((stopTime - startTime) / duration);
  for (let i = 0; i < steps; i++) {
    const time: number = i * duration + startTime;
    const { sample, volume, pan } = gen.getCurrentValues(time, duration);

    const attackInterval = Math.max(Math.min(0.1*duration,0.01), 0.01);
    const releaseInterval = Math.max(Math.min(0.1*duration,0.01),0.01);
    const holdInterval = duration-attackInterval;
    const newDuration = attackInterval+holdInterval+releaseInterval;
    sourceData.push({
      gen,
      source:{
        sample: [sample],
        sampleRate:gen.sampleRate,
        playbackRate:1.0,
        loopStart:0,
        loopEnd:0,
        loop:false,
        startTime: time,
        duration: newDuration,
        stopTime: time + newDuration,
        started: false,
      },
      panner:{
        value: pan,
      },
      vol:{
        attackInterval,
        holdInterval,
        releaseInterval,
        value:volume,
      },
    }
    );
  }
  return (sourceData);
}
