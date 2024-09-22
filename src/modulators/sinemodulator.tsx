export function sineModulator 
(time: number, startTime:number, baseValue: number, frequency: number, amplitude: number, phase:number): number {
// x = A * sin(f * (t - t0) + p) + base
const result:number = 
baseValue + 
amplitude * Math.sin(frequency * (time - startTime) * 2.0 * Math.PI + phase * (Math.PI / 180.0));
return result;
}