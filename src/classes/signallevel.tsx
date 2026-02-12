// tracks the average and maximum audio signal levels for multiple channels
// the maximum can be reset as desired
export default class SignalLevel {
  maximum: number[] = [];
  channelCount: number = 0;
  constructor(channelCount: number) {
    this.channelCount = channelCount;
    this.maximum = Array<number>(channelCount).fill(0);
  }

  getSignalLevel(
    audio: Float32Array[],
    startSample: number,
    sampleCount: number,
  ): { average: number[]; maximum: number[] } {
    if (audio.length != this.channelCount)
      throw new Error(
        `audio data does not have the right number of channels. It should be ${this.channelCount}.`,
      );

    const sum: number[] = Array<number>(audio.length).fill(0);
    for (let iChannel = 0; iChannel < audio.length; iChannel++) {
      const endSample: number = Math.min(
        startSample + sampleCount,
        audio[iChannel].length,
      );
      for (let iSample = startSample; iSample < endSample; iSample++) {
        const sample: number = Math.abs(audio[iChannel][iSample]);
        sum[iChannel] += sample;
      }
      sum[iChannel] /= sampleCount;
      this.maximum[iChannel] = Math.max(this.maximum[iChannel], sum[iChannel]);
    }
    return { average: sum, maximum: this.maximum };
  }

  resetMaximum() {
    this.maximum = Array<number>(this.channelCount).fill(0);
  }
}
