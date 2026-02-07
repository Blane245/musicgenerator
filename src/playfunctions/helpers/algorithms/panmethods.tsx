import { linearInterpolate } from "utils/interpolation";
import { bounce, pantoLeftRight } from "./panutils";
import { DELTAPAN, PanParameters, RMSFACTOR, SAMPLERATE } from "types";
import RandomNumber from "classes/randomnumber";
import continuousProbability from "utils/probability/continuousprobability";
import intervalProbabilty from "utils/probability/intervalprobability";
import probabilityLookup from "utils/probability/probabilitylookup";
import { gaussianRandom } from "utils/probability/gaussianrandom";

interface PanWalkProps {
  sample: Float32Array[];
  parameters: PanParameters;
  rN: RandomNumber;
}
export function panWalk(props: PanWalkProps) {
  const { sample, parameters, rN } = props;
  const deltaT: number = 1.0 / SAMPLERATE;
  const interval: number = parameters.cycleTime;

  const deltaPan: number = DELTAPAN; // tuned by experiment
  let walk: number = Math.sign(rN.rand() - 0.5) * deltaPan;
  let pan1: number = 2 * (rN.rand() - 0.5);
  let currentInterval: number = 0;
  let pan2: number = bounce(pan1, walk, -1, 1);
  for (let i = 0; i < sample[0].length; i++) {
    if (currentInterval >= interval) {
      // interval has expired. get the new pan value
      currentInterval = 0;
      pan1 = pan2;
      walk = Math.sign(rN.rand() - 0.5) * deltaPan;
      pan2 = bounce(pan1, walk, -1, 1);
    }

    // interpolate pan from lastpan to pan based on current time with the interval
    const pan: number = linearInterpolate(
      currentInterval,
      0,
      interval,
      pan1,
      pan2,
    );

    // apply this pan to the channels
    const { left, right } = pantoLeftRight(pan);
    sample[0][i] = sample[0][i] * left;
    sample[1][i] = sample[1][i] * right;
    currentInterval += deltaT;
  }
  return;
}
interface PanGlideProps {
  sample: Float32Array[];
  parameters: PanParameters;
  rN: RandomNumber;
}

// apply the pan glide algorithm to the samples
// pan segment durations are defined by the parameter cycleTime
// the number of points on this time line is 10
export function panGlide(props: PanGlideProps) {
  const { sample, parameters, rN } = props;
  const length: number = sample[0].length;
  const deltaT: number = 1.0 / SAMPLERATE;

  // get the distribution of pan transistion, 10 intervals on a span of 2 with 0.01 resolution
  const [Pd, Nd] = continuousProbability(10, parameters.cycleTime, 0.01); // d=10 points, length=2 (-1, +1), v=20/200
  let currentInterval: number = 0;

  // random first pan
  let pan1: number = intervalProbabilty(2, rN) - 1; // between -1 and +1
  let duration: number = 0;
  while (duration == 0) {
    duration = probabilityLookup(Pd, Nd, rN.rand()); // length (sec) of this glissando
  }
  let speed: number = gaussianRandom(0, RMSFACTOR * duration, rN); // pan units/sec
  let pan2: number = bounce(pan1, duration * speed, -1, 1);
  for (let i = 0; i < length; i++) {
    if (currentInterval >= duration) {
      currentInterval = 0;
      pan1 = pan2;
      duration = 0;
      while (duration == 0) {
        duration = probabilityLookup(Pd, Nd, rN.rand());
      }
      speed = gaussianRandom(0, RMSFACTOR * duration, rN);
      pan2 = bounce(pan1, duration * speed, -1, 1);
    }
    const pan = linearInterpolate(currentInterval, 0, duration, pan1, pan2);
    const { left, right } = pantoLeftRight(pan);
    sample[0][i] = sample[0][i] * left;
    sample[1][i] = sample[1][i] * right;
    currentInterval += deltaT;
  }
  return;
}
