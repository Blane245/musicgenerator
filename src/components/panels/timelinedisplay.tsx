import numeral from "numeral";
import { useEffect, useRef, useState } from "react";
import {
  CiCircleChevLeft,
  CiCircleChevRight,
  CiZoomIn,
  CiZoomOut,
} from "react-icons/ci";
import TimeLine from "../../classes/timeline";
import { useCMGContext } from "../../contexts/cmgcontext";
import {
  TIMEFORMATS,
  TimelineInterval,
  TimeLineScale,
  TimeLineScales,
} from "../../types/types";
import { precision } from "../../utils/util";

// render the timeline
// interval things to do
// left edge having trouble lock in t=min
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
  const [interval, setInterval] = useState<TimelineInterval>({
    startOffset: -1,
    endOffset: -1,
  });
  const [type, setType] = useState<string>("");

  // create the timeline object when the time line starts up
  useEffect(() => {
    if (timeLineRef && timeLineRef.current) {
      const width: number = timeLineRef.current.clientWidth || 0;
      const height: number = timeLineRef.current.clientHeight || 0;
      const newT = new TimeLine(width, height);
      setTimeLine(newT);
    }
  }, []);

  // update the playback tick when the time progress changes
  useEffect(() => {
    updatePlayBackTime();
  }, [timeProgress]);

  // capture the tick parameters and update the time interval when the zoom level changes
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
      setInterval((prev) => {
        if (prev.startTime && prev.endTime) {
          const newInterval: TimelineInterval = { ...prev };
          const startTime: number = timeLine.startTime;
          const stopTime: number =
            timeLine.startTime +
            TimeLineScales[timeLine.currentZoomLevel].extent;
          newInterval.startOffset = Math.max(
            (timeLine.width * (prev.startTime - startTime)) /
              (stopTime - startTime),
            1
          );
          newInterval.endOffset = Math.min(
            (timeLine.width * (prev.endTime - startTime)) /
              (stopTime - startTime),
            timeLine.width - 1
          );
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
        if (interval.startOffset != interval.endOffset) {
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
    const result = [];
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
    const result = [];
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

  function updatePlayBackTime() {
    if (ticks.scaleExtent > 0) {
      // shift left or right if the timeprogress is the left or right of the start time
      const extent = TimeLineScales[timeLine.currentZoomLevel].extent;
      let startTime = timeLine.startTime;
      if (timeProgress < timeLine.startTime) {
        while (timeProgress < startTime) {
          startTime = Math.max(startTime - extent / 2.0, 0);
        }
      } else if (timeProgress > timeLine.startTime + extent) {
        let endTime = timeLine.startTime + extent;
        while (timeProgress > endTime) {
          endTime += extent / 2.0;
          startTime = endTime - extent;
        }
      }

      // update the timeline if it has moved
      if (startTime != timeLine.startTime) {
        setTimeLine((c: TimeLine) => {
          const newC = new TimeLine(timeLine.width, timeLine.height);
          newC.currentZoomLevel = c.currentZoomLevel;
          newC.startTime = startTime;
          return newC;
        });
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
  }

  const handleZoomIn = (): void => {
    setTimeLine((c: TimeLine) => {
      const newC = new TimeLine(timeLine.width, timeLine.height);
      newC.currentZoomLevel = c.currentZoomLevel;
      newC.startTime = c.startTime;
      newC.zoomIn();
      return newC;
    });
  };
  const handleZoomOut = (): void => {
    setTimeLine((c: TimeLine) => {
      const newC = new TimeLine(timeLine.width, timeLine.height);
      newC.currentZoomLevel = c.currentZoomLevel;
      newC.startTime = c.startTime;
      newC.zoomOut();
      return newC;
    });
  };

  // shift time line start left 1/2 of the extent of the current zoom level
  const handleShiftLeft = (): void => {
    setTimeLine((c: TimeLine) => {
      const extent = TimeLineScales[c.currentZoomLevel].extent;
      const newC = new TimeLine(timeLine.width, timeLine.height);
      newC.currentZoomLevel = c.currentZoomLevel;
      newC.startTime = Math.min(0, c.startTime - extent / 2.0);
      return newC;
    });
  };

  // shift time line start right 1/2 of the extent of the current zoom level
  const handleShiftRight = (): void => {
    setTimeLine((c: TimeLine) => {
      const extent = TimeLineScales[c.currentZoomLevel].extent;
      const newC = new TimeLine(timeLine.width, timeLine.height);
      newC.currentZoomLevel = c.currentZoomLevel;
      newC.startTime = c.startTime + extent / 2.0;
      return newC;
    });
  };

  return (
    <>
      <div className="page-time-control">
        <fieldset disabled={playing.current?.on} style={{ width: "inherit" }}>
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
          <button
            style={{ fontSize: "15px" }}
            // disabled={timeLine.startTime + TimeLineScales[timeLine.currentZoomLevel].extent}
            onClick={handleShiftRight}
          >
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
            // onMouseUp={(e) => {
            //   handleMouseUp(e);
            // }}
          />
          <path
            stroke="black"
            d={`m 0 ${timeLine.height} H ${timeLine.width}`}
          />
          {getTickLines(
            ticks?.tickCount,
            ticks?.tickHeight,
            ticks?.tickSpacing
          )}
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

  // the timeline, interval body, and edges have mousedown handlers
  // this will either initiate the definition of a new interval
  // or allow an existing interval to be changed
  function handleMouseDown(e: any): void {
    if (!playing.current?.on) {
      e.preventDefault();
      e.stopPropagation();
      const type: string = e.target.id;

      // set the cursor in preparation of a mouse movement
      const page = document.getElementById("page");
      if (type == "intervalbox") {
        if (page) page.style.cursor = "grab";
      } else if (page) page.style.cursor = "ew-resize";

      // initialize the interval if in define interval switch mode set to move left
      if (type == "timeline") {
        setInterval(
          getTimes({
            startOffset: e.nativeEvent.offsetX,
            endOffset: e.nativeEvent.offsetX,
          })
        );
        setType("intervalleftedge");
      } else setType(type);

      // tell the page that the mouse is down so the cursor will change
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
          (TimeLineScales[timeLine.currentZoomLevel].extent *
            interval.startOffset) /
            timeLine.width,
        1
      );
      newInterval.endTime = precision(
        timeLine.startTime +
          (TimeLineScales[timeLine.currentZoomLevel].extent *
            interval.endOffset) /
            timeLine.width,
        1
      );
      return newInterval;
    } else {
      console.log(
        "getTimes: attempt to complete interval before definition is complete"
      );
      return interval;
    }
  }

  // handle mouse move for timeline, interval, or edges
  function handleMouseMove(e: any): void {
    if (mouseDown && !playing.current?.on) {
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
        // boundaries (0, timeline.width) or the move is rejected
        if (
          newStart > 0 &&
          newStart < timeLine.width &&
          newEnd > 0 &&
          newEnd < timeLine.width
        ) {
          newInterval.startOffset = newStart;
          newInterval.endOffset = newEnd;
          setInterval(getTimes(newInterval));
        }
      } else console.log("invalid movement type", type);
    }
  }

  // when the mouse is up change cursor to the appropriate type based on which component is entered
  function handleMouseEnter(e: any): void {
    if (mouseDown && !playing.current?.on) return;
    e.preventDefault();
    e.stopPropagation();
    const type: string = e.target.id;
    const page = document.getElementById("page");
    if (page) {
      switch (type) {
        case "timeline": {
          page.style.cursor = "crosshair";
          break;
        }
        case "intervalbox": {
          page.style.cursor = "grab";
          break;
        }
        case "intervalleftedge":
        case "intervalrightedge": {
          page.style.cursor = "ew-resize";
          break;
        }
        default: {
          console.log("handleMouseEnter mouse enter not handled");
          break;
        }
      }
    } else console.log("handleMouseEnter page element not found");
  }

  // when the mouse is up change cursor back to default
  function handleMouseLeave(e: any): void {
    if (mouseDown || playing.current?.on) return;
    e.preventDefault();
    e.stopPropagation();
    const page = document.getElementById("page");
    if (page) page.style.cursor = "default";
    else console.log("handleMouseLeave page element not found");
  }

  interface DisplayIntervalProps {
    timeLine: TimeLine;
    interval: TimelineInterval;
  }
  function DisplayInterval(props: DisplayIntervalProps) {
    const { interval, timeLine } = props;

    return (
      <>
        {interval.startOffset > 0 && interval.endOffset > 0 ? (
          <>
            {interval.startOffset != interval.endOffset ? (
              <rect
                className="intervalbox"
                id="intervalbox"
                x={Math.max(interval.startOffset, 1)}
                y={0}
                height={timeLine.height}
                width={interval.endOffset - interval.startOffset}
                onMouseDown={(e) => handleMouseDown(e)}
                onMouseMove={(e) => handleMouseMove(e)}
                onMouseEnter={(e) => handleMouseEnter(e)}
                onMouseLeave={(e) => handleMouseLeave(e)}
              />
            ) : null}
            {interval.startOffset != interval.endOffset ? (
              <>
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
            {interval.endOffset < timeLine.width &&
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
}
