  export function signalLevel(sample: Float32Array): number {
    let level: number = 0;
    sample.forEach((s) => {
      level += Math.abs(s);
    });
    return sample.length == 0 ? 0 : level / sample.length;
  }

