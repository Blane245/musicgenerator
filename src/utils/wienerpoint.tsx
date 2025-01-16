// gets the next value in a wiener series with parameters alpha and sigma

import { gaussianRandom } from "./gaussianrandom";

// given a time, an initial value at t=0 and an allowed lo and hi values
export function wienerPoint(
  time: number,
  initialValue: number,
  alpha: number,
  sigma: number,
  lo: number,
  hi: number
): number {
  const result: number =
    sigma == 0 || time == 0
      ? initialValue
      : initialValue +
        alpha * time +
        gaussianRandom(0, sigma * Math.sqrt(time));
  return Math.min(hi, Math.max(lo, result));
}
