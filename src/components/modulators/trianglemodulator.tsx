export function triangleModulator
    (time: number, startTime: number, baseValue: number, frequency: number, amplitude: number, phase: number): number {
    const currentPhase: number = (frequency / 1000.0 * (time) * 360.0 + phase) % 360.0;
    const result: number = (currentPhase < 180.0 ?
        baseValue + amplitude * (currentPhase - 90.0) / 180.0
        :
        baseValue - amplitude * (currentPhase - 270.0) / 180.0
    )
    return result;
}