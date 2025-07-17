// waveform generators for midi, volume, and pan attributes
export function descendingSawtoothModulator(
  time: number,
  baseValue: number,
  frequency: number,
  amplitude: number,
  phase: number
): number {
  if (frequency != 0 && amplitude != 0) {
    const period: number = 1000 / frequency;
    const tPhase: number = (period * phase) / 360;
    const t0: number = (time + tPhase) % period;
    const result: number =
      baseValue + amplitude / 2 - amplitude * t0 / period;
    return result;
  } else {
    return baseValue;
  }
}

export function ascendingSawtoothModulator(
  time: number,
  baseValue: number,
  frequency: number,
  amplitude: number,
  phase: number
): number {
  if (frequency != 0 && amplitude != 0) {
    const period: number = 1000 / frequency;
    const tPhase: number = (period * phase) / 360;
    const t0: number = (time + tPhase) % period;
    const result = baseValue - amplitude / 2 +  amplitude * t0 / period;
    return result;
  } else {
    return baseValue;
  }
}

export function sineModulator(
  time: number,
  baseValue: number,
  frequency: number,
  amplitude: number,
  phase: number
): number {
  const result: number =
    frequency == 0 || amplitude == 0
      ? baseValue
      : baseValue +
        amplitude / 2 *
          Math.sin(
            (frequency / 1000.0) * time * 2.0 * Math.PI +
              phase * (Math.PI / 180.0)
          );
  return result;
}

export function squareModulator(
  time: number,
  baseValue: number,
  frequency: number,
  amplitude: number,
  phase: number
): number {
  if (frequency != 0 && amplitude != 0) {
    const currentPhase: number =
      ((frequency / 1000.0) * time * 360.0 + phase) % 360.0;
    const result: number =
      currentPhase < 180.0
        ? baseValue + amplitude / 2.0
        : baseValue - amplitude / 2.0;
    return result;
  } else {
    return baseValue;
  }
}

export function triangleModulator(
  time: number,
  baseValue: number,
  frequency: number,
  amplitude: number,
  phase: number
): number {
  if (frequency != 0 && amplitude != 0) {
    const currentPhase: number =
      ((frequency / 1000.0) * time * 360.0 + phase) % 360.0;
    const result: number =
      currentPhase < 180.0
        ? baseValue + (amplitude / 2 * (currentPhase - 90.0)) / 180.0
        : baseValue - (amplitude / 2 * (currentPhase - 270.0)) / 180.0;
    return result;
  } else {
    return baseValue;
  }
}
