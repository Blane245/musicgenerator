// import { linearInterpolate } from "utils/interpolation";
// import { bounce, pantoLeftRight } from "./panutils";
// import { DELTAPAN, PanParameters, SAMPLERATE } from "types";
// import RandomNumber from "classes/randomnumber";

// interface PanWalkProps {
//   sample: Float32Array[];
//   parameters: PanParameters;
//   rN: RandomNumber;
// }
// export default function panWalk(props: PanWalkProps) {
//   const { sample, parameters, rN } = props;
//   const deltaT: number = 1.0 / SAMPLERATE;
//   const interval: number = parameters.cycleTime;

//   const deltaPan: number = DELTAPAN; // tuned by experiment
//   let walk: number = Math.sign(rN.rand() - 0.5) * deltaPan;
//   let pan1: number = 2 * (rN.rand() - 0.5);
//   let currentInterval: number = 0;
//   let pan2: number = bounce(pan1, walk, -1, 1);
//   for (let i = 0; i < sample[0].length; i++) {
//     if (currentInterval >= interval) {
//       // interval has expired. get the new pan value
//       currentInterval = 0;
//       pan1 = pan2;
//       walk = Math.sign(rN.rand() - 0.5) * deltaPan;
//       pan2 = bounce(pan1, walk, -1, 1);
//     }

//     // interpolate pan from lastpan to pan based on current time with the interval
//     const pan: number = linearInterpolate(
//       currentInterval,
//       0,
//       interval,
//       pan1,
//       pan2,
//     );

//     // apply this pan to the channels
//     const { left, right } = pantoLeftRight(pan);
//     sample[0][i] = sample[0][i] * left;
//     sample[1][i] = sample[1][i] * right;
//     currentInterval += deltaT;
//   }
//   return;
// }
