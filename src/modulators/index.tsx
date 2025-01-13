// waveform generators for midi, volume, and pan attributes
export function sawtoothModulator(
  time: number,
  baseValue: number,
  frequency: number,
  amplitude: number,
  phase: number
): number {
  const period: number = 1000 / frequency;
  const tPhase: number = (period * phase) / 360;
  const t0: number = (time + tPhase) % period;
  const tOffset: number = t0 < period / 2 ? t0 : t0 - period / 2;
  const result: number =
    baseValue + amplitude / 2 - (2 * amplitude * tOffset) / period;
  return result;
}

export function sineModulator(
  time: number,
  baseValue: number,
  frequency: number,
  amplitude: number,
  phase: number
): number {
  // x = A * sin(f * (t - t0) + p) + base
  const result: number =
    frequency == 0 || amplitude == 0
      ? baseValue
      : baseValue +
        amplitude *
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
  const currentPhase: number =
    ((frequency / 1000.0) * time * 360.0 + phase) % 360.0;
  const result: number =
    currentPhase < 180.0
      ? baseValue + amplitude / 2.0
      : baseValue - amplitude / 2.0;
  return result;
}

export function triangleModulator(
  time: number,
  baseValue: number,
  frequency: number,
  amplitude: number,
  phase: number
): number {
  const currentPhase: number =
    ((frequency / 1000.0) * time * 360.0 + phase) % 360.0;
  const result: number =
    currentPhase < 180.0
      ? baseValue + (amplitude * (currentPhase - 90.0)) / 180.0
      : baseValue - (amplitude * (currentPhase - 270.0)) / 180.0;
  return result;
}
