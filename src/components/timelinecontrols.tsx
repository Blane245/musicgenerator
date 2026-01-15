// display the time line based on the current start time and
// zoom level
// handle time line interval editing
import TimeLine from "classes/timeline";
import { useCMGContext } from "cmgcontext";
import {
  CiCircleChevLeft,
  CiCircleChevRight,
  CiZoomIn,
  CiZoomOut,
} from "react-icons/ci";
import { TimelineInterval, TimeLineScales, TIMELINETYPE } from "types";
import { setDirty } from "utils/cmfiletransactions";
import updateTimeInterval from "utils/updatetimeinterval";
// render the timeline and control the timeline interval
export default function TimeLineControls() {
  const {
    fileContents,
    setFileContents,
    timeLine,
    setTimeLine,
    timeInterval,
    setTimeInterval,
  } = useCMGContext();

  // when the timeline changes update the timeInterval and set the dirty bit
  // useEffect(() => {
  //   if (!timeLine) return;
  //   const newInterval: TimelineInterval | null = updateTimeInterval(
  //     timeInterval,
  //     timeLine
  //   );
  //   if (!newInterval) return;
  //   setTimeInterval(newInterval);
  //   setDirty(true, fileContents, setFileContents);
  // }, [timeLine]);

  const handleZoomIn = (): void => {
    setTimeLine((c: TimeLine | null) => {
      if (!c) return null;
      const n: TimeLine = c.copy();
      n.zoomIn();
      const newInterval: TimelineInterval | null = updateTimeInterval(
        timeInterval,
        n
      );
      if (newInterval) setTimeInterval(newInterval);
      return n;
    });
    setDirty(true, fileContents, setFileContents);
  };
  const handleZoomOut = (): void => {
    setTimeLine((c: TimeLine | null) => {
      if (!c) return null;
      const n: TimeLine = c.copy();
      n.zoomOut();
      const newInterval: TimelineInterval | null = updateTimeInterval(
        timeInterval,
        n
      );
      if (newInterval) setTimeInterval(newInterval);
      return n;
    });
    setDirty(true, fileContents, setFileContents);
  };

  // shift time line start left 1/2 of the extent of the current zoom level
  const handleShiftLeft = (): void => {
    setTimeLine((c: TimeLine | null) => {
      if (!c) return null;
      if (c.startTime <= 0) return c;
      const n = c.copy();
      n.shiftLeft();
      const newInterval: TimelineInterval | null = updateTimeInterval(
        timeInterval,
        n
      );
      if (newInterval) setTimeInterval(newInterval);
      return n;
    });
    setDirty(true, fileContents, setFileContents);
  };

  // shift time line start right 1/2 of the extent of the current zoom level
  const handleShiftRight = (): void => {
    setTimeLine((c: TimeLine | null) => {
      if (!c) return null;
      const n = c.copy();
      n.shiftRight();
      const newInterval: TimelineInterval | null = updateTimeInterval(
        timeInterval,
        n
      );
      if (newInterval) setTimeInterval(newInterval);
      return n;
    });

    setDirty(true, fileContents, setFileContents);
  };

  const handleModeChange = (): void => {
    if (
      timeLine?.mode == TIMELINETYPE.Time &&
      timeLine?.beatsPerMeasure != 0 &&
      timeLine.measureSize != 0
    ) {
      setTimeLine((c: TimeLine | null) => {
        if (!c) return null;
        const n = c.copy();
        n.mode = TIMELINETYPE.Measure;
        const newInterval: TimelineInterval | null = updateTimeInterval(
          timeInterval,
          n
        );
        if (newInterval) setTimeInterval(newInterval);
        return n;
      });
      setDirty(true, fileContents, setFileContents);
    } else if (timeLine?.mode == TIMELINETYPE.Measure) {
      setTimeLine((c: TimeLine | null) => {
        if (!c) return null;
        const n = c.copy();
        n.mode = TIMELINETYPE.Time;
        const newInterval: TimelineInterval | null = updateTimeInterval(
          timeInterval,
          n
        );
        if (newInterval) setTimeInterval(newInterval);
        return n;
      });
    }
  };

  return (
    <>
      <button
        style={{ fontSize: "15px" }}
        disabled={!timeLine || timeLine.currentZoomLevel == 0}
        onClick={handleZoomIn}
      >
        <CiZoomIn />
      </button>
      <button
        style={{ fontSize: "15px" }}
        disabled={
          !timeLine || timeLine.currentZoomLevel == TimeLineScales.length - 1
        }
        onClick={handleZoomOut}
      >
        <CiZoomOut />
      </button>
      <button
        style={{ fontSize: "15px" }}
        disabled={!timeLine || timeLine.startTime == 0}
        onClick={handleShiftLeft}
      >
        <CiCircleChevLeft />
      </button>
      <button style={{ fontSize: "15px" }} onClick={handleShiftRight}>
        <CiCircleChevRight />
      </button>
      <br />
      <button style={{ fontSize: "15px" }} onClick={handleModeChange}>
        {timeLine?.mode}
      </button>
      {timeLine?.mode == "Measure"
        ? " " + timeLine?.measureSize.toFixed(2) + " (sec)"
        : ""}
    </>
  );
}
