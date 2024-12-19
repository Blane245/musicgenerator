import { MutableRefObject } from "react";
import { CMGeneratorType, GENERATIONMODE, SourceData } from "../types";
import { GeneratorType } from "soundfont2";

export interface PreviewProps {
  context: AudioContext;
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
  const {
    context,
    playbackLength,
    offsetTime,
    sourceData,
    setMode,
    playing,
    setTimeProgress,
    setGeneratorsPlaying,
    setStatus,
  } = params;

  // resume the audio context after the source data have been built
  context.resume();

  const SCHEDULEAHEADTIME: number = 0.1; // how far ahead to schedule audio (seconds)
  const LOOKAHEAD: number = 25.0; // how frequently to call the schedule function (ms)
  let timerID: number = 0; // the timer used to set the schedule
  let nextTime: number = 0.0;

  // the real time scheduler
  scheduler();
  function scheduler(): void {
    if (playing.current) {
      const aheadTime = context.currentTime + SCHEDULEAHEADTIME;
      
      while (nextTime < aheadTime) {
        // start the tones ready to start
        sourceData.forEach((s: SourceData) => {
          if (aheadTime >= s.startTime && !s.started) {

            s.source.start(s.startTime, 0, s.duration);
            // s.source.start(s.startTime);
            s.started = true;
            // console.log('source', 
            // s.startTime,
            // s.duration,
            //   'currentTime', context.currentTime,
            //   'nexttime', nextTime,
            //   'aheadtime', aheadTime,
            // );
          }
        });
        // stop the tones ready to stop
        nextTime += SCHEDULEAHEADTIME;
        sourceData.forEach((s:SourceData) => {

        })
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
          if (newGeneratorsPlaying.findIndex((g:CMGeneratorType) => g.name == s.gen.name) < 0) {
            if (context.currentTime >= s.gen.startTime && context.currentTime <= s.gen.stopTime )
              newGeneratorsPlaying.push(s.gen);
          }
        });
        return newGeneratorsPlaying;
      });
      progressId = window.setTimeout(timeProgress, 1000);
  
    } else {
      progressId && clearTimeout(progressId);
      setTimeProgress(0);
    }
  }
}
