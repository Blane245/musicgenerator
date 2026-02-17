// display the time line based on the current start time and
// zoom level
// handle time line interval editing
// handle control editing
import TimeLine from "classes/timeline";
import { useCMGContext } from "cmgcontext";
import { MouseEvent, useEffect, useState } from "react";
import { precision } from "sfcomponents/util";
import {
  MouseLocation,
  TIMEINTERVALEDGE,
  TIMEINTERVALMODE,
  TimelineInterval,
  TimeLineScale,
  TimeLineScales,
  TimeTicks,
} from "types";
import { debug } from "utils/debug";
import getTickLinesandLabels from "utils/getticklinesandlabels";
import updateTimeTicks from "utils/updatetimeticks";
export default function TimeLineDisplay() {
  const {
    cursor,
    setCursor,
    timelineHeight,
    timelineWidth,
    timeLine,
    setTimeLine,
    timeInterval,
    setTimeInterval,
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
    TIMEINTERVALMODE.None,
  );
  const [edge, setEdge] = useState<TIMEINTERVALEDGE>(TIMEINTERVALEDGE.None);
  const [mouseLocation, setMouseLocation] = useState<MouseLocation | null>(
    null,
  );
  const [mouseDownTimeLine, setMouseDownTimeLine] = useState<boolean>(false);
  const [mouseDownTimeInterval, setMouseDownTimeInterval] =
    useState<boolean>(false);

  // initialize the timeline and ticks when the size changes
  useEffect(() => {
    let newTimeLine: TimeLine | null = null;
    if (timelineHeight != 0 && timelineWidth != 0) {
      // if a timeline aldready exists, grab its location and starttime
      // for setting to the new one
      let oldZoom: number = -1;
      let oldStart: number = -1;
      if (timeLine) {
        oldZoom = timeLine.currentZoomLevel;
        oldStart = timeLine.startTime;
      }
      newTimeLine = new TimeLine(timelineWidth, timelineHeight); // changed screen size
      if (oldZoom >= 0 && oldStart >= 0) {
        newTimeLine.currentZoomLevel = oldZoom;
        newTimeLine.startTime = oldStart;
      }
      setTimeLine(newTimeLine);
      const newTimeTicks: TimeTicks | null = updateTimeTicks(newTimeLine);
      if (newTimeTicks) setTicks(newTimeTicks);
      debug.info(
        "TimeLineDisplay: update timeline and ticks on display change, timelineWidth, timelineHeight, newtimeline newticks",
        timelineWidth,
        timelineHeight,
        newTimeLine,
        newTimeTicks,
      );
    }
  }, [timelineWidth, timelineHeight]);

  // when the timeline or the generation mode changes to idle, update the ticks and the controls
  useEffect(() => {
    if (!timeLine) return;
    const newTimeTicks: TimeTicks | null = updateTimeTicks(timeLine);
    if (newTimeTicks) setTicks(newTimeTicks);
    // const newTimeInterval: TimelineInterval | null = updateTimeInterval(timeInterval, timeLine);
    // if (newTimeInterval) setTimeInterval(newTimeInterval);
    debug.info("TimeLineDisplay: update ticks on entering idle", newTimeTicks);
  }, [timeLine]);

  // useeffect handler for mouse move in time interval Define and Move modes
  useEffect(() => {
    if (cursor == 'wait') return;
    if (!mouseDownTimeLine && !mouseDownTimeInterval) {
      setEdgeMode(TIMEINTERVALMODE.None);
      setEdge(TIMEINTERVALEDGE.None);
      setCursor("default");
      return;
    }
    if (!mouseLocation || !timeLine) return;
    debug.info("TimeLineDisplay: timeinterval mode", edgeMode);
    const X: number = mouseLocation.X;
    if (edgeMode == TIMEINTERVALMODE.Define) {
      // change the timeinterval definiiton based on the curent mouse X relative location
      switch (edge) {
        case TIMEINTERVALEDGE.Left:
          {
            let newInterval: TimelineInterval = timeInterval;
            if (X < timeInterval.endOffset) newInterval.startOffset = X;
            else {
              newInterval.startOffset = timeInterval.endOffset;
              newInterval.endOffset = X;
              setEdge(TIMEINTERVALEDGE.Right);
            }
            newInterval = getTimes(newInterval);
            setTimeInterval(newInterval);
          }
          break;
        case TIMEINTERVALEDGE.Right:
          {
            let newInterval: TimelineInterval = timeInterval;
            if (X > timeInterval.startOffset) {
              newInterval.endOffset = X;
            } else {
              newInterval.endOffset = timeInterval.startOffset;
              newInterval.startOffset = X;
              setEdge(TIMEINTERVALEDGE.Left);
            }
            newInterval = getTimes(newInterval);
            setTimeInterval(newInterval);
          }
          break;
        default:
          debug.info("TimeLineDisplay: bad interval edge definition ", edge);
          break;
      }
    }
    if (edgeMode == TIMEINTERVALMODE.Move) {
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
        debug.info("TimeLineDisplay: interval moved to ", newInterval);
      } else {
        debug.info("TimeLineDisplay: interval not moved to ", newStart, newEnd);
      }
    }
  }, [mouseLocation, mouseDownTimeInterval, mouseDownTimeLine]);

  // calculate the resulting start and end times
  function getTimes(interval: TimelineInterval): TimelineInterval {
    const newInterval: TimelineInterval = { ...interval };
    if (timeLine) {
      const scale: TimeLineScale = TimeLineScales[timeLine.currentZoomLevel];
      if (interval.startOffset >= 0) {
        newInterval.startTime = precision(
          timeLine.startTime +
            (scale.extent * interval.startOffset) / timeLine.width,
          1,
        );
      }
      if (interval.endOffset <= timeLine.width) {
        newInterval.endTime = precision(
          timeLine.startTime +
            (scale.extent * interval.endOffset) / timeLine.width,
          1,
        );
      }
    }
    return newInterval;
  }

  // when the mouse goes down on the time line initiate a time interval definition
  // on the left edge and cancel any interval moves
  function onMouseDownTimeLine(event: MouseEvent<SVGRectElement>) {
    if (cursor == 'wait') return;
    event.preventDefault();
    event.stopPropagation();
    setEdgeMode(TIMEINTERVALMODE.Define);
    setCursor("ew-resize");
    setEdge(TIMEINTERVALEDGE.Left);
    const X: number = event.nativeEvent.offsetX;
    const Y: number = event.nativeEvent.offsetY;
    setMouseLocation({ X: X, Y: Y, dX: 0, dY: 0 });
    const newInterval = getTimes({ startOffset: X, endOffset: X });
    setTimeInterval(newInterval);
    // debug.info("TimeLineDisplay: mouse down at", newInterval);
    setMouseDownTimeLine(true);
    setMouseDownTimeInterval(false);
  }

  // when the mouse is moving in the timeline and the mouse is down
  // in either define or move mode, track the new mouse location
  function onMouseMoveTimeLine(event: MouseEvent<SVGRectElement>) {
    if (cursor == 'wait') return;
    if (mouseDownTimeLine || mouseDownTimeInterval) {
      setMouseLocation({
        X: event.nativeEvent.offsetX,
        Y: event.nativeEvent.offsetY,
        dX: event.nativeEvent.movementX,
        dY: event.nativeEvent.movementY,
      });
      debug.info(
        "TimeLineDisplay: mouse move timeline nativeevent",
        event.nativeEvent.offsetX,
        event.nativeEvent.offsetY,
        event.nativeEvent.movementX,
        event.nativeEvent.movementY,
      );
    }
  }

  // when the mouse goes up in the time line, terminate the interval definition
  // and movement
  function onMouseUpTimeLine(event: MouseEvent<SVGRectElement>) {
    if (cursor == 'wait') return;
    event.preventDefault();
    event.stopPropagation();
    setEdgeMode(TIMEINTERVALMODE.None);
    setEdge(TIMEINTERVALEDGE.None);
    setCursor("default");
    debug.info("TimeLineDisplay: time line mouse goin up");
    setMouseDownTimeLine(false);
    setMouseDownTimeInterval(false);
    setMouseLocation(null);
  }

  // when the mouse enters the time interval and the mouse is not down
  // change the cursor to 'grab'
  function onMouseEnterTimeIntervalBody(
    event: MouseEvent<SVGRectElement>,
  ): void {
    if (cursor == 'wait') return;
    if (!mouseDownTimeInterval && !mouseDownTimeLine) {
      setCursor("grab");
      event.stopPropagation();
      event.preventDefault();
    }
  }

  // when the mouse goes down on the time interval and its not down
  // already for interval defintion, set the mode to move
  function onMouseDownTimeIntervalBody(event: MouseEvent<SVGRectElement>) {
    if (cursor == 'wait') return;
    event.stopPropagation();
    event.preventDefault();
    setEdgeMode(TIMEINTERVALMODE.Move);
    setEdge(TIMEINTERVALEDGE.None);
    setMouseLocation({
      X: event.nativeEvent.offsetX,
      Y: event.nativeEvent.offsetY,
      dX: 0,
      dY: 0,
    });
    setMouseDownTimeInterval(true);
    setMouseDownTimeLine(false);
    // debug.info("TimeLineDisplay: mouse down time interval");
  }

  // when the mouse moves in the interval bosy with the mouse down
  // perform the movement
  function onMouseMoveTimeIntervalBody(
    event: MouseEvent<SVGRectElement>,
  ): void {
    if (cursor == 'wait') return;
    if (!mouseDownTimeInterval) return;
    event.stopPropagation();
    event.preventDefault();
    setMouseLocation({
      X: event.nativeEvent.offsetX,
      Y: event.nativeEvent.offsetY,
      dX: event.nativeEvent.movementX,
      dY: event.nativeEvent.movementY,
    });
    debug.info(
      "TimeLineDisplay: mouse move time interval",
      event.nativeEvent.offsetX,
      event.nativeEvent.offsetY,
      event.nativeEvent.movementX,
      event.nativeEvent.movementY,
    );
  }

  // when the mouse goes up in the interval cancel all actions
  function onMouseUpTimeIntervalBody(event: MouseEvent<SVGRectElement>): void {
    // when the mouse leaves the time interval body with mouse up, change the cursor to default
    if (cursor == 'wait') return;
    setCursor("default");
    event.stopPropagation();
    event.preventDefault();
    setEdgeMode(TIMEINTERVALMODE.None);
    setEdge(TIMEINTERVALEDGE.None);
    setMouseDownTimeInterval(false);
    setMouseDownTimeLine(false);
    debug.info("TimeLineDisplay: interval mouse goes up");
  }

  // when the mouse enters an interval edge, set the edge entered and the cursor.
  function onMouseEnterTimeIntervalEdge(
    event: MouseEvent<SVGPathElement>,
    edge: TIMEINTERVALEDGE,
  ): void {
    if (cursor == 'wait') return;
    // when the mouse enters the time interval edge with mouse up
    if (!mouseDownTimeInterval && !mouseDownTimeLine) {
      setCursor("ew-resize");
      setEdge(edge);
      // debug.info("TimeLineDisplay: enter edge set cursor to ew-resize");
      event.stopPropagation();
      event.preventDefault();
    }
  }

  // when the mouse goes down on an interval edge
  // initiate teh define move
  function onMouseDownTimeIntervalEdge(
    event: MouseEvent<SVGPathElement>,
    edge: TIMEINTERVALEDGE,
  ) {
    if (cursor == 'wait') return;
    const X: number = event.nativeEvent.offsetX;
    const Y: number = event.nativeEvent.offsetY;
    setMouseLocation({ X: X, Y: Y, dX: 0, dY: 0 });
    setEdgeMode(TIMEINTERVALMODE.Define);
    setEdge(edge);
    setMouseDownTimeInterval(true);
    setMouseDownTimeLine(false);
    // debug.info("TimeLineDisplay: mouse down time interval edge");
  }

  // when the mouse moves in the interval edge with the mouse down
  // perform the movement
  function onMouseMoveTimeIntervalEdge(
    event: MouseEvent<SVGPathElement>,
  ): void {
    if (cursor == 'wait') return;
    if (!mouseDownTimeInterval) return;
    event.stopPropagation();
    event.preventDefault();
    setMouseLocation({
      X: event.nativeEvent.offsetX,
      Y: event.nativeEvent.offsetY,
      dX: event.nativeEvent.movementX,
      dY: event.nativeEvent.movementY,
    });
    debug.info(
      "TimeLineDisplay: mouse move time interval",
      event.nativeEvent.offsetX,
      event.nativeEvent.offsetY,
      event.nativeEvent.movementX,
      event.nativeEvent.movementY,
    );
  }

  // when the mouse goes up on the interval edge, cancel all changes
  function onMouseUpTimeIntervalEdge(event: MouseEvent<SVGPathElement>): void {
    if (cursor == 'wait') return;
    setCursor("default");
    // debug.info("mouse up interval edge");
    event.stopPropagation();
    event.preventDefault();
    setEdgeMode(TIMEINTERVALMODE.None);
    setEdge(TIMEINTERVALEDGE.None);
    setMouseDownTimeInterval(false);
    setMouseDownTimeLine(false);
  }

  return (
    <>
      {timeLine ? (
        <>
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
              onMouseUp={(e) => onMouseUpTimeLine(e)}
              // onMouseLeave={(e) => onMouseUpLeaveTimeLine(e)}
              onMouseMove={(e) => onMouseMoveTimeLine(e)}
            ></rect>
            {getTickLinesandLabels(timeLine, ticks, timeLine.width)}
            <DisplayInterval interval={timeInterval} timeLine={timeLine} />
            <path
              stroke="black"
              d={`m 0 ${timeLine.height} H ${timeLine.width}`}
            />
          </svg>
        </>
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
                timeLine.width,
              )}
              onMouseDown={(e) => onMouseDownTimeIntervalBody(e)}
              onMouseEnter={(e) => onMouseEnterTimeIntervalBody(e)}
              onMouseUp={(e) => onMouseUpTimeIntervalBody(e)}
              onMouseMove={(e) => onMouseMoveTimeIntervalBody(e)}
              onMouseLeave={() => setCursor("default")}
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
                  onMouseUp={(e) => onMouseUpTimeIntervalEdge(e)}
                  onMouseMove={(e) => onMouseMoveTimeIntervalEdge(e)}
                  onMouseLeave={() => setCursor("default")}
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
                  onMouseMove={(e) => onMouseMoveTimeIntervalEdge(e)}
                  onMouseUp={(e) => onMouseUpTimeIntervalEdge(e)}
                  onMouseLeave={() => setCursor("default")}
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
