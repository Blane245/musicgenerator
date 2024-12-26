import { MutableRefObject } from "react";
import CMGFile from "../classes/cmgfile";
import Compressor from "../classes/compressor";
import Equalizer from "../classes/equalizer";
import { GENERATIONMODE, RawSourceData } from "../types";
import { bufferToWave } from "../utils/buffertowave";
import { buildRoomNodes } from "./buildroomnodes";
import { realizeSource } from "./realizesource";
import Volume from "classes/volume";

export interface RecordProps {
  fileContents: CMGFile;
  sourceData: RawSourceData[];
  sampleRate: number;
  playbackLength: number;
  setMode: Function;
  setStatus: Function;
  playing: MutableRefObject<boolean>;
}

// record the generated sources using batching
// count the expected number of batches
// when a new batch has been defined
//  create a new offline context
//  realize the room nodes
//  realize each raw source in the batch
//  render the batch
// when a batch is rendered
//  add the rendered buffer to the total result
//  count the batch as rendered
// when all batch have completed or playing has stopped (a timer checks this every second)
//  write the accumulated buffer to the recording file
export default async function Record(params: RecordProps) {
  let { sourceData } = params;
  const {
    fileContents,
    sampleRate,
    playbackLength,
    setStatus,
    setMode,
    playing,
  } = params;

  const BATCHSIZE: number = 200;
  try {
    // get the file handle for the file to be written. if the sure cancels
    // an error is thrown.
    const rh: FileSystemFileHandle = await window.showSaveFilePicker({
      types: [
        {
          description: "WAV file",
          accept: { "audio/wav": [".wav"] },
        },
      ],
    });

    // sort the source data in start time order then count the number of batches
    sourceData = sourceData.sort((a, b) => a.source.startTime - b.source.startTime);
    let totalBatchCount: number = 0;
    let currentBatchCount: number = 0;
    let nBatch: number = 0;
    sourceData.forEach((_, i) => {
      nBatch++;
      if (nBatch == BATCHSIZE || i == sourceData.length - 1) {
        totalBatchCount++;
        nBatch = 0;
      }
    });
    console.log('total batch count ', totalBatchCount);

    // extract each batch and render it
    nBatch = 0;
    let batchedSources: RawSourceData[] = [];
    let batchStart: number = 1e100;
    let batchEnd: number = 0;
    let completedBatches: number = 0;
    let activeContexts: OfflineAudioContext[] = [];

    // initialize the complete recording
    const nResult = playbackLength * sampleRate;
    const result: Float32Array[] = [
      new Float32Array(nResult).fill(0),
      new Float32Array(nResult).fill(0),
    ];
    console.log("recording size (Mb) ", (result[0].length * 32) / 1000000);
    playing.current=true;

    sourceData.forEach((s, i) => {
      nBatch++;
      if (nBatch <= BATCHSIZE) {
        batchedSources.push(s);
        batchStart = Math.min(batchStart, s.source.startTime);
        batchEnd = Math.max(batchEnd, s.source.startTime + s.source.duration);
      }

      // when the batch is full render it offline and capture the
      // rendered buffer
      if (nBatch == BATCHSIZE || i == sourceData.length - 1) {
        currentBatchCount++;
        activeContexts.push(
          new OfflineAudioContext(2, sampleRate * batchEnd, sampleRate)
        );
        const context: OfflineAudioContext =
          activeContexts[activeContexts.length - 1];

        // create a copy of the room compressor and equalizer to build the room nodes
        const compressor: Compressor = fileContents.compressor.copy();
        const equalizer: Equalizer = fileContents.equalizer.copy();
        const volume: Volume = fileContents.volume.copy();
        const concentrator: GainNode = buildRoomNodes(
          compressor,
          equalizer,
          volume,
          context
        );

        // build the batch's graph, realize its sources, and start each
        // render the batch and write it and its data to session storage
        batchedSources.forEach((s: RawSourceData, i: number) => {
          realizeSource(context, s, i, concentrator).source.start(
            s.source.startTime,
            0,
            s.source.duration,
          );
        });
        console.log(
          "rendering for batch ",
          currentBatchCount,
          " source count ",
          batchedSources.length,
          " start time",
          batchStart,
          " end time ",
          batchEnd
        );

        context.oncomplete = (ev: OfflineAudioCompletionEvent) => {
          // add the result of this recording to the complete recording
          const renderBuffer:AudioBuffer = ev.renderedBuffer;
          const ctx: OfflineAudioContext =
            ev.currentTarget as OfflineAudioContext;
          for (let j = 0; j < 2; j++) {
            const channelData: Float32Array = renderBuffer.getChannelData(j);
            for (let i = 0; i < renderBuffer.length; i++) {
              result[j][i] += channelData[i];
            }
          }
          completedBatches++;

          // remove the context from the active contexts
          activeContexts = activeContexts.filter((c) => c != ctx);
          console.log("completed batches", completedBatches, 'active batches', activeContexts.length);
        };
        context.startRendering();

        // prepare for next batch
        nBatch = 0;
        batchStart = 1e100;
        batchEnd = 0;
        batchedSources = [];
      }
    });

    // wait for all batches to be completed
    let timerId: number = 0;
    waitForCompletion();
    function waitForCompletion() {
      if (playing.current) {
        if (totalBatchCount == completedBatches) {
          // convert the result to a WAV file Blob
          const blob: Blob = bufferToWave(result, 2, sampleRate);
          console.log('writing wav file of size ', blob.size);

          // write the Blob to the file
          rh.createWritable().then(
            (accessHandle: FileSystemWritableFileStream) => {
              accessHandle.write(blob);
              accessHandle.close();
              setStatus(`Audio written to ${rh.name}`);
              setMode(GENERATIONMODE.idle);
              playing.current=false;
              timerId && clearTimeout(timerId);
            }
          );
        } else {
          timerId = window.setTimeout(waitForCompletion, 1000);
          console.log('waiting for completion, total=',totalBatchCount,' completed=',completedBatches);
        }
      } else {
        timerId && clearTimeout(timerId);
        setMode(GENERATIONMODE.idle);
        setStatus(`Recording stopped early`);
      }
    }
  } catch (e: any) {
    console.error(e);
    setMode(GENERATIONMODE.idle);
    setStatus(`Error during recording: '${e.description}`);
    playing.current=false;
  }
}
