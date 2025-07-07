// display the time line based on the current start time and
// zoom level
// handle time line interval editing
import numeral from "numeral";
import {
  forwardRef,
  MouseEvent,
  MutableRefObject,
  useEffect,
  useState,
} from "react";
import TimeLine from "../classes/timeline";
import { useCMGContext } from "../cmgcontext";
import { precision } from "../sfcomponents/util";
import {
  TIMEFORMATS,
  TIMEINTERVALEDGE,
  TIMEINTERVALMODE,
  TimelineInterval,
  TimeLineScale,
  TimeLineScales,
} from "../types";
import setCursor from "../utils/setcursor";
type TimeLineDisplayProps = {
  timeLineRef: MutableRefObject<Element[]>;
};
// render the timeline and control the timeline interval
// thanx for AWolf's option 2 answer to https://stackoverflow.com/questions/58222004/how-to-get-parent-width-height-in-react-using-hooks
const TimeLineDisplay = forwardRef((props: TimeLineDisplayProps) => {
  const { timeLineRef } = props;
  const {
    verticalScrollWidth,
    timeLine,
    setTimeLine,
    timeInterval,
    setTimeInterval,
    timeProgress,
    playing,
    mouseDown,
    mouseLocation,
    setMouseLocation,
  } = useCMGContext();
  const [ticks, setTicks] = useState<{
    majorTickCount: number;
    scaleExtent: number;
    tickCount: number;
    tickHeight: number;
    tickSpacing: number;
    labelSize: number;
    labelSpacing: number;
    labelFormat: string;
  }>({
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
  const [mode, setMode] = useState<TIMEINTERVALMODE>(TIMEINTERVALMODE.None);
  const [edge, setEdge] = useState<TIMEINTERVALEDGE>(TIMEINTERVALEDGE.None);

  useEffect(() => {
    const resizeObserver: ResizeObserver = new ResizeObserver(
      (event: ResizeObserverEntry[]) => {
        const width = Math.max(
          event[0].contentBoxSize[0].inlineSize - verticalScrollWidth,
          0
        );
        const height = event[0].contentBoxSize[0].blockSize;
        const n: TimeLine = new TimeLine(width, height);
        setTimeLine(n);
      }
    );
    if (timeLineRef && timeLineRef.current && timeLineRef.current.length > 0) {
      resizeObserver.observe(timeLineRef.current[0]);
    }
  }, [timeLineRef]);

  // update the playback tick and time line start time when the time progress changes
  useEffect(() => {
    if (timeProgress >= 0 && ticks.scaleExtent > 0) {
      // shift left or right if the time progress is to the left or right of the start time
      const extent = TimeLineScales[timeLine.currentZoomLevel].extent;
      let startTime = timeLine.startTime;
      if (timeProgress < startTime || timeProgress > startTime + extent) {
        while (timeProgress < startTime && startTime != 0) {
          startTime = Math.max(startTime - extent / 2.0, 0);
        }
        while (timeProgress > startTime + extent) {
          startTime += extent / 2.0;
        }
        if (startTime != timeLine.startTime) {
          setTimeLine((c: TimeLine) => {
            const n = c.copy();
            n.startTime = startTime;
            return n;
          });
        }
      }

      // move the playback tick
      const playbackElem = document.getElementById("playback-tick");
      if (playbackElem) {
        const newLoc =
          (timeLine.width * (timeProgress - startTime)) / ticks.scaleExtent;
        playbackElem.setAttribute("x1", newLoc.toString());
        playbackElem.setAttribute("x2", newLoc.toString());
      }
    }
  }, [timeProgress]);

  // capture the tick parameters and update the time interval when the zoom level changes
  // update the time interval offsets based on the time line start time
  useEffect(() => {
    if (
      timeLine.currentZoomLevel >= 0 &&
      timeLine.currentZoomLevel < TimeLineScales.length
    ) {
      const scale: TimeLineScale = TimeLineScales[timeLine.currentZoomLevel];
      setTicks({
        majorTickCount: scale.majorDivisions,
        scaleExtent: scale.extent,
        tickCount: scale.majorDivisions * scale.minorDivisions,
        tickHeight: timeLine.height / 3.0,
        tickSpacing:
          timeLine.width / (scale.majorDivisions * scale.minorDivisions),
        labelSize: timeLine.height / 3.0,
        labelSpacing: timeLine.width / scale.majorDivisions,
        labelFormat: TIMEFORMATS[scale.format].value,
      });

      // set the left and right offsets of the timeline interval based on the interval's times.
      setTimeInterval((prev) => {
        if (prev.startTime != undefined && prev.endTime != undefined) {
          const newInterval: TimelineInterval = { ...prev };
          const tStart: number = timeLine.startTime;
          const tStop: number = tStart + scale.extent;
          newInterval.startOffset = Math.min(
            Math.max(
              (timeLine.width * (prev.startTime - tStart)) / (tStop - tStart),
              0
            ),
            timeLine.width
          );
          newInterval.endOffset = Math.max(
            Math.min(
              (timeLine.width * (prev.endTime - tStart)) / (tStop - tStart),
              timeLine.width
            ),
            0
          );

          // broadcast change
          setTimeInterval(newInterval);
          return newInterval;
        } else return prev;
      });
    }
  }, [timeLine]);

  // useeffect handler for mouse move in Define and Move modes
  useEffect(() => {
    if (mode == TIMEINTERVALMODE.Define && mouseLocation) {
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
            console.log("interval redefinition ", newInterval);
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
            console.log("interval redefinition ", newInterval);
          }
          break;
        default:
          console.log("bad interval edge definition ", edge);
          break;
      }
    }
    if (mode == TIMEINTERVALMODE.Move && mouseLocation) {
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
        console.log("interval moved to ", newInterval);
      } else {
        console.log("interval not moved to ", newStart, newEnd);
      }
    }
    if (!mouseLocation && mode == TIMEINTERVALMODE.Define) {
      console.log("terminate interval definition", timeInterval);
      setMode(TIMEINTERVALMODE.None);
    }
    if (!mouseLocation && mode == TIMEINTERVALMODE.Move) {
      console.log("terminate interval move", timeInterval);
      setMode(TIMEINTERVALMODE.None);
    }
    if (!mouseLocation && mode == TIMEINTERVALMODE.None) setCursor("default");
  }, [mouseLocation]);

  // build the tick marks
  function getTickLines(count: number, height: number, spacing: number) {
    const result: JSX.Element[] = [];
    if (timeLine) {
      for (let i = 0; i <= count; i++) {
        const d: string = `m ${i * spacing} ${timeLine.height}  L ${
          i * spacing
        }  ${timeLine.height - height}`;
        result.push(<path key={"tick-" + i} d={d} stroke="black" />);
      }
    }
    return result;
  }

  // add the major tick mark labels
  function getTickLabels(
    count: number,
    size: number,
    spacing: number,
    extent: number,
    format: string
  ) {
    const result: JSX.Element[] = [];
    const sizepx: string = size.toString().concat("px");
    for (let i = 0; i <= count; i++) {
      const tValue: number = timeLine.startTime + i * (extent / count);
      const tText = numeral(tValue).format(format);
      let tAnchor: string = "middle";
      if (i == 0) tAnchor = "start";
      if (i == count) tAnchor = "end";
      result.push(
        <text
          key={"ticktext-" + i}
          x={i * spacing}
          y={size}
          fontSize={sizepx}
          textAnchor={tAnchor}
        >
          {tText}
        </text>
      );
    }
    return result;
  }

  // calculate the resulting start and end times
  function getTimes(interval: TimelineInterval): TimelineInterval {
    const scale: TimeLineScale = TimeLineScales[timeLine.currentZoomLevel];
    if (interval.startOffset >= 0 && interval.endOffset >= 0) {
      const newInterval: TimelineInterval = { ...interval };
      newInterval.startTime = precision(
        timeLine.startTime +
          (scale.extent * interval.startOffset) / timeLine.width,
        1
      );
      newInterval.endTime = precision(
        timeLine.startTime +
          (scale.extent * interval.endOffset) / timeLine.width,
        1
      );
      return newInterval;
    } else {
      return interval;
    }
  }

  // the mouse event handlers for timeinterval definition and movement
  // mouse up and mouse move events are handled by the home page and relayed through
  // the context. They are handled by useEffect
  // The only mouse event here are for entering and leaving the timeinterval body, left, or right
  // edges, and mouse down for timeline and timeinterval elements
  function onMouseEnterTimeIntervalBody(
    event: MouseEvent<SVGRectElement>
  ): void {
    // when the mouse enters the time interval body with mouse up, change the cursor to hand
    if (mode != TIMEINTERVALMODE.Define && !mouseDown.current) {
      setCursor("grab");
      event.stopPropagation();
      event.preventDefault();
    }
  }

  function onMouseLeaveTimeIntervalBody(
    event: MouseEvent<SVGRectElement>
  ): void {
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
    // when the mouse enters the time interval edge with mouse up and not in move mode
    if (!mouseDown.current && mode != TIMEINTERVALMODE.Move) {
      setCursor("ew-resize");
      setEdge(edge);
      console.log("enter edge set cursor to ew-resize");
      event.stopPropagation();
      event.preventDefault();
    }
  }

  function onMouseLeaveTimeIntervalEdge(
    event: MouseEvent<SVGPathElement>
  ): void {
    // when the mouse leaves the time interval edge with mouse up, change the cursor to default
    if (!mouseDown.current) {
      setCursor("default");
      console.log("leave edge set cursor to default");
      event.stopPropagation();
      event.preventDefault();
    }
  }

  function onMouseDownTimeLine(event: MouseEvent<SVGRectElement>) {
    setMode(TIMEINTERVALMODE.Define);
    setCursor("ew-resize");
    setEdge(TIMEINTERVALEDGE.Left);
    const X: number = event.nativeEvent.offsetX;
    const Y: number = event.nativeEvent.offsetY;
    let newInterval: TimelineInterval = { startOffset: X, endOffset: X };
    setMouseLocation({ X: X, Y: Y, dX: 0, dY: 0 });
    newInterval = getTimes(newInterval);
    setTimeInterval(newInterval);
    mouseDown.current = true;
    console.log("initiate interval definition", newInterval);
  }

  function onMouseDownTimeInterval(event: MouseEvent<SVGRectElement>) {
    setMode(TIMEINTERVALMODE.Move);
    setCursor("grab");
    setEdge(TIMEINTERVALEDGE.None);
    setMouseLocation({
      X: event.nativeEvent.offsetX,
      Y: event.nativeEvent.offsetY,
      dX: 0,
      dY: 0,
    });
    mouseDown.current = true;
    console.log("initiate interval move", timeInterval);
  }

  function onMouseDownTimeIntervalEdge(
    event: MouseEvent<SVGPathElement>,
    edge: TIMEINTERVALEDGE
  ) {
    const X: number = event.nativeEvent.offsetX;
    const Y: number = event.nativeEvent.offsetY;
    setMouseLocation({ X: X, Y: Y, dX: 0, dY: 0 });
    mouseDown.current = true;
    setMode(TIMEINTERVALMODE.Define);
    setCursor("ew-resize");
    setEdge(edge);
    console.log("initiate interval redefinition on ", edge, "edge");
  }

  return (
    <fieldset disabled={playing.current} style={{ width: "inherit" }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={timeLine.width}
        height={timeLine.height}
        viewBox={`0 0 ${timeLine.width} ${timeLine.height}`}
      >
        <rect
          className="timeline"
          id="timeline"
          x={0}
          y={0}
          width={timeLine.width}
          height={timeLine.height}
          onMouseDown={(e) => onMouseDownTimeLine(e)}
        />
        <path stroke="black" d={`m 0 ${timeLine.height} H ${timeLine.width}`} />
        {getTickLines(ticks.tickCount, ticks.tickHeight, ticks.tickSpacing)}
        {getTickLabels(
          ticks.majorTickCount,
          ticks.labelSize,
          ticks.labelSpacing,
          ticks.scaleExtent,
          ticks.labelFormat
        )}
        <line
          stroke="red"
          x1="0"
          x2="0"
          y1="0"
          y2={timeLine.height}
          id="playback-tick"
        />
        <DisplayInterval interval={timeInterval} timeLine={timeLine} />
      </svg>
    </fieldset>
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
        {interval.startOffset >= 0 && interval.endOffset >= 0 ? (
          <>
            {interval.startOffset != interval.endOffset ? (
              <>
                <rect
                  className="intervalbox"
                  id="intervalbox"
                  x={interval.startOffset}
                  y={0}
                  height={timeLine.height}
                  width={interval.endOffset - interval.startOffset}
                  onMouseDown={(e) => onMouseDownTimeInterval(e)}
                  onMouseEnter={(e) => onMouseEnterTimeIntervalBody(e)}
                  onMouseLeave={(e) => onMouseLeaveTimeIntervalBody(e)}
                />
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
            {interval.endOffset <= timeLine.width &&
            interval.startOffset != interval.endOffset ? (
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
});

export default TimeLineDisplay;
