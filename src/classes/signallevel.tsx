export default class SignalLevel {
  left: number;
  right: number;
  #context: AudioContext; // not usable in recording mode
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
    this.#splitter = context.createChannelSplitter(2);
    this.#leftAnalyser = this.#context.createAnalyser();
    this.#leftAnalyser.fftSize = this.#BUFFERSIZE;
    this.#rightAnalyser = this.#context.createAnalyser();
    this.#rightAnalyser.fftSize = this.#BUFFERSIZE;
    this.#leftDataArray = new Float32Array(this.#leftAnalyser.frequencyBinCount);
    this.#rightDataArray = new Float32Array(this.#rightAnalyser.frequencyBinCount);
    source.connect(this.#splitter);
    this.#splitter.connect(this.#leftAnalyser, 0, 0);
    this.#splitter.connect(this.#rightAnalyser, 1, 0);
  }

  #getAverage(analyser: AnalyserNode, dataArray: Float32Array): number {
    if (dataArray.length > 0) {
      analyser.getFloatTimeDomainData(dataArray);
      let average: number = 0;
    //   console.log('sample length', dataArray.length);
      for (let index = 0; index < dataArray.length; index++) {
        average +=dataArray[index]*dataArray[index];
      }
      average = average / dataArray.length;
      console.log('average', average);
      return 10 * Math.log10(average);
    } else return 0;
  }

  getValues(): { left: number; right: number } {
    if (this.#leftAnalyser && this.#rightAnalyser) {
      const left: number = this.#getAverage(this.#leftAnalyser, this.#leftDataArray);
      const right: number = this.#getAverage(this.#rightAnalyser, this.#rightDataArray);
      return { left, right };
    } else return { left: 0, right: 0 };
  }
}
