
// Standard Normal variate using Box-Muller transform.
export function gaussian(mean: number = 0, stdev: number = 1): number {
  if (stdev == 0) return mean;
  const u: number = 1 - rN.rand(); // Converting [0,1) to (0,1]
  const v: number = rN.rand();
  const z: number = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  // Transform to the desired mean and standard deviation:
  return z * stdev + mean;
}
