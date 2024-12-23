import { MutableRefObject } from "react";
import { CMGeneratorType, GENERATIONMODE, SourceData } from "../types";
import Compressor from "../classes/compressor";
import Equalizer from "../classes/equalizer";
import { buildRoomGraph } from "./buildroomgraph";

export interface PreviewProps {
  context: AudioContext;
  compressor: Compressor;
  equalizer: Equalizer;
  playbackLength: number;
  offsetTime: number;
  sourceData: SourceData[];
  setMode: Function;
  playing: MutableRefObject<boolean>;
  setTimeProgress: Function;
  setStatus: Function;
  setGeneratorsPlaying: Function;
}

export default function Preview(params: PreviewProps): void {
  let { sourceData } = params;
  const {
    context,
    compressor,
    equalizer,
    playbackLength,
    offsetTime,
    setMode,
    playing,
    setTimeProgress,
    setGeneratorsPlaying,
    setStatus,
  } = params;

  // resume the audio context after the source data have been built
  const roomConcentrator = buildRoomGraph(compressor, equalizer, context);
  context.resume();

  const SCHEDULEAHEADTIME: number = 0.1; // how far ahead to schedule audio (seconds)
  const LOOKAHEAD: number = 25.0; // how frequently to call the schedule function (ms)
  let timerID: number = 0; // the timer used to set the schedule
  let nextTime: number = 0.0;

  // the real time scheduler
  // the latest version will connect the source/vol/panner to the room concentrator
  // when a source starts and then disconnect it when the duration is up.

  scheduler();
  function scheduler(): void {
    if (playing.current) {
      const aheadTime = context.currentTime + SCHEDULEAHEADTIME;
      while (nextTime < aheadTime) {
        // start the tones ready to start
        let nStarted: number = 0;
        sourceData.forEach((s: SourceData) => {
          if (aheadTime >= s.startTime && !s.started) {
            s.source.connect(s.vol).connect(s.panner).connect(roomConcentrator);
            s.source.start(s.startTime, 0, s.duration);
            s.started = true;
            nStarted++;
            // console.log('source',
            // s.startTime,
            // s.duration,
            //   'currentTime', context.currentTime,
            //   'nexttime', nextTime,
            //   'aheadtime', aheadTime,
            // );
          }
        });

        // disconnect all of the nodes that have finished playing
        // and deleted it
        let nStopped: number = 0;
        sourceData = sourceData.filter((s: SourceData) => {
          // and delete the source
          if (s.started && context.currentTime > s.stopTime) {
            s.source.disconnect();
            s.vol.disconnect();
            s.panner.disconnect();
            nStopped++;
            return false;
          } else return true;
        });
        // console.log("at", aheadTime, nStarted, "started", nStopped, "stopped");
        // stop the tones ready to stop
        nextTime += SCHEDULEAHEADTIME;
      }
    }
    const done: boolean = context.currentTime > playbackLength;
    if (!done && playing.current) {
      timerID = window.setTimeout(scheduler, LOOKAHEAD);
    } else {
      timerID && clearTimeout(timerID);
      playing.current = false;
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
        sourceData.forEach((s: SourceData) => {
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
