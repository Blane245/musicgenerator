import { FFTSIZE, MAXDECIBELS, MINDECIBELS, SignalLevelsType } from "types";

export default class SignalLevel {
  #context: AudioContext; // not usable in recording mode
  #filter: BiquadFilterNode;
  #splitter: ChannelSplitterNode;
  #leftAnalyser: AnalyserNode
  #rightAnalyser: AnalyserNode;
  #leftDataArray: Float32Array;
  #rightDataArray: Float32Array;

  constructor(context: AudioContext, source: AudioNode) {
    this.#context = context;
    this.#filter = context.createBiquadFilter();
    this.#filter.type = 'highpass';
    this.#filter.frequency.value = 40;
    source.connect(this.#filter);
    this.#splitter = context.createChannelSplitter(2);
    this.#filter.connect(this.#splitter);
    this.#leftAnalyser = this.#context.createAnalyser();
    this.#leftAnalyser.fftSize = FFTSIZE;
    this.#leftAnalyser.minDecibels = MINDECIBELS;
    this.#leftAnalyser.maxDecibels = MAXDECIBELS;
    this.#leftAnalyser.smoothingTimeConstant = 0.8;
    this.#leftDataArray = new Float32Array(this.#leftAnalyser.frequencyBinCount);
    this.#splitter.connect(this.#leftAnalyser, 0, 0);
    this.#rightAnalyser = this.#context.createAnalyser();
    this.#rightAnalyser.fftSize = FFTSIZE;
    this.#rightAnalyser.minDecibels = MINDECIBELS;
    this.#rightAnalyser.maxDecibels = MAXDECIBELS;
    this.#rightAnalyser.smoothingTimeConstant = 0.8;
    this.#rightDataArray = new Float32Array(this.#rightAnalyser.frequencyBinCount);
    this.#splitter.connect(this.#rightAnalyser, 1, 0);
  }

  #getAverage(analyser: AnalyserNode, dataArray: Float32Array): {average: number, max: number} {
    if (dataArray.length > 0) {
      // @ts-ignore
      analyser.getFloatTimeDomainData(dataArray);
      let average: number = 0;
      let max: number = 0;
      for (let index = 0; index < dataArray.length; index++) {
        average +=Math.abs(dataArray[index]);
        max = Math.max(max, Math.abs(dataArray[index]));
      }
      average = average / dataArray.length;
      // return 10 * Math.log10(average);
      return {average, max};
    } else return {average: 0, max: 0};
  }

  // get the left and right volume, and the left and right spectrum
  getValues(): SignalLevelsType {
    if (this.#leftAnalyser && this.#rightAnalyser) {
      const {average:leftVolume, max:leftMax} = this.#getAverage(this.#leftAnalyser, this.#leftDataArray);
      const {average:rightVolume, max:rightMax} = this.#getAverage(this.#rightAnalyser, this.#rightDataArray);
      const leftSpectrum = new Uint8Array(this.#leftAnalyser.frequencyBinCount);
      const rightSpectrum = new Uint8Array(this.#rightAnalyser.frequencyBinCount);
      this.#leftAnalyser.getByteFrequencyData(leftSpectrum);
      this.#rightAnalyser.getByteFrequencyData(rightSpectrum);
      // console.log('volumes', leftVolume, rightVolume)
      
      return { leftVolume, leftMax, rightVolume, rightMax, leftSpectrum, rightSpectrum };
    } else return { leftVolume: 0, leftMax: 0, rightVolume: 0, rightMax: 0, leftSpectrum: new Uint8Array(0), rightSpectrum: new Uint8Array(0) };
  }
}
