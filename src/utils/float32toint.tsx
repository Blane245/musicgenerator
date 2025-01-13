export function float32ToInt16(fl: number): number {
  let result: number = Math.max(-1, Math.min(1, fl));
  result = result * 32767;
  return Math.round(result);
}
export function float32ToUint16(fl: number): number {
  let result: number = Math.max(-1, Math.min(1, fl));
  result = (0.5 + result < 0 ? result * 32768 : result * 32767) | 0;
  return Math.round(result);
}
