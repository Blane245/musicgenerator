import { MutableRefObject } from "react";
import { GENERATIONMODE, RenderedBatch, SourceData } from "../types";
import { bufferToWave } from "../utils/buffertowave";
import Compressor from "../classes/compressor";
import { buildRoomGraph } from "./buildroomgraph";
import Equalizer from "../classes/equalizer";

export interface RecordProps {
  context: OfflineAudioContext;
  compressor: Compressor;
  equalizer: Equalizer;
  sourceData: SourceData[];
  sampleRate: number;
  playbackLength: number;
  setMode: Function;
  setStatus: Function;
  playing: MutableRefObject<boolean>;
}

// record the generated sources using batching
// TODO rendering can only be done once for each offline context
// this requires that once the sources have been built in the 
// original offline context they will have to be rebuilt in
// batches in separate contexts and each rendered separately
// it would be handy if a source and its volume and pan nodes 
// could be moved from the original context to the new one in the batch
export default async function Record(params: RecordProps) {
  const {
    context,
    compressor,
    equalizer,
    sourceData,
    sampleRate,
    playbackLength,
    setStatus,
    setMode,
    playing,
  } = params;

  const concentrator: GainNode = buildRoomGraph(compressor, equalizer, context);
  // pseudo code for copying the original source data to the new offline context
  // const newContext: OfflineAudioContext = new OfflineAudioContext(2, 5000, 5000);
  // TODO vol requires knowledge of level, attack and release times
  // const source: AudioBufferSourceNode = newContext.createBufferSource();
  // source.buffer = sourceData[0].source.buffer;
  // const panner: StereoPannerNode = newContext.createStereoPanner();
  // panner.pan.value = sourceData[0].panner.pan.value;
  // recording is done in batches of sources which are rendered and then
  // added together to produce the final result.
  const BATCHSIZE: number = 200;
  const renderedBuffers: RenderedBatch[] = [];

  try {
    // get the file handle for the file to be written
    const rh: FileSystemFileHandle = await window.showSaveFilePicker({
      types: [
        {
          description: "WAV file",
          accept: { "audio/wav": [".wav"] },
        },
      ],
    });

    // sort the source data in starttime order for batching
    // then extract a batch and render it
    let nBatch: number = 0;
    let batchedSources: SourceData[] = [];
    let batchStart: number = 1e100;
    let batchEnd: number = 0;
    console.log('recording size ', sourceData.length);
    sourceData
      .sort((a, b) => a.startTime - b.startTime)
      .forEach(async (s, i) => {
        nBatch++;
        if (nBatch <= BATCHSIZE) {
          batchedSources.push(s);
          batchStart = Math.min(batchStart, s.startTime);
          batchEnd = Math.max(batchEnd, s.startTime + s.duration);
        }

        // when the batch is full render it offline and capture the
        // rendered buffer
        if (nBatch == BATCHSIZE || i == sourceData.length - 1) {
          batchedSources.forEach((s) => {
            s.source.connect(s.vol).connect(s.panner).connect(concentrator);
            s.source.start(s.startTime, batchStart, s.duration);
          });
          const renderBuffer: AudioBuffer = await context.startRendering();
          renderedBuffers.push({
            startSample: batchStart,
            endSample: batchEnd,
            buffer: renderBuffer,
          });

          // disconnect all of the rendered sources
          batchedSources.forEach((s) => {
            s.source.disconnect();
            s.vol.disconnect();
            s.panner.disconnect();
          });
          console.log(
            "render complete for batch ",
            renderedBuffers.length,
            " source count",
            batchedSources.length,
            " start time",
            batchStart,
            " end time ",
            batchEnd
          );

          // prepare for next batch
          nBatch = 0;
          batchStart = 1e100;
          batchEnd = 0;
          batchedSources = [];
        }
      });

    // all batches have been created
    // add all of the samples for the same time together

    const nResult = playbackLength * sampleRate;
    console.log("batching complete. ready to add samples", nResult);
    const fl: Float32Array[] = [
      new Float32Array(nResult).fill(0),
      new Float32Array(nResult).fill(0),
    ];

    // loop through each sample point adding the rendered results from the
    // corresponding time
    for (let i = 0; i < nResult; i++) {
      const t = i / sampleRate;
      renderedBuffers.forEach((s) => {
        if (t >= s.startSample && t <= s.endSample) {
          const thisSample = (t - s.startSample) * sampleRate;
          fl[0][i] += s.buffer.getChannelData(0)[thisSample];
        }
      });
    }

    // convert the result to a WAV file Blob
    const blob: Blob = bufferToWave(fl, sampleRate);

    // write the Blob to the file
    const accessHandle: FileSystemWritableFileStream =
      await rh.createWritable();
    accessHandle.write(blob);
    accessHandle.close();
    setStatus(`Audio written to ${rh.name}`);
    setMode(GENERATIONMODE.idle);
    playing.current = false;
  } catch (e: any) {
    console.error(e);
    setMode(GENERATIONMODE.idle);
    setStatus(`Error during recording: '${e.description}`);
    playing.current = false;
  }
}
