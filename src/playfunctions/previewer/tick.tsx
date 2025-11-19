import TimeLine from "classes/timeline";
import {
    DrawingSection,
    RawSourceData,
    SourceToDrawingSectionEntry,
    TimeLineScales,
} from "types";
import getOffsetFromTime from "utils/getoffsetfromtime";

// time progress clicker for updating the time progress widget
const tickInterval: number = 1000;
export default function tick(
  paused: React.MutableRefObject<boolean>,
  playing: React.MutableRefObject<boolean>,
  tickId: number,
  audioContext: AudioContext,
  playbackLength: number,
  previewTimeline: React.MutableRefObject<TimeLine | null>,
  offsetTime: number,
  pendingSourceData: React.MutableRefObject<RawSourceData[]>,
  drawing: HTMLElement | null,
  DrawSources: Function,
  drawingSections: DrawingSection[],
  sourceToDrawingSectionMap: SourceToDrawingSectionEntry[],
  setTimeProgress: Function,
  displayWidth: number,
  displayHeight: number,
): void {
  if (paused.current) {
    // console.log("tick paused");
    tickId && clearTimeout(tickId);
    return;
  }
  if (!audioContext) {
    // console.log("no audio context for tick");
    return;
  }
  if (playing.current && audioContext.currentTime <= playbackLength) {
    // console.log("tick at", audioContext.currentTime);
    tickId = window.setTimeout(
      tick,
      tickInterval,
      paused,
      playing,
      tickId,
      audioContext,
      playbackLength,
      previewTimeline,
      offsetTime,
      pendingSourceData,
      drawing,
      DrawSources,
      drawingSections,
      sourceToDrawingSectionMap,
      setTimeProgress,
      displayWidth,
      displayHeight
    );
    if (previewTimeline.current) {
      const newTime: number = Math.round(audioContext.currentTime + offsetTime);
      const ptl: TimeLine | null = updateTimeline(newTime);
      if (!ptl) return;
      const timelineStart = ptl.startTime;

      // if the timeline starttime changes update the timeline and
      // trim the pending sources
      if (ptl.startTime != previewTimeline.current.startTime) {
        previewTimeline.current = ptl;
        const newSourceData: RawSourceData[] = pendingSourceData.current.filter(
          (source) => {
            const sourceStopTime: number = source.source.stopTime;
            return sourceStopTime >= timelineStart;
          }
        );
        if (newSourceData.length != pendingSourceData.current.length) {
          // console.log(
          //   "remaining sources after trimming",
          //   newSourceData.length
          // );
          pendingSourceData.current = newSourceData;
        }
        if (drawing)
          DrawSources(
            newSourceData,
            drawing,
            ptl,
            newTime,
            drawingSections,
            sourceToDrawingSectionMap,
            displayWidth,
            displayHeight,
          );
      }
      setTimeProgress(newTime);
    }
  } else {
    tickId && clearTimeout(tickId);
    setTimeProgress(-1);
  }
    // if the time progress past the end of the current timeline
  // move the timeline ahead 1/2 of its current extent
  function updateTimeline(timeProgress: number): TimeLine | null {
    if (!previewTimeline.current) {
      // console.log("in updatetimeline, previewtimeline is null");
      return null;
    }
    let result: TimeLine = previewTimeline.current;
    const extent: number =
      TimeLineScales[previewTimeline.current.currentZoomLevel].extent;
    let newStart: number = previewTimeline.current.startTime;
    if (timeProgress >= newStart + extent) {
      newStart = previewTimeline.current.startTime + extent / 2.0;
      while (newStart + extent <= timeProgress) newStart += extent / 2.0;
      // console.log("new timeline start", newStart);
      const newPreviewTimeline: TimeLine = previewTimeline.current.copy();
      newPreviewTimeline.startTime = newStart;
      result = newPreviewTimeline;
    }

    // move the timeprogress line
    const timeProgressLine: HTMLElement | null =
      document.getElementById("timeprogress");
    if (timeProgressLine) {
      const offset: number = getOffsetFromTime(
        timeProgress,
        displayWidth,
        newStart,
        newStart + extent
      );
      timeProgressLine.setAttribute("x1", offset.toString());
      timeProgressLine.setAttribute("x2", offset.toString());
    }
    return result;
  }

}

