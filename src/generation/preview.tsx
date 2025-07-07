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
import SignalLevel from "../classes/signallevel";
import Volume from "../classes/volume";

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
  setSignalLevels: Function,
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
    setSignalLevels,
  } = params;

  // set up the real time context and hold up the playback
  // undtile the room nodes can be built
  const context: AudioContext = new AudioContext();
  context.suspend();
  setTimeProgress(offsetTime);

  // construct the room concentrator and connect to the compressor and equalizer
  fileContents.equalizer.setContext(context);
  fileContents.compressor.setContext(context);
  fileContents.volume.setContext(context);
  fileContents.reverb.setContext(context);

  const concentrator: GainNode = buildRoomNodes(
    fileContents.compressor,
    fileContents.equalizer,
    fileContents.volume,
    fileContents.reverb,
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

  const SCHEDULEAHEADTIME: number = 0.1; // how far ahead to schedule audio (seconds)
  const LOOKAHEAD: number = 25.0; // how frequently to call the schedule function (ms)
  let timerID: number = 0; // the timer used to set the schedule
  let nextTime: number = 0.0;

  // connect to the signal analyzer to the output of the volume (assumed to be last)
  const analyzer = new SignalLevel(context, (fileContents.volume as Volume).effect as GainNode);

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
            if (activeSource.gen.type != GENERATORTYPE.Silent) {
              activeSource.source.start(
                s.source.startTime,
                0,
                s.source.duration
              );
            }
            activeSources.push(activeSource);
            s.source.started = true;
            nStarted++;
          }
        });

        // disconnect all of the nodes that have finished playing
        // and delete them
        // don't turn them off until the early reflections stop
        activeSources = activeSources.filter((s: ActiveSource) => {
          const stopTime: number =
            s.stopTime +
            (reflectionDelay == 0
              ? 0
              : reflectionDelay / 1000 + sourceData[s.sourceIndex].source.duration);
          if (context.currentTime > stopTime) {
            if (s.gen.type != GENERATORTYPE.Silent) {
              s.source.disconnect();
              s.vol.disconnect();
              s.panner.disconnect();
            }
            nStopped++;
            return false;
          } else return true;
        });
        // advance to the next scheduled time
        nextTime += SCHEDULEAHEADTIME;
      }
    }

    // check if done or stopped
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

  // time progress clicker for updating the time progress widget
  let tickId: number = 0;
  let tickCounter: number = offsetTime;
  const tickInterval: number = 1000;
  tick();
  function tick(): void {
    if (playing.current && context.currentTime <= playbackLength) {
      tickId = window.setTimeout(tick, tickInterval);
      setTimeProgress(context.currentTime + offsetTime);
      tickCounter += tickInterval / 1000;
    } else {
      tickId && clearTimeout(tickId);
      setTimeProgress(-1);
    }
  }

  // generator highlighter running every 1/2 seconds
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

  // volume level monitor running every 1/2 second
  let signalId = 0;
  volumeMonitor();
  function volumeMonitor() {
    if (playing.current && context.currentTime <= playbackLength) {
      // get the current volume levels
      setSignalLevels(() => {
        const {left, right} = analyzer.getValues();
        return {left, right};
      });
      signalId = window.setTimeout(volumeMonitor, 500);
    } else {
      signalId && clearTimeout(signalId);
      setSignalLevels({left: -90, right: -90});
    }
  }
}
