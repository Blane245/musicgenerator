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
  GENERATORTYPE,
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
  const {
    fileContents,
    sourceData,
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

  // construct the room concentrator and connect to the compressor and equalizer
  const concentrator: GainNode = buildRoomNodes(
    fileContents.compressor.copy(),
    fileContents.equalizer.copy(),
    fileContents.volume.copy(),
    fileContents.reverb.copy(),
    context
  );

  // determine the amount of time that the early reflections start
  let reflectionDelay: number = 0;
  if (fileContents.reverb.leftWall.gain > 0)
    reflectionDelay = Math.max(
      reflectionDelay,
      fileContents.reverb.leftWall.delay
    );
  if (fileContents.reverb.rightWall.gain > 0)
    reflectionDelay = Math.max(
      reflectionDelay,
      fileContents.reverb.rightWall.delay
    );
  if (fileContents.reverb.ceiling.gain > 0)
    reflectionDelay = Math.max(
      reflectionDelay,
      fileContents.reverb.ceiling.delay
    );
  console.log("reflection delay", reflectionDelay);

  const SCHEDULEAHEADTIME: number = 0.1; // how far ahead to schedule audio (seconds)
  const LOOKAHEAD: number = 25.0; // how frequently to call the schedule function (ms)
  let timerID: number = 0; // the timer used to set the schedule
  let nextTime: number = 0.0;

  // the real time scheduler
  // when a source starts, realize and connect it to the room concentrator
  // when a source stops, disconnect and delete it when its stop time arrives
  let activeSources: ActiveSource[] = [];
  context.resume();
  console.log("playback length", playbackLength);
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
            if (activeSource.gen.type != GENERATORTYPE.CMG) {
              activeSource.source.start(
                s.source.startTime,
                0,
                s.source.duration
              );
            }
            console.log(
              "source started at ",
              context.currentTime,
              "starttime",
              s.source.startTime
            );
            activeSources.push(activeSource);
            console.log('active source count', activeSources.length);
            s.source.started = true;
            nStarted++;
            someStarted = true;
          }
        });

        // disconnect all of the nodes that have finished playing
        // and delete them
        // don't turn them off until the early reflections stop
        activeSources = activeSources.filter((s: ActiveSource, i) => {
          const stopTime: number =
            s.stopTime +
            (reflectionDelay == 0
              ? 0
              : reflectionDelay / 1000 + sourceData[s.sourceIndex].source.duration);
          console.log("source stop time", s.sourceIndex, stopTime);
          if (context.currentTime > stopTime) {
            if (s.gen.type != GENERATORTYPE.CMG) {
              s.source.disconnect();
              s.vol.disconnect();
              s.panner.disconnect();
            }
            nStopped++;
            someStopped = true;
            console.log('source stopped', context.currentTime, i);
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
          " running"
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
      tickCounter += tickInterval / 1000;
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
