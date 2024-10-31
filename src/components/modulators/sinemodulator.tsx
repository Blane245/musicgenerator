export function sineModulator
    (time: number, baseValue: number, frequency: number, amplitude: number, phase: number): number {
    // x = A * sin(f * (t - t0) + p) + base
    const result: number =
        (frequency == 0 || amplitude == 0 ?
            baseValue :
            baseValue +
            amplitude * Math.sin(frequency / 1000.0 * (time) * 2.0 * Math.PI + phase * (Math.PI / 180.0)));
    return result;
}