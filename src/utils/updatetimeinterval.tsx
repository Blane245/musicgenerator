import TimeLine from "classes/timeline";
import { TimelineInterval, TimeLineScale, TimeLineScales } from "types";

export default function updateTimeInterval(
  ti: TimelineInterval,
  tl: TimeLine
): TimelineInterval | null {
  if (
    tl.currentZoomLevel >= 0 &&
    tl.currentZoomLevel < TimeLineScales.length &&
    ti.startTime != undefined &&
    ti.endTime != undefined
  ) {
    const scale: TimeLineScale = TimeLineScales[tl.currentZoomLevel];
    const newInterval: TimelineInterval = { ...ti };
    const tStart: number = tl.startTime;
    const tStop: number = tStart + scale.extent;
    newInterval.startOffset =
      (tl.width * (ti.startTime - tStart)) / (tStop - tStart);
    newInterval.endOffset =
      (tl.width * (ti.endTime - tStart)) / (tStop - tStart);
    return newInterval;
  } else return null;
}
