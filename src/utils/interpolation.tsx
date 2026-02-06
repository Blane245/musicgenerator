export function linearInterpolate (x: number, x0: number, x1: number, y0:number, y1: number): number {
    if (x1 == x0) return y0;
    return y0 + (x - x0) * (y1 - y0) / (x1 - x0);
}

/**
 * Resample audio from one sample rate to another with optional pitch shifting
 * @param inputSample - The audio samples to resample
 * @param inputRate - The sample rate of the input audio
 * @param outputRate - The desired output sample rate
 * @param duration - output duration in seconds
 * @param cents - Pitch shift. Can be a number for constant pitch (in cents), or an object {startCents, endCents} for glissando. Default: 0
 * @param looping - looping parameters {enabled, start, end}
 * @param vibrato - vibrato object with getValue(t: number): number method for dynamic pitch modulation
 * @returns Resampled audio as Float32Array
 */
export function resampleAudio(
  inputSample: Float32Array,
  inputRate: number,
  outputRate: number,
  duration: number,
  cents: number | { startCents: number; endCents: number } = 0,
  looping: { enabled: boolean; start: number; end: number },
  vibrato?: { getCurrentValue(t: number): number }
): Float32Array {
  const baseRatio = (outputRate / inputRate);
  
  // Determine if using glissando
  const glissandoStart = typeof cents === 'object' ? cents.startCents : cents;
  const glissandoEnd = typeof cents === 'object' ? cents.endCents : cents;

  // Determine output length
  let outputLength:number = Math.ceil(duration * outputRate);

  const output = new Float32Array(outputLength).fill(0);
  const loopEnabled = looping?.enabled ?? false;
  const loopStart = looping?.start ?? 0;
  const loopEnd = looping?.end ?? inputSample.length - 1;
  const loopLength = loopEnd - loopStart + 1;

  let inputPositionAccumulator = 0;

  for (let i = 0; i < outputLength; i++) {
    // Calculate current time in seconds from the start of the output
    const t = i / outputRate;

    // Calculate current pitch ratio (constant or glissando)
    let currentCents: number;
    if (typeof cents === 'object') {
      const progress = i / outputLength;
      currentCents = glissandoStart + (glissandoEnd - glissandoStart) * progress;
    } else {
      currentCents = glissandoStart;
    }

    // Apply vibrato if present
    if (vibrato) {
      currentCents += vibrato.getCurrentValue(t);
    }

    const pitchRatio = Math.pow(2, currentCents / 1200);
    const effectiveRatio = (pitchRatio / baseRatio);

    // Accumulate input position for continuous pitch change
    inputPositionAccumulator += effectiveRatio;
    let inputPosition = inputPositionAccumulator;

    // Handle looping
    if (loopEnabled && inputPosition > loopEnd) {
      const excess = inputPosition - loopEnd;
      inputPosition = loopStart + (excess % loopLength);
    }

    const index = Math.floor(inputPosition);
    const fraction = inputPosition - index;

    let sample1 = 0;
    let sample2 = 0;

    // Get first sample with looping
    if (index < inputSample.length) {
      sample1 = inputSample[index];
    } else if (loopEnabled) {
      // const wrappedIndex = loopStart + ((index - loopStart) % loopLength);
      const wrappedIndex = loopStart;
      sample1 = inputSample[wrappedIndex];
    }

    // Get second sample with looping
    if (index + 1 < inputSample.length) {
      sample2 = inputSample[index + 1];
    } else if (loopEnabled) {
      // const wrappedIndex = loopStart + ((index + 1 - loopStart) % loopLength);
      const wrappedIndex = loopStart;
      sample2 = inputSample[wrappedIndex];
    } else {
      sample2 = sample1;
    }
    if (Number.isNaN(sample1) || Number.isNaN(sample2)) {
      console.log('error in interpolation sample1, sample2, index', sample1, sample2, index)
    }
    output[i] = sample1 * (1 - fraction) + sample2 * fraction;
  }

  return output;
}

/**
 * Resample audio with cubic interpolation for higher quality
 * @param inputSample - The audio samples to resample
 * @param inputRate - The sample rate of the input audio
 * @param outputRate - The desired output sample rate
 * @param duration - output duration in seconds
 * @param cents - Optional pitch shift. Can be a number for constant pitch (in cents), or an object {startCents, endCents} for glissando. Default: 0
 * @param looping - Optional looping parameters {enabled, start, end}
 * @param vibrato - Optional vibrato object with getValue(t: number): number method for dynamic pitch modulation
 * @returns Resampled audio as Float32Array
 */
export function resampleAudioCubic(
  inputSample: Float32Array,
  inputRate: number,
  outputRate: number,
  duration: number,
  cents: number | { startCents: number; endCents: number } = 0,
  looping?: { enabled: boolean; start: number; end: number },
  vibrato?: { getCurrentValue(t: number): number }
): Float32Array {
  const baseRatio = (outputRate / inputRate);

  // Determine if using glissando
  const glissandoStart = typeof cents === 'object' ? cents.startCents : cents;
  const glissandoEnd = typeof cents === 'object' ? cents.endCents : cents;

  // Determine output length
  let outputLength: number = Math.ceil(duration * outputRate);
  const output = new Float32Array(outputLength);
  const loopEnabled = looping?.enabled ?? false;
  const loopStart = looping?.start ?? 0;
  const loopEnd = looping?.end ?? inputSample.length - 1;
  const loopLength = loopEnd - loopStart + 1;

  // TODO need to fix this. wrapped index and probably excess are wrong
  const getSample = (idx: number): number => {
    let index = idx;
    if (loopEnabled && index > loopEnd) {
      const excess = index - loopEnd;
      index = loopStart + (excess % loopLength);
    }
    if (index >= 0 && index < inputSample.length) {
      return inputSample[index];
    } else if (loopEnabled) {
      // const wrappedIndex = loopStart + ((index - loopStart) % loopLength);
      const wrappedIndex = loopStart;
      return inputSample[wrappedIndex];
    }
    return 0;
  };

  let inputPositionAccumulator = 0;

  for (let i = 0; i < outputLength; i++) {
    // Calculate current time in seconds from the start of the output
    const t = i / outputRate;

    // Calculate current pitch ratio (constant or glissando)
    let currentCents: number;
    if (typeof cents === 'object') {
      const progress = i / outputLength;
      currentCents = glissandoStart + (glissandoEnd - glissandoStart) * progress;
    } else {
      currentCents = glissandoStart;
    }

    // Apply vibrato if present
    if (vibrato) {
      currentCents += vibrato.getCurrentValue(t);
    }

    const pitchRatio = Math.pow(2, currentCents / 1200);
    const effectiveRatio = (pitchRatio / baseRatio);

    // Accumulate input position for continuous pitch change
    inputPositionAccumulator += effectiveRatio;
    const inputPosition = inputPositionAccumulator;
    const index = Math.floor(inputPosition);
    const t_frac = inputPosition - index;

    const p0 = getSample(index - 1);
    const p1 = getSample(index);
    const p2 = getSample(index + 1);
    const p3 = getSample(index + 2);

    const t2 = t_frac * t_frac;
    const t3 = t2 * t_frac;

    const a = -0.5 * p0 + 1.5 * p1 - 1.5 * p2 + 0.5 * p3;
    const b = p0 - 2.5 * p1 + 2 * p2 - 0.5 * p3;
    const c = -0.5 * p0 + 0.5 * p2;
    const d = p1;

    output[i] = a * t3 + b * t2 + c * t_frac + d;
  }

  return output;
}