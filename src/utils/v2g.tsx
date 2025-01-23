// convert volume setting to gain
// volume of 0 has a unity gain
export const v2g = (v: number): number => {
  return Math.max(Math.pow(2, v), 0.001);
};
