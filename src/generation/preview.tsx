import { MutableRefObject } from "react";
import {
  ActiveSource,
  CMGeneratorType,
  GENERATIONMODE,
  RawSourceData,
} from "../types";
import { realizeSource } from "./realizesource";
import CMGFile from "../classes/cmgfile";
import { buildRoomNodes } from "./buildroomnodes";

export interface PreviewProps {
  fileContents: CMGFile;
  playbackLength: number;
  offsetTime: number;
  sourceData: RawSourceData[];
  setMode: Function;
  playing: MutableRefObject<boolean>;
  setTimeProgress: Function;
  setStatus: Function;
  setGeneratorsPlaying: Function;
}

export default function Preview(params: PreviewProps): void {
  let { sourceData } = params;
  const {
    fileContents,
    playbackLength,
    offsetTime,
    setMode,
    playing,
    setTimeProgress,
    setGeneratorsPlaying,
    setStatus,
  } = params;

  // set up the real time context
  const context: AudioContext = new AudioContext();
  context.suspend();
  playing.current=true;
  setTimeProgress(0);

  // prepare the room compressor and equalizer
  fileContents.compressor.setContext(context);
  fileContents.equalizer.setContext(context);

  // construct the room concentrator and connect to the compressor and equalizer
  const concentrator: GainNode = buildRoomNodes(
    fileContents.compressor,
    fileContents.equalizer,
    context
  );

  const SCHEDULEAHEADTIME: number = 0.1; // how far ahead to schedule audio (seconds)
  const LOOKAHEAD: number = 25.0; // how frequently to call the schedule function (ms)
  let timerID: number = 0; // the timer used to set the schedule
  let nextTime: number = 0.0;

  // the real time scheduler
  // when a source starts, realize and connect it to the room concentrator
  // when a source stops, disconnect and delete it when its stop time arrives
  let activeSources: ActiveSource[] = [];
  context.resume();
  scheduler();
  function scheduler(): void {
    if (playing.current) {
      const aheadTime = context.currentTime + SCHEDULEAHEADTIME;
      let nStarted: number = 0;
      let nStopped: number = 0;
      while (nextTime < aheadTime) {
        // start the tones ready to start
        sourceData.forEach((s: RawSourceData, i: number) => {
          if (aheadTime >= s.source.startTime && !s.source.started) {
            const activeSource: ActiveSource = realizeSource(
              context,
              s,
              i,
              concentrator
            );
            activeSource.source.start(s.source.startTime, 0, s.source.duration);
            activeSources.push(activeSource);
            s.source.started = true;
            nStarted++;
          }
        });

        // disconnect all of the nodes that have finished playing
        // and delete them
        activeSources = activeSources.filter((s: ActiveSource) => {
          if (context.currentTime > s.stopTime) {
            s.source.disconnect();
            s.vol.disconnect();
            s.panner.disconnect();
            nStopped++;
            return false;
          } else return true;
        });
        // advance to the next scheduled time
        nextTime += SCHEDULEAHEADTIME;
      }
      // console.log(
      //   "at",
      //   context.currentTime,
      //   nStarted,
      //   "started",
      //   nStopped,
      //   "stopped",
      //   activeSources.length,
      //   " running",
      // );
    }

    // check if done or stopped
    const done: boolean = context.currentTime > playbackLength;
    if (!done && playing.current) {
      timerID = window.setTimeout(scheduler, LOOKAHEAD);
      // console.log("timer set", context.currentTime);
    } else {
      // console.log("timer cleared");
      timerID && clearTimeout(timerID);
      playing.current=false;
      if (context.state !== "closed") {
        (context as AudioContext).suspend();
        (context as AudioContext).close();
      }
      setMode(GENERATIONMODE.idle);
      setGeneratorsPlaying([]);
      setStatus(`Preview Complete`);
    }
  }

  // time progress clicker
  let progressId: number = 0;
  timeProgress();
  function timeProgress(): void {
    if (playing.current && context.currentTime <= playbackLength) {
      setTimeProgress(context.currentTime + offsetTime);
      // get the generators playing for highlighting
      setGeneratorsPlaying(() => {
        const newGeneratorsPlaying: CMGeneratorType[] = [];
        activeSources.forEach((s: ActiveSource) => {
          if (
            newGeneratorsPlaying.findIndex(
              (g: CMGeneratorType) => g.name == s.gen.name
            ) < 0
          ) {
            if (
              context.currentTime >= s.gen.startTime &&
              context.currentTime <= s.gen.stopTime
            )
              newGeneratorsPlaying.push(s.gen);
          }
        });
        return newGeneratorsPlaying;
      });
      progressId = window.setTimeout(timeProgress, 1000);
    } else {
      progressId && clearTimeout(progressId);
      setTimeProgress(-1);
    }
  }
}
