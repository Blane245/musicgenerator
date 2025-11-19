// the scheduler for the preview component. Handles the reconstruction of the
// audio routing graph and the preview evolves. Only sources that
// are currently playing are maintained in the graph to keep the load on the

import TimeLine from "classes/timeline";
import { realizeSource } from "playfunctions/realizesource";
import { ActiveSource, GENERATORTYPE, RawSourceData } from "types";

// web audio api at aminimum.
const SCHEDULEAHEADTIME: number = 0.1; // how far ahead to schedule audio (seconds)
const LOOKAHEAD: number = 25.0; // how frequently to call the schedule function (ms)

export default function scheduler(
  paused: React.MutableRefObject<boolean>,
  playing: React.MutableRefObject<boolean>,
  timerID: number,
  audioContext: AudioContext,
  playbackLength: number,
  onExit: Function,
  concentrator: GainNode | null,
  activeSources: React.MutableRefObject<ActiveSource[]>,
  previewTimeline: React.MutableRefObject<TimeLine | null>,
  nextTime: number,
  pendingSourceData: React.MutableRefObject<RawSourceData[]>,
  offsetTime: number,
  redrawSource: Function,
  setActiveSourcesCount: Function
): void {
  // if (paused.current) {
  if (paused.current) {
    // console.log("scheduler paused");
    timerID && clearTimeout(timerID);
    return;
  }
  if (!audioContext) return;
  // check if done or stopped
  // const done: boolean = audioContext.currentTime > playbackLength + reflectionDelay;
  const done: boolean = audioContext.currentTime > playbackLength;
  if (!done && playing.current) {
    timerID = window.setTimeout(
      scheduler,
      LOOKAHEAD,
      paused,
      playing,
      timerID,
      audioContext,
      playbackLength,
      onExit,
      concentrator,
      activeSources,
      previewTimeline,
      nextTime,
      pendingSourceData,
      offsetTime,
      redrawSource,
      setActiveSourcesCount
    );
  } else {
    if (audioContext.state !== "closed") {
      audioContext.suspend();
      audioContext.close();
    }
    // console.log("completed preview at ", playbackLength);
    onExit();
    return;
  }

  if (!audioContext || !concentrator) return;
  let newActiveSources: ActiveSource[] = [...activeSources.current];
  if (playing.current && previewTimeline.current) {
    const aheadTime = audioContext.currentTime + SCHEDULEAHEADTIME;
    let nStarted: number = 0;
    let nStopped: number = 0;
    while (nextTime < aheadTime) {
      // console.log(activeSources.length,'active sources at time ', nextTime);
      // assuming the pending sorces are sorted in starttime order ...
      let stopSearch: boolean = false;
      for (
        let iPending: number = 0;
        iPending < pendingSourceData.current.length && !stopSearch;
        iPending++
      ) {
        const s = pendingSourceData.current[iPending];
        // pendingSourceData.current.forEach((s: RawSourceData) => {
        // add any sources that are ready to start and are not already started
        // if (!s.source.started)
        //   console.log('source candidate for starting at time',aheadTime,s.source.startTime, s.source.duration);
        if (
          aheadTime >= s.source.startTime - offsetTime &&
          aheadTime <= s.source.startTime + s.source.duration - offsetTime &&
          !s.source.started
        ) {
          const activeSource: ActiveSource = realizeSource(
            audioContext,
            s,
            s.index,
            concentrator
          );
          if (activeSource.gen.type != GENERATORTYPE.Silent) {
            activeSource.source.playbackRate.value = 1.0;
            activeSource.source.start(
              s.source.startTime - offsetTime,
              0,
              s.source.duration
            );
          }
          // console.log("source", s.index, "started at ", s.source.startTime, 'duration', s.source.duration);
          newActiveSources.push(activeSource);
          s.source.started = true;
          redrawSource(s);
          nStarted++;
        }
        if (s.source.startTime - offsetTime > aheadTime) stopSearch = true;
        // });
      }

      // disconnect all of the nodes that have finished playing
      // and delete them
      // don't turn them off until the early reflections stop
      // console.log('activesources count', newActiveSources);
      newActiveSources = newActiveSources.filter((activeSource) => {
        const thisSource: RawSourceData | undefined =
          pendingSourceData.current.find(
            (s) => s.index == activeSource.sourceIndex
          );
        if (thisSource == undefined) {
          // console.log(
          //   "could not find active source with index",
          //   activeSource.sourceIndex
          // );
          return;
        }
        // const stopTime: number =
        //   activeSource.stopTime -
        //   offsetTime +
        //   (reflectionDelay == 0
        //     ? 0
        //     : reflectionDelay / 1000 + thisSource.source.duration);
        const stopTime: number = activeSource.stopTime - offsetTime;
        // console.log('source stop candidate stoptime, audioContext', stopTime, ctx.currentTime);
        if (audioContext.currentTime > stopTime) {
          if (activeSource.gen.type != GENERATORTYPE.Silent) {
            activeSource.source.disconnect();
            activeSource.vol.disconnect();
            activeSource.panner.disconnect();
            // console.log('source stopped at', audioContext.currentTime);
          }
          thisSource.source.started = false;
          if (activeSource.gen.type != GENERATORTYPE.Silent)
            redrawSource(thisSource);
          // console.log(
          //   "source",
          //   activeSource.sourceIndex,
          //   "stopped at",
          //   stopTime
          // );
          nStopped++;
          return false;
        } else return true;
      });
      // advance to the next scheduled time
      nextTime += SCHEDULEAHEADTIME;
    }
    // notify the display engine of the sources currently playing
    if (nStarted > 0 || nStopped > 0) {
      // console.log(
      //   "activesources has changed",
      //   newActiveSources.length,
      //   "pendingSources",
      //   pendingSourceData.current.length
      // );
      activeSources.current = newActiveSources;
      setActiveSourcesCount(newActiveSources.length);
    }
  }
}
