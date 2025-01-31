// display the time line based on the current start time and
// zoom level
// handle time line interval editing
import {
  CiCircleChevLeft,
  CiCircleChevRight,
  CiZoomIn,
  CiZoomOut,
} from "react-icons/ci";
import TimeLine from "../classes/timeline";
import { useCMGContext } from "../cmgcontext";
import {
  TimeLineScales,
} from "../types";
// render the timeline and control the timeline interval
export default function TimeLineControlsDisplay() {
  const {
    timeLine,
    setTimeLine,
    playing,
  } = useCMGContext();

  const handleZoomIn = (): void => {
    setTimeLine((c: TimeLine) => {
      const n: TimeLine = c.copy();
      n.zoomIn();
      return n;
    });
  };
  const handleZoomOut = (): void => {
    setTimeLine((c: TimeLine) => {
      const n: TimeLine = c.copy();
      n.zoomOut();
      return n;
    });
  };

  // shift time line start left 1/2 of the extent of the current zoom level
  const handleShiftLeft = (): void => {
    setTimeLine((c: TimeLine) => {
      if (c.startTime <= 0) return c;
      const n = c.copy();
      n.shiftLeft();
      return n;
    });
  };

  // shift time line start right 1/2 of the extent of the current zoom level
  const handleShiftRight = (): void => {
    setTimeLine((c: TimeLine) => {
      const n = c.copy();
      n.shiftRight();
      return n;
    });
  };

  return (
      <div className="page-time-control">
        <fieldset disabled={playing.current} style={{ width: "inherit" }}>
          <button
            style={{ fontSize: "15px" }}
            disabled={timeLine.currentZoomLevel == 0}
            onClick={handleZoomIn}
          >
            <CiZoomIn />
          </button>
          <button
            style={{ fontSize: "15px" }}
            disabled={timeLine.currentZoomLevel == TimeLineScales.length - 1}
            onClick={handleZoomOut}
          >
            <CiZoomOut />
          </button>
          <button
            style={{ fontSize: "15px" }}
            disabled={timeLine.startTime == 0}
            onClick={handleShiftLeft}
          >
            <CiCircleChevLeft />
          </button>
          <button style={{ fontSize: "15px" }} onClick={handleShiftRight}>
            <CiCircleChevRight />
          </button>
        </fieldset>
      </div>
  )
}
