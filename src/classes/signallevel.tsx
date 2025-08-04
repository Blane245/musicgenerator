import { FFTSIZE, MAXDECIBELS, MINDECIBELS, SignalLevelsType } from "types";

export default class SignalLevel {
  left: number;
  right: number;
  fftSize: number;
  #context: AudioContext; // not usable in recording mode
  #filter: BiquadFilterNode;
  #splitter: ChannelSplitterNode;
  #leftAnalyser: AnalyserNode
  #rightAnalyser: AnalyserNode;
  #BUFFERSIZE: number = 2048;
  #leftDataArray: Float32Array;
  #rightDataArray: Float32Array;

  constructor(context: AudioContext, source: AudioNode) {
    this.left = -90;
    this.right = -90;
    this.#context = context;
    this.#filter = context.createBiquadFilter();
    this.#filter.type = 'highpass';
    this.#filter.frequency.value = 10;
    this.#filter.Q.value = 10;
    source.connect(this.#filter);
    this.#splitter = context.createChannelSplitter(2);
    this.#filter.connect(this.#splitter);
    this.#leftAnalyser = this.#context.createAnalyser();
    this.#leftAnalyser.fftSize = this.#BUFFERSIZE;
    this.#rightAnalyser = this.#context.createAnalyser();
    this.#rightAnalyser.fftSize = this.#BUFFERSIZE;
    this.#leftDataArray = new Float32Array(this.#leftAnalyser.frequencyBinCount);
    this.#rightDataArray = new Float32Array(this.#rightAnalyser.frequencyBinCount);
    this.#splitter.connect(this.#leftAnalyser, 0, 0);
    this.#splitter.connect(this.#rightAnalyser, 1, 0);
    this.fftSize = FFTSIZE;
    this.#leftAnalyser.fftSize = FFTSIZE;
    this.#rightAnalyser.fftSize = FFTSIZE;
    this.#leftAnalyser.minDecibels = MINDECIBELS;
    this.#leftAnalyser.maxDecibels = MAXDECIBELS;
    this.#leftAnalyser.smoothingTimeConstant = 0.8;
    this.#rightAnalyser.smoothingTimeConstant = 0.8;
  }

  #getAverage(analyser: AnalyserNode, dataArray: Float32Array): number {
    if (dataArray.length > 0) {
      analyser.getFloatTimeDomainData(dataArray);
      let average: number = 0;
      for (let index = 0; index < dataArray.length; index++) {
        average +=dataArray[index]*dataArray[index];
      }
      average = average / dataArray.length;
      return 10 * Math.log10(average);
    } else return 0;
  }

  // get the left and right volume, and the left and right spectrum
  getValues(): SignalLevelsType {
    if (this.#leftAnalyser && this.#rightAnalyser) {
      const leftVolume: number = this.#getAverage(this.#leftAnalyser, this.#leftDataArray);
      const rightVolume: number = this.#getAverage(this.#rightAnalyser, this.#rightDataArray);
      const leftSpectrum = new Uint8Array(this.#leftAnalyser.frequencyBinCount);
      const rightSpectrum = new Uint8Array(this.#rightAnalyser.frequencyBinCount);
      this.#leftAnalyser.getByteFrequencyData(leftSpectrum);
      this.#rightAnalyser.getByteFrequencyData(rightSpectrum);

      
      return { leftVolume, rightVolume, leftSpectrum, rightSpectrum };
    } else return { leftVolume: 0, rightVolume: 0, leftSpectrum: new Uint8Array(0), rightSpectrum: new Uint8Array(0) };
  }
}
