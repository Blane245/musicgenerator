// record the selected nodes
// a group of source batches is dispatched for rendering.
// When that group is complete, the next group is assembled and
// dispatched.

// the group processing algorithm (in dispatchGroup)
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
//
// when all batches have completed or playing has stopped (in waitForCompletion)
//  write the accumulated buffer to the recording file
import { useEffect, useRef, useState } from "react";
import Compressor from "../classes/compressor";
import Equalizer from "../classes/equalizer";
import Reverb from "../classes/reverb";
import Volume from "../classes/volume";
import { useCMGContext } from "../cmgcontext";
import { GENERATIONMODE, GENERATORTYPE, RawSourceData } from "../types";
import { bufferToMp3 } from "../utils/buffertomp3";
import { bufferToWav } from "../utils/buffertowav";
import { buildRoomNodes } from "./buildroomnodes";
import { realizeSource } from "./realizesource";

export interface RecordProps {
  recordHandle: FileSystemFileHandle;
  sourceData: RawSourceData[];
  sampleRate: number;
  playbackLength: number;
  setMode: Function;
  setRecordHandle: Function;
  recordFormat: string;
}

export default function Record(params: RecordProps) {
  const {
    sourceData,
    recordHandle,
    sampleRate,
    playbackLength,
    recordFormat,
    setMode,
    setRecordHandle,
  } = params;
  const { fileContents, setStatus, playing } = useCMGContext();
  const BATCHSIZE: number = 200; // the number of sources in a batch
  const GROUPSIZE: number = 10; // the number of batches that will be rendered as a group
  const [completed, setCompleted] = useState<number>(-1);

  // initialize the complete recording
  const result = useRef<Float32Array[]>([
    new Float32Array(Math.ceil(playbackLength * sampleRate)).fill(0),
    new Float32Array(Math.ceil(playbackLength * sampleRate)).fill(0),
  ]);
  // group and batch tracking data and counters
  const sortedSources = useRef<RawSourceData[]>(
    sourceData.sort((a, b) => a.source.startTime - b.source.startTime)
  );
  const totalBatchCount = useRef<number>(0);
  const completedBatches = useRef<number>(0);
  const nextSource = useRef<number>(0);
  const currentBatchCount = useRef<number>(0);
  const recordingActive = useRef<boolean>(false);
  const groupCount = useRef<number>(0);
  const completeTimerId = useRef<number>(0);
  const groupTimerId = useRef<number>(0);
  const group = useRef<
    {
      sourceStart: number;
      sourceEnd: number;
      batchStart: number;
      batchEnd: number;
    }[]
  >([]);
  const activeContexts = useRef<OfflineAudioContext[]>([]);
  let startTime: Date = new Date();

  // what is happening is that dev is activating the effect twice and recording
  // happening twice. This is prevented by the recording active reference variable
  useEffect(() => {
    if (playing.current && !recordingActive.current) {
      // console.log(
      //   "recording size (Mb) ",
      //   (result.current[0].length * 32) / 1000000
      // );
      try {
        startTime = new Date();
        // zeroize all counters and data
        recordingActive.current = true;
        totalBatchCount.current = 0;
        completedBatches.current = 0;
        nextSource.current = 0;
        currentBatchCount.current = 0;
        groupCount.current = 0;
        groupTimerId.current = 0;
        group.current = [];

        // count the number of sorted batches
        let nBatch: number = 0;
        sortedSources.current.forEach((_, i) => {
          nBatch++;
          if (nBatch == BATCHSIZE || i == sortedSources.current.length - 1) {
            totalBatchCount.current++;
            // console.log("batch ", totalBatchCount.current, " size ", nBatch);
            nBatch = 0;
          }
        });
        // console.log("total batch count ", totalBatchCount.current);

        playing.current = true;

        // start dispatching the groups of batches
        dispatchGroup();

        // wait for all batches to be completed
        waitForCompletion();
      } catch (e: any) {
        console.error(e);
        setMode(GENERATIONMODE.idle);
        setRecordHandle(null);
        setStatus(`Error during recording: '${e.description}`);
        playing.current = false;
      }
    }
  });

  // every second check if all batches have been completed,
  // convert the result to the selected audio format,
  // and write to the selected file
  function waitForCompletion() {
    if (playing.current) {
      if (totalBatchCount.current == completedBatches.current) {
        // convert the result to a WAV or MP3 file Blob
        const blob: Blob =
          recordFormat == "wav"
            ? bufferToWav(result.current, sampleRate)
            : bufferToMp3(result.current, sampleRate);

        // write the Blob to the file
        recordHandle
          .createWritable()
          .then((accessHandle: FileSystemWritableFileStream) => {
            accessHandle.write(blob);
            accessHandle.close();
            const stopTime = new Date();
            setStatus(
              `Audio written to ${recordHandle.name}, size=${
                blob.size / 1000000
              } (Mb), lapsed time ${Math.round(
                (stopTime.getTime() - startTime.getTime()) / 1000
              )} seconds`
            );
            setMode(GENERATIONMODE.idle);
            setRecordHandle(null);
            playing.current = false;
            completeTimerId.current && clearTimeout(completeTimerId.current);
            recordingActive.current = false;
          });
      } else {
        completeTimerId.current = window.setTimeout(waitForCompletion, 1000);
        // console.log(
        //   "waiting for completion, total=",
        //   totalBatchCount.current,
        //   " completed=",
        //   completedBatches.current
        // );
        setCompleted(
          Math.floor((100 * completedBatches.current) / totalBatchCount.current)
        );
      }
    } else {
      completeTimerId.current && clearTimeout(completeTimerId.current);
      recordingActive.current = false;
      setMode(GENERATIONMODE.idle);
      setRecordHandle(null);
      setStatus(`Recording stopped early`);
    }
  }

  // every second check whether the current group of batches has finished rendering
  // if so, dispatch the next group
  // finish this when all batches have been dispatched
  function dispatchGroup() {
    // if all previous groups have completed rendering, assemble the
    // next group
    if (
      groupCount.current == 0 &&
      playing.current &&
      completedBatches.current != totalBatchCount.current
    ) {
      group.current = [];
      while (
        group.current.length < GROUPSIZE &&
        nextSource.current < sortedSources.current.length - 1
      ) {
        // assemble the next batch
        let batchStart: number = Number.MAX_VALUE;
        let batchEnd: number = 0;
        let sourceStart: number = nextSource.current;
        let sourceCount: number = 0;
        while (
          sourceCount < BATCHSIZE &&
          nextSource.current <= sortedSources.current.length - 1
        ) {
          const s = sortedSources.current[nextSource.current];
          batchStart = Math.min(batchStart, s.source.startTime);
          batchEnd = Math.max(batchEnd, s.source.startTime + s.source.duration);
          nextSource.current++;
          sourceCount++;
        }
        // console.log(
        //   "batch assembled, source count ",
        //   sourceCount,
        //   "next source",
        //   nextSource.current
        // );

        // if there is anything in the batch, push it and its start and end time on
        // on the group queue
        if (sourceCount > 0) {
          groupCount.current++;
          group.current.push({
            sourceStart,
            sourceEnd: sourceStart + sourceCount - 1,
            batchStart,
            batchEnd,
          });
          // console.log(
          //   "batch added to group,",
          //   "source start",
          //   sourceStart,
          //   "source count ",
          //   sourceCount,
          //   "batch start",
          //   batchStart,
          //   "batch end",
          //   batchEnd
          // );
        }
      }
      // there is now a group of batches that need to rendered
      // console.log("rendering ", group.current.length, " batches");
      activeContexts.current = [];
      group.current.forEach(
        (g: {
          sourceStart: number;
          sourceEnd: number;
          batchStart: number;
          batchEnd: number;
        }) => {
          const { sourceStart, sourceEnd, batchEnd } = g;
          currentBatchCount.current++;
          const context: OfflineAudioContext = new OfflineAudioContext(
            2,
            sampleRate * batchEnd,
            sampleRate
          );
          activeContexts.current.push(context);

          // create a copy of the room compressor, equalizer and volume to build the room nodes
          // for this batch
          const compressor: Compressor = fileContents.compressor.copy();
          const equalizer: Equalizer = fileContents.equalizer.copy();
          const volume: Volume = fileContents.volume.copy();
          const reverb: Reverb = fileContents.reverb.copy();
          compressor.setContext(context);
          equalizer.setContext(context);
          volume.setContext(context);
          reverb.setContext(context);
          const concentrator: GainNode = buildRoomNodes(
            compressor,
            equalizer,
            volume,
            reverb,
            context
          );

          // build the batch's graph, realize its sources, and start each
          // render the batch and write it and its data to session storage
          for (let i = sourceStart; i <= sourceEnd; i++) {
            const s = sortedSources.current[i];
            if (s.gen.type != GENERATORTYPE.Silent)
              realizeSource(context, s, i, concentrator).source.start(
                s.source.startTime,
                0,
                s.source.duration
              );
          }
          // console.log(
          //   "rendering for batch ",
          //   currentBatchCount.current,
          //   " source start ",
          //   sourceStart,
          //   " source end ",
          //   sourceEnd,
          //   " start time",
          //   batchStart,
          //   " end time ",
          //   batchEnd
          // );

          // when rendering is complete add the batch's rendered buffer to the
          // result
          activeContexts.current[activeContexts.current.length - 1].oncomplete =
            (ev: OfflineAudioCompletionEvent) => {
              const renderBuffer: AudioBuffer = ev.renderedBuffer;
              for (let j = 0; j < 2; j++) {
                const channelData: Float32Array =
                  renderBuffer.getChannelData(j);
                for (let i = 0; i < renderBuffer.length; i++) {
                  result.current[j][i] += channelData[i];
                }
              }
              completedBatches.current++;

              // count the group as complete
              groupCount.current--;
              // console.log(
              //   "completed batches",
              //   completedBatches.current,
              //   "active contexts",
              //   activeContexts.current.length,
              //   "active batches",
              //   group.current.length
              // );
            };

          // start rendering this batch
          activeContexts.current[
            activeContexts.current.length - 1
          ].startRendering();
        }
      );
    }

    // when the number of completed batches is equal to the
    // total number of batches, we are done, so kill the timer.
    if (
      totalBatchCount.current == completedBatches.current ||
      !playing.current
    ) {
      // console.log("all batch rendering complete");
      groupTimerId.current && clearTimeout(groupTimerId.current);
    } else {
      //otherwise we need to check to see if it is time to start another group
      groupTimerId.current = window.setTimeout(dispatchGroup, 1000);
      // console.log("wait to start rendering next group");
    }
  }

  // styles for the progress bar
  const containerStyles = {
    height: 20,
    width: "100%",
    backgroundColor: "#e0e0de",
    borderRadius: 50,
    margin: 10,
  };

  const fillerStyles = {
    height: "100%",
    width: `${completed}%`,
    backgroundColor: "#00695c",
    borderRadius: "inherit",
    textAlign: "right" as const,
  };

  const labelStyles = {
    padding: 5,
    color: "white",
    fontWeight: "bold",
  };

  // progress bar modal
  return (
    <>
      <div
        style={{ display: completed >= 0 ? "block" : "none" }}
        className="modal-content"
      >
        <div className="modal-header">
          <h2>Recording Progress</h2>
          <div className="modal-body">
            <div style={containerStyles}>
              <div style={fillerStyles}>
                <span style={labelStyles}>{completed}%</span>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button id="progress" onClick={() => (playing.current = false)}>
              Stop
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
