// preview the selected source nodes
// as current time progresses, add near pending nodes to the 
// audio node graph. As they complete disconnect them
// this keeps the audio node graph as small as possible
// preventing menory and CPU overload
import { MutableRefObject } from "react";
import CMGFile from "../classes/cmgfile";
import {
  ActiveSource,
  GeneratorType,
  GENERATIONMODE,
  RawSourceData,
} from "../types";
import { buildRoomNodes } from "./buildroomnodes";
import { realizeSource } from "./realizesource";

// as this function is non-reactive, many of its props 
// are CMG context variables
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

  // set up the real time context and hold up the playback
  // undtile the room nodes can be built
  const context: AudioContext = new AudioContext();
  context.suspend();
  setTimeProgress(0);

  // prepare the room compressor and equalizer
  fileContents.compressor.setContext(context);
  fileContents.equalizer.setContext(context);

  // construct the room concentrator and connect to the compressor and equalizer
  const concentrator: GainNode = buildRoomNodes(
    fileContents.compressor,
    fileContents.equalizer,
    fileContents.volume,
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
  console.log('playback length', playbackLength);
  scheduler();
  function scheduler(): void {
    if (playing.current) {
      const aheadTime = context.currentTime + SCHEDULEAHEADTIME;
      let nStarted: number = 0;
      let nStopped: number = 0;
      let someStarted: boolean = false;
      let someStopped: boolean = false;
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
            console.log('source started at ', context.currentTime, 'starttime', s.source.startTime);
            activeSources.push(activeSource);
            s.source.started = true;
            nStarted++;
            someStarted = true;
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
            someStopped = true;
            return false;
          } else return true;
        });
        // advance to the next scheduled time
        nextTime += SCHEDULEAHEADTIME;
      }
      if (someStarted || someStopped)
      console.log(
        "at",
        context.currentTime,
        nStarted,
        "started",
        nStopped,
        "stopped",
        activeSources.length,
        " running",
      );
    }

    // check if done or stopped
    const done: boolean = context.currentTime > playbackLength;
    if (!done && playing.current) {
      timerID = window.setTimeout(scheduler, LOOKAHEAD);
      // console.log("timer set", context.currentTime);
    } else {
      // console.log("timer cleared");
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

  // time progress clicker for updating the time progress widget
  let tickId: number = 0;
  let tickCounter: number = offsetTime;
  const tickInterval: number = 1000;
  tick();
  function tick(): void {
    if (playing.current && context.currentTime <= playbackLength) {
      tickId = window.setTimeout(tick, tickInterval);
      setTimeProgress(tickCounter);
      // console.log(tickCounter, context.currentTime, offsetTime);
      tickCounter+=tickInterval/1000;
    } else {
      tickId && clearTimeout(tickId);
      setTimeProgress(-1);
    }
  }
  let playingId: number = 0;
  playingGenerators();
  function playingGenerators() {
    if (playing.current && context.currentTime <= playbackLength) {
      // get the generators playing for highlighting
      setGeneratorsPlaying(() => {
        const newGeneratorsPlaying: GeneratorType[] = [];
        activeSources.forEach((s: ActiveSource) => {
          if (
            newGeneratorsPlaying.findIndex(
              (g: GeneratorType) => g.name == s.gen.name
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
      playingId = window.setTimeout(playingGenerators, 500);
    } else {
      playingId && clearTimeout(playingId);
    }

  }
}
