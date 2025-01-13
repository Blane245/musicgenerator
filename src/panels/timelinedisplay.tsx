// display the time line based on the current start time and
// zoom level
// handle time line interval editing
import numeral from "numeral";
import { MouseEvent, useEffect, useRef, useState } from "react";
import {
  CiCircleChevLeft,
  CiCircleChevRight,
  CiZoomIn,
  CiZoomOut,
} from "react-icons/ci";
import TimeLine from "../classes/timeline";
import { useCMGContext } from "../cmgcontext";
import { precision } from "../sfcomponents/util";
import {
  TIMEFORMATS,
  TimelineInterval,
  TimeLineScale,
  TimeLineScales,
} from "../types";
import setCursor from "../utils/setcursor";

// render the timeline and control the timeline interval
export default function TimeLineDisplay() {
  const {
    timeLine,
    setTimeLine,
    setTimeInterval,
    timeProgress,
    playing,
    mouseDown,
    setMouseDown,
  } = useCMGContext();
  const timeLineRef = useRef<HTMLDivElement>(null);
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

  // local time interval used during editing
  const [interval, setInterval] = useState<TimelineInterval>({
    startOffset: -1,
    endOffset: -1,
  });

  // the type of time interval editing being done
  const [type, setType] = useState<string>("");

  // create the timeline object when the time line starts up
  useEffect(() => {
    if (timeLineRef && timeLineRef.current) {
      const width: number = timeLineRef.current.clientWidth;
      const height: number = timeLineRef.current.clientHeight;
      const newT = new TimeLine(width, height);
      setTimeLine(newT);
    }
  }, []);

  // update the playback tick and time line start time when the time progress changes
  useEffect(() => {
    if (timeProgress >= 0 && ticks.scaleExtent > 0) {
      // shift left or right if the time progress is to the left or right of the start time
      const extent = timeLine.timeLineScale.extent;
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
      const scale: TimeLineScale = timeLine.timeLineScale;
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
      setInterval((prev) => {
        if (prev.startTime != undefined && prev.endTime != undefined) {
          const newInterval: TimelineInterval = { ...prev };
          const startTime: number = timeLine.startTime;
          const stopTime: number = startTime + timeLine.timeLineScale.extent;
          newInterval.startOffset = Math.max(
            (timeLine.width * (prev.startTime - startTime)) /
              (stopTime - startTime),
            0
          );
          newInterval.endOffset = Math.min(
            (timeLine.width * (prev.endTime - startTime)) /
              (stopTime - startTime),
            timeLine.width
          );

          // broadcast change
          setTimeInterval(newInterval);
          return newInterval;
        } else return prev;
      });
    }
  }, [timeLine]);

  // if the mouse has been released and an interval is properly defined
  // end its definition and broadcast it
  useEffect(() => {
    if (!mouseDown) {
      if (interval.startOffset >= 0 && interval.endOffset >= 0) {
        // signal change to larger community
        if (interval.startOffset < interval.endOffset) {
          setTimeInterval(interval);
        } else {
          setTimeInterval({ startOffset: -1, endOffset: -1 });
        }
        setType("");
      }
    }
  }, [mouseDown]);

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

  // the timeline, interval body, and edges have mousedown handlers
  // this will either initiate the definition of a new interval
  // or allow an existing interval to be changed
  function handleMouseDown(
    e: MouseEvent<SVGRectElement | SVGPathElement>
  ): void {
    if (!playing.current) {
      e.preventDefault();
      e.stopPropagation();
      const type: string = e.currentTarget.id;

      // set the cursor in preparation of a mouse movement
      if (type == "intervalbox") {
        setCursor("grab");
      } else setCursor("ew-resize");

      // initialize the interval if in define interval and switch mode set to move left
      if (type == "timeline") {
        setInterval(
          getTimes({
            startOffset: e.nativeEvent.offsetX,
            endOffset: e.nativeEvent.offsetX,
          })
        );
        setType("intervalleftedge");
      } else setType(type);

      // tell the page that the mouse is down
      setMouseDown(true);
    }
  }

  // calculate the resulting start and end times
  // and signal the CMG context so the generator can get to it
  function getTimes(interval: TimelineInterval): TimelineInterval {
    if (interval.startOffset >= 0 && interval.endOffset >= 0) {
      const newInterval: TimelineInterval = { ...interval };
      newInterval.startTime = precision(
        timeLine.startTime +
          (timeLine.timeLineScale.extent * interval.startOffset) /
            timeLine.width,
        1
      );
      newInterval.endTime = precision(
        timeLine.startTime +
          (timeLine.timeLineScale.extent * interval.endOffset) / timeLine.width,
        1
      );
      return newInterval;
    } else {
      // console.log(
      //   "getTimes: attempt to complete interval before definition is complete"
      // );
      return interval;
    }
  }

  // handle mouse move for timeline, interval, or edges
  function handleMouseMove(
    e: MouseEvent<SVGRectElement | SVGPathElement>
  ): void {
    if (mouseDown && !playing.current) {
      e.preventDefault();
      e.stopPropagation();
      const x: number = e.nativeEvent.offsetX;
      const deltaX: number = e.nativeEvent.movementX;

      // skip if no change or out of bounds
      if (deltaX == 0 || x < 0 || x > timeLine.width) return;

      // depending on the type of movement...
      const newInterval: TimelineInterval = { ...interval };
      if (type == "intervalleftedge") {
        if (x < interval.endOffset) {
          // left move
          newInterval.startOffset = x;
        } else {
          //right move - switch roles
          newInterval.startOffset = newInterval.endOffset;
          newInterval.endOffset = x;
          setType("intervalrightedge");
        }
        setInterval(getTimes(newInterval));
      } else if (type == "intervalrightedge") {
        if (x < interval.startOffset) {
          // left move - switch roles
          newInterval.endOffset = newInterval.startOffset;
          newInterval.startOffset = x;
          setType("intervalleftedge");
        } else {
          //right move
          newInterval.endOffset = x;
        }
        setInterval(getTimes(newInterval));
      } else if (type == "intervalbox") {
        const newStart = newInterval.startOffset + deltaX;
        const newEnd = newInterval.endOffset + deltaX;

        // the new start and end points must be between the timeline
        // boundaries [0, timeline.width] or the move is rejected
        if (
          newStart >= 0 &&
          newStart <= timeLine.width &&
          newEnd >= 0 &&
          newEnd <= timeLine.width
        ) {
          newInterval.startOffset = newStart;
          newInterval.endOffset = newEnd;
          setInterval(getTimes(newInterval));
        }
      } else console.log("invalid movement type", type);
    }
  }

  // when the mouse is up change cursor to the appropriate type based on which component is entered
  function handleMouseEnter(
    e: MouseEvent<SVGRectElement | SVGPathElement>
  ): void {
    if (mouseDown || playing.current) return;
    e.preventDefault();
    e.stopPropagation();
    const type: string = e.currentTarget.id;
    switch (type) {
      case "timeline": {
        setCursor("crosshair");
        break;
      }
      case "intervalbox": {
        setCursor("grab");
        break;
      }
      case "intervalleftedge":
      case "intervalrightedge": {
        setCursor("ew-resize");
        break;
      }
      default: {
        // console.log("handleMouseEnter mouse enter not handled");
        break;
      }
    }
  }

  // when the mouse is up change cursor back to default
  function handleMouseLeave(
    e: MouseEvent<SVGRectElement | SVGPathElement>
  ): void {
    if (mouseDown || playing.current) return;
    e.preventDefault();
    e.stopPropagation();
    setCursor("default");
  }

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
                  onMouseDown={(e) => handleMouseDown(e)}
                  onMouseMove={(e) => handleMouseMove(e)}
                  onMouseEnter={(e) => handleMouseEnter(e)}
                  onMouseLeave={(e) => handleMouseLeave(e)}
                />
                <path
                  className="intervaledge"
                  id="intervalleftedge"
                  d={`m ${interval.startOffset} 0 L ${interval.startOffset} ${timeLine.height}`}
                  onMouseDown={(e) => handleMouseDown(e)}
                  onMouseMove={(e) => handleMouseMove(e)}
                  onMouseEnter={(e) => handleMouseEnter(e)}
                  onMouseLeave={(e) => handleMouseLeave(e)}
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
                  onMouseDown={(e) => handleMouseDown(e)}
                  onMouseMove={(e) => handleMouseMove(e)}
                  onMouseEnter={(e) => handleMouseEnter(e)}
                  onMouseLeave={(e) => handleMouseLeave(e)}
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

  return (
    <>
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
      <div ref={timeLineRef} className="page-time-timeline">
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
            onMouseEnter={(e) => handleMouseEnter(e)}
            onMouseLeave={(e) => handleMouseLeave(e)}
            onMouseDown={(e) => handleMouseDown(e)}
            onMouseMove={(e) => handleMouseMove(e)}
          />
          <path
            stroke="black"
            d={`m 0 ${timeLine.height} H ${timeLine.width}`}
          />
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
          <DisplayInterval interval={interval} timeLine={timeLine} />
        </svg>
      </div>
    </>
  );
}
