export function sawtoothModulator
    (time: number, startTime: number, baseValue: number, frequency: number, amplitude: number, phase: number): number {
    const period: number = 1000 / frequency;
    const tPhase: number = period * phase / 360;
    const t0: number = (time + tPhase) % period;
    const tOffset: number = (t0 < period / 2 ? t0 : t0 - period / 2)
    const result: number =
        baseValue + amplitude / 2 - 2 * amplitude * tOffset / period;
    return result;
}