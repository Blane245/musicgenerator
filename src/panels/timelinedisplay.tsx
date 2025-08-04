// display the time line based on the current start time and
// zoom level
// handle time line interval editing
import TimeLine from "classes/timeline";
import { useCMGContext } from "cmgcontext";
import { MouseEvent, useEffect, useState } from "react";
import { precision } from "sfcomponents/util";
import {
  GENERATIONMODE,
  TIMEINTERVALEDGE,
  TIMEINTERVALMODE,
  TimelineInterval,
  TimeLineScale,
  TimeLineScales,
  TimeTicks,
} from "types";
import getTickLinesandLabels from "utils/getticklinesandlabels";
import setCursor from "utils/setcursor";
import updateTimeTicks from "utils/updatetimeticks";
export default function TimeLineDisplay() {
  const {
    mode,
    timelineHeight,
    timelineWidth,
    timeLine,
    setTimeLine,
    timeInterval,
    setTimeInterval,
    playing,
    mouseDown,
    mouseLocation,
    setMouseLocation,
  } = useCMGContext();
  const [ticks, setTicks] = useState<TimeTicks>({
    majorTickCount: 0,
    tickCount: 0,
    tickHeight: 0,
    tickSpacing: 0,
    labelSize: 0,
    labelSpacing: 0,
    scaleExtent: 0,
    labelFormat: "",
  });

  // the Mode of the timeinterval editor
  // the Edge of the timeinterval editor
  const [edgeMode, setEdgeMode] = useState<TIMEINTERVALMODE>(
    TIMEINTERVALMODE.None
  );
  const [edge, setEdge] = useState<TIMEINTERVALEDGE>(TIMEINTERVALEDGE.None);

  // initialize the timeline and ticks when the size changes
  useEffect(() => {
    let newTimeLine: TimeLine | null = null;
    if (timelineHeight != 0 && timelineWidth != 0) {
      if (!timeLine) {
        newTimeLine = new TimeLine(timelineWidth, timelineHeight); // changed scrren size
      } else {
        newTimeLine = timeLine.copy(); // returning from preview
      }
      setTimeLine(newTimeLine);
      const newTimeTicks: TimeTicks | null = updateTimeTicks(newTimeLine);
      if (newTimeTicks) setTicks(newTimeTicks);
      // console.log(
      //   "update timeline and ticks on display change, timelineWidth, timelineHeight, newtimeline newticks",
      //   timelineWidth,
      //   timelineHeight,
      //   newTimeLine,
      //   newTimeTicks
      // );
    }
  }, [timelineWidth, timelineHeight]);

  // when the timeline or the generation mode changes to idle, update the ticks
  useEffect(() => {
    if (mode == GENERATIONMODE.idle && timeLine) {
      const newTimeTicks: TimeTicks | null = updateTimeTicks(timeLine);
      if (newTimeTicks) setTicks(newTimeTicks);
      // const newTimeInterval: TimelineInterval | null = updateTimeInterval(timeInterval, timeLine);
      // if (newTimeInterval) setTimeInterval(newTimeInterval);
      // console.log("update ticks on entering idle", newTimeTicks);
    }
  }, [timeLine, mode]);

  // useeffect handler for mouse move in Define and Move modes
  useEffect(() => {
    if (edgeMode == TIMEINTERVALMODE.Define && mouseLocation) {
      // change the timeinterval definiiton based on the curent mouse X relative location
      let newInterval: TimelineInterval = { ...timeInterval };
      const X: number = mouseLocation.X;
      switch (edge) {
        case TIMEINTERVALEDGE.Left:
          {
            if (X < timeInterval.endOffset) newInterval.startOffset = X;
            else {
              newInterval.startOffset = newInterval.endOffset;
              newInterval.endOffset = X;
              setEdge(TIMEINTERVALEDGE.Right);
            }
            newInterval = getTimes(newInterval);
            setTimeInterval(newInterval);
            // console.log("interval redefinition ", newInterval);
          }
          break;
        case TIMEINTERVALEDGE.Right:
          {
            if (X > timeInterval.startOffset) {
              newInterval.endOffset = X;
            } else {
              newInterval.endOffset = newInterval.startOffset;
              newInterval.startOffset = X;
              setEdge(TIMEINTERVALEDGE.Left);
            }
            newInterval = getTimes(newInterval);
            setTimeInterval(newInterval);
            // console.log("interval redefinition ", newInterval);
          }
          break;
        default:
          // console.log("bad interval edge definition ", edge);
          break;
      }
    }
    if (edgeMode == TIMEINTERVALMODE.Move && mouseLocation && timeLine) {
      // change the timeinterval position based on the current mouse X relative location
      const dX: number = mouseLocation.dX;
      let newInterval: TimelineInterval = { ...timeInterval };
      const newStart: number = newInterval.startOffset + dX;
      const newEnd: number = newInterval.endOffset + dX;
      if (
        newStart >= 0 &&
        newStart <= timeLine.width &&
        newEnd >= 0 &&
        newEnd <= timeLine.width
      ) {
        newInterval.startOffset = newStart;
        newInterval.endOffset = newEnd;
        newInterval = getTimes(newInterval);
        setTimeInterval(newInterval);
        // console.log("interval moved to ", newInterval);
      } else {
        // console.log("interval not moved to ", newStart, newEnd);
      }
    }
    if (!mouseLocation && edgeMode == TIMEINTERVALMODE.Define) {
      // console.log("terminate interval definition", timeInterval);
      setEdgeMode(TIMEINTERVALMODE.None);
    }
    if (!mouseLocation && edgeMode == TIMEINTERVALMODE.Move) {
      // console.log("terminate interval move", timeInterval);
      setEdgeMode(TIMEINTERVALMODE.None);
    }
    if (!mouseLocation && edgeMode == TIMEINTERVALMODE.None)
      setCursor("default");
  }, [mouseLocation]);

  // calculate the resulting start and end times
  function getTimes(interval: TimelineInterval): TimelineInterval {
    const newInterval: TimelineInterval = { ...interval };
    if (timeLine) {
      const scale: TimeLineScale = TimeLineScales[timeLine.currentZoomLevel];
      if (interval.startOffset >= 0) {
        newInterval.startTime = precision(
          timeLine.startTime +
            (scale.extent * interval.startOffset) / timeLine.width,
          1
        );
      }
      if (interval.endOffset <= timeLine.width) {
        newInterval.endTime = precision(
          timeLine.startTime +
            (scale.extent * interval.endOffset) / timeLine.width,
          1
        );
      }
    }
    return newInterval;
  }

  // the mouse event handlers for timeinterval definition and movement
  // mouse up and mouse move events are handled by the home page and relayed through
  // the context. They are handled by useEffect
  // The only mouse event here are for entering and leaving the timeinterval body, left, or right
  // edges, and mouse down for timeline and timeinterval elements
  function onMouseEnterTimeIntervalBody(
    event: MouseEvent<SVGRectElement>
  ): void {
    if (playing.current) return;
    // when the mouse enters the time interval body with mouse up, change the cursor to hand
    if (edgeMode != TIMEINTERVALMODE.Define && !mouseDown.current) {
      setCursor("grab");
      event.stopPropagation();
      event.preventDefault();
    }
  }

  function onMouseLeaveTimeIntervalBody(
    event: MouseEvent<SVGRectElement>
  ): void {
    if (playing.current) return;
    // when the mouse leaves the time interval body with mouse up, change the cursor to default
    if (!mouseDown.current) {
      setCursor("default");
      event.stopPropagation();
      event.preventDefault();
    }
  }

  function onMouseEnterTimeIntervalEdge(
    event: MouseEvent<SVGPathElement>,
    edge: TIMEINTERVALEDGE
  ): void {
    if (playing.current) return;
    // when the mouse enters the time interval edge with mouse up and not in move mode
    if (!mouseDown.current && edgeMode != TIMEINTERVALMODE.Move) {
      setCursor("ew-resize");
      setEdge(edge);
      // console.log("enter edge set cursor to ew-resize");
      event.stopPropagation();
      event.preventDefault();
    }
  }

  function onMouseLeaveTimeIntervalEdge(
    event: MouseEvent<SVGPathElement>
  ): void {
    if (playing.current) return;
    // when the mouse leaves the time interval edge with mouse up, change the cursor to default
    if (!mouseDown.current) {
      setCursor("default");
      // console.log("leave edge set cursor to default");
      event.stopPropagation();
      event.preventDefault();
    }
  }

  function onMouseDownTimeLine(event: MouseEvent<SVGRectElement>) {
    if (playing.current) return;
    setEdgeMode(TIMEINTERVALMODE.Define);
    setCursor("ew-resize");
    setEdge(TIMEINTERVALEDGE.Left);
    const X: number = event.nativeEvent.offsetX;
    const Y: number = event.nativeEvent.offsetY;
    let newInterval: TimelineInterval = { startOffset: X, endOffset: X };
    setMouseLocation({ X: X, Y: Y, dX: 0, dY: 0 });
    newInterval = getTimes(newInterval);
    setTimeInterval(newInterval);
    mouseDown.current = true;
    // console.log("initiate interval definition", newInterval);
  }

  function onMouseDownTimeInterval(event: MouseEvent<SVGRectElement>) {
    if (playing.current) return;
    setEdgeMode(TIMEINTERVALMODE.Move);
    setCursor("grab");
    setEdge(TIMEINTERVALEDGE.None);
    setMouseLocation({
      X: event.nativeEvent.offsetX,
      Y: event.nativeEvent.offsetY,
      dX: 0,
      dY: 0,
    });
    mouseDown.current = true;
    // console.log("initiate interval move", timeInterval);
  }

  function onMouseDownTimeIntervalEdge(
    event: MouseEvent<SVGPathElement>,
    edge: TIMEINTERVALEDGE
  ) {
    if (playing.current) return;
    const X: number = event.nativeEvent.offsetX;
    const Y: number = event.nativeEvent.offsetY;
    setMouseLocation({ X: X, Y: Y, dX: 0, dY: 0 });
    mouseDown.current = true;
    setEdgeMode(TIMEINTERVALMODE.Define);
    setCursor("ew-resize");
    setEdge(edge);
    // console.log("initiate interval redefinition on ", edge, "edge");
  }

  return (
    <>
      {timeLine ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={timeLine.width}
          height={timeLine.height}
          viewBox={`0 0 ${timeLine.width} ${timeLine.height}`}
        >
          <rect
            id="timeline"
            x={0}
            y={0}
            width={timeLine.width}
            height={timeLine.height}
            style={{ backgroundColor: "white" }}
            onMouseDown={(e) => onMouseDownTimeLine(e)}
          />
          <path
            stroke="black"
            d={`m 0 ${timeLine.height} H ${timeLine.width}`}
          />
          {getTickLinesandLabels(timeLine, ticks)}
          <DisplayInterval interval={timeInterval} timeLine={timeLine} />
        </svg>
      ) : null}
    </>
  );

  // build the JSX for the timeline interval
  interface DisplayIntervalProps {
    timeLine: TimeLine;
    interval: TimelineInterval;
  }
  function DisplayInterval(props: DisplayIntervalProps) {
    const { interval, timeLine } = props;

    return (
      <>
        {/* is any part of the time interval within the currently displayed timeline? */}
        {((interval.startOffset < 0 && interval.endOffset > 0) ||
          (interval.startOffset >= 0 &&
            interval.startOffset < timeLine.width)) &&
        interval.startOffset != interval.endOffset ? (
          <>
            <rect
              className="intervalbox"
              id="intervalbox"
              x={Math.max(interval.startOffset, 0)}
              y={0}
              height={timeLine.height}
              width={Math.min(
                interval.endOffset - Math.max(interval.startOffset, 0),
                timeLine.width
              )}
              onMouseDown={(e) => onMouseDownTimeInterval(e)}
              onMouseEnter={(e) => onMouseEnterTimeIntervalBody(e)}
              onMouseLeave={(e) => onMouseLeaveTimeIntervalBody(e)}
            />
            {/* is the start edge visible */}
            {interval.startOffset >= 0 ? (
              <>
                <path
                  className="intervaledge"
                  id="intervalleftedge"
                  d={`m ${interval.startOffset} 0 L ${interval.startOffset} ${timeLine.height}`}
                  onMouseDown={(e) =>
                    onMouseDownTimeIntervalEdge(e, TIMEINTERVALEDGE.Left)
                  }
                  onMouseEnter={(e) =>
                    onMouseEnterTimeIntervalEdge(e, TIMEINTERVALEDGE.Left)
                  }
                  onMouseLeave={(e) => onMouseLeaveTimeIntervalEdge(e)}
                />
                <polygon
                  className="intervalmarker"
                  points={`${interval.startOffset}, ${timeLine.height}
                    ${interval.startOffset - 10}, ${timeLine.height}
                    ${interval.startOffset}, ${timeLine.height - 10}`}
                />
              </>
            ) : null}
            {/* is the end edge visible */}
            {interval.endOffset <= timeLine.width ? (
              <>
                <path
                  className="intervaledge"
                  id="intervalrightedge"
                  d={`m ${interval.endOffset} 0 L ${interval.endOffset} ${timeLine.height}`}
                  onMouseDown={(e) =>
                    onMouseDownTimeIntervalEdge(e, TIMEINTERVALEDGE.Right)
                  }
                  onMouseEnter={(e) =>
                    onMouseEnterTimeIntervalEdge(e, TIMEINTERVALEDGE.Right)
                  }
                  onMouseLeave={(e) => onMouseLeaveTimeIntervalEdge(e)}
                />
                <polygon
                  className="intervalmarker"
                  points={`${interval.endOffset}, ${timeLine.height}
                    ${interval.endOffset + 10}, ${timeLine.height}
                    ${interval.endOffset}, ${timeLine.height - 10}`}
                />
              </>
            ) : null}
          </>
        ) : null}
      </>
    );
  }
}
