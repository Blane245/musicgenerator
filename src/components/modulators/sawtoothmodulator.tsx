export function sawtoothModulator
    (time: number, startTime: number, baseValue: number, frequency: number, amplitude: number, phase: number): number {
    const currentPhase: number = (frequency / 1000.0 * (time - startTime) * 360.0 + phase) % 360.0;
    const result: number = 
        baseValue - amplitude / 180.0 * (currentPhase - 180.0)
    return result;
}