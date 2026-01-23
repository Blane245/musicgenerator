// Display the generator icons for all generators on a track
// Handle icon positioning requests
// Handle timeline and timeinterval changes
// Menu functions are handled by the GeneratorMenu component
import Track from "classes/track";
import { useCMGContext } from "cmgcontext";
import GeneratorMenuDialog from "dialogs/generator/generatormenudialog";
import React, { MouseEvent, useEffect, useState } from "react";
import {
  GeneratorType,
  MouseLocation,
  TimeLineScales,
  TIMELINETYPE,
} from "types";
import {
  moveGeneratorBodyPosition,
  moveGeneratorTime,
} from "utils/cmfiletransactions";
import { debug } from "utils/debug";
import { linearInterpolate } from "utils/interpolation";
import { measureScaling } from "utils/measurescaling";
import setCursor from "utils/setcursor";

export interface GeneratorIconProps {
  track: Track;
}
type GeneratorBox = {
  generator: GeneratorType;
  generatorIndex: number;
  position: { x: number; y: number };
  width: number;
  height: number;
  selected: boolean;
};

export default function GeneratorIcons(props: GeneratorIconProps) {
  const { track } = props;
  const { setFileContents, timeLine, setStatus, timeInterval } =
    useCMGContext();
  const [boxIndex, setBoxIndex] = useState<number>(-1);
  const [generatorIndex, setGeneratorIndex] = useState<number>(-1);
  const [editGeneratorMenuVisible, setEditGeneratorMenuVisible] =
    useState<Track | null>(null);
  const [menuX, setMenuX] = useState<number>(0);
  const [menuY, setMenuY] = useState<number>(0);
  const [generatorBoxes, setGeneratorBoxes] = useState<GeneratorBox[]>([]);
  const [editMode, setEditMode] = useState<string>("None");
  const [trackWidth, setTrackWidth] = useState<number>(100);
  const [trackHeight, setTrackHeight] = useState<number>(100);
  const [positionXTick, setPositionXTick] = useState<number>(0);
  const [startTickPosition, setStartTickPosition] = useState<number>(0);
  const [edgeSelected, setEdgeSelected] = useState<string>("");
  const [mouseLocation, setMouseLocation] = useState<MouseLocation | null>(
    null
  );
  const [mouseDown, setMouseDown] = useState<boolean>(false);

  // set the visible generator icon boxes based on the generator times and timeLine
  // handle highlighting from timeline interval selection and preview playing
  // determine the mouse movement tick size
  useEffect(() => {
    if (!timeLine) return;
    setTrackWidth(timeLine.width);
    setTrackHeight(100);
    // get all of the generator boxes
    const boxes: GeneratorBox[] = [];
    track.generators.forEach((g: GeneratorType, i: number) => {
      // is the generator out of the currently displayed current time?
      const tStop =
        timeLine.startTime + TimeLineScales[timeLine.currentZoomLevel].extent;
      const tStart = timeLine.startTime;
      const gStart = g.startTime;
      const gStop = g.stopTime;

      // if either the generators start or stop time is within the timeline, display it
      // bound the icon's start and stop time to the timeline
      const iStart: number = Math.max(gStart, tStart);
      const iStop: number = Math.min(gStop, tStop);

      // the track timeline box
      const height = 100;
      const width = timeLine.width;
      const iTop = g.position;
      const iLeft = (width * (iStart - tStart)) / (tStop - tStart);
      const iWidth: number = (width * (iStop - iStart)) / (tStop - tStart);
      const iHeight: number = height / 3.0;
      if (iWidth > 0 && iHeight > 0) {
        boxes.push({
          generator: g,
          generatorIndex: i,
          position: { x: iLeft, y: iTop },
          width: iWidth,
          height: iHeight,
          selected: isSelected(g),
        });
        debug.info("generatoricons new generator box", boxes[boxes.length - 1]);
      }
    });
    setGeneratorBoxes(boxes);

    // determine the time tick size and startMeasure offset in position coordinates
    if (!timeLine.snap) setPositionXTick(1);
    else {
      if (timeLine.mode == TIMELINETYPE.Time) {
        const positionTick =
          timeLine.width /
          (TimeLineScales[timeLine.currentZoomLevel].majorDivisions *
            TimeLineScales[timeLine.currentZoomLevel].minorDivisions);
        setPositionXTick(positionTick);
        setStartTickPosition(0);
        debug.info('generatoricons: Time snap mode. tick size is', positionTick);
      } else {
        // the number of displayed beats in the time line
        const { tickPositionSize, startTickPosition } = measureScaling({
          startTime: timeLine.startTime,
          timeExtent: TimeLineScales[timeLine.currentZoomLevel].extent,
          positionWidth: timeLine.width,
          measureTime: timeLine.measureSize,
          beatsPerMeasure: timeLine.beatsPerMeasure,
        });

        setPositionXTick(tickPositionSize);
        setStartTickPosition(startTickPosition);
      }
    }
    function isSelected(g: GeneratorType): boolean {
      if (
        timeInterval.startTime != undefined &&
        timeInterval.endTime != undefined
      ) {
        if (
          g.startTime >= timeInterval.startTime &&
          g.stopTime <= timeInterval.endTime
        )
          return true;
        else return false;
      }
      return false;
    }
  }, [track.generators, timeLine, timeInterval]);

  // handle vertical movements
  useEffect(() => {
    if (
      !timeLine ||
      boxIndex < 0 ||
      !mouseDown ||
      !mouseLocation ||
      editMode != "MoveVertical"
    )
      return;
    const moveTo: number =
      generatorBoxes[boxIndex].position.y + mouseLocation.dY;
    debug.info(`generatoricons: move generator ${boxIndex} vertically`, moveTo, mouseLocation.dY);
    if (moveTo < 0 || moveTo > (2 * trackHeight) / 3) return;
    moveGeneratorBodyPosition(
      track,
      generatorBoxes[boxIndex].generatorIndex,
      moveTo,
      setFileContents
    );
    debug.info("generatoricons: generator moved to new position", moveTo);
    setStatus(``);
  }, [mouseLocation, mouseDown]);

  // handle horiztonal movements
  useEffect(() => {
    if (
      !mouseLocation ||
      !mouseDown ||
      editMode != "MoveHorizontal" ||
      !timeLine ||
      positionXTick <= 0
    )
      return;

    // handle snap mode
    let newPosition: number = mouseLocation.X;
    if (timeLine.snap) {
      newPosition =
        mouseLocation.X > 0
          ? Math.round(mouseLocation.X / positionXTick) * positionXTick +
            startTickPosition
          : Math.round(mouseLocation.X / positionXTick) * positionXTick -
            1 +
            startTickPosition;
    }

    debug.info(
      "generatoricons:  snap mode is",
      timeLine.snap,
      "mouse location is ",
      mouseLocation.X,
      "tick size is ",
      positionXTick,
      "new position is ",
      newPosition
    );
    // constrain the new position to be between the start and end of the
    // displayed timeline
    if (
      (newPosition < 0 && edgeSelected == "start") ||
      (newPosition > timeLine.width && edgeSelected == "stop")
    )
      return;

    // modify the moveto point based on the timeline mode
    // move to the closest time or measure tick if in snap mode
    const newTime: number = linearInterpolate(
      newPosition,
      0,
      timeLine.width,
      timeLine.startTime,
      timeLine.startTime + TimeLineScales[timeLine.currentZoomLevel].extent
    );
    debug.info(`generatoricons: generator move ${edgeSelected} time to ${newTime}`);
    moveGeneratorTime(
      track,
      generatorBoxes[boxIndex].generatorIndex,
      newTime,
      edgeSelected,
      setFileContents
    );
  }, [mouseLocation, mouseDown]);

  // when the mouse enters an icon body with the mouse up change the cursor to ns
  function onBodyEnter(e: MouseEvent<SVGRectElement>): void {
    if (mouseDown) return;
    e.preventDefault();
    e.stopPropagation();
    setCursor("ns-resize");
    debug.info("generatoricons: mouse enter body");
  }

  // when mouse goes down in the icon body
  // initiate a vertical move
  function onMouseDownBody(
    e: MouseEvent<SVGRectElement>,
    boxIndex: number
  ): void {
    setBoxIndex(boxIndex);
    setEditMode("MoveVertical");
    setMouseLocation({
      X: e.nativeEvent.offsetX,
      Y: e.nativeEvent.offsetY,
      dX: 0,
      dY: 0,
    });
    setMouseDown(true);
    debug.info("generatoricons: mouse down on body");
  }

  // when mouse moves in the icon body
  // update the mouse location so the icon move can execute
  function onMouseMoveBody(
    e: MouseEvent<SVGRectElement>): void {
    if (!mouseDown) return;
    setMouseLocation({
      X: e.nativeEvent.offsetX,
      Y: e.nativeEvent.offsetY,
      dX: e.nativeEvent.movementX,
      dY: e.nativeEvent.movementY,
    });
    debug.info("generatoricons: mouse move on body");
  }

  // when the mouse leaves the icon body or goes up, terminate
  // vertical movement
  function onMouseLeaveBody(e: MouseEvent<SVGRectElement>): void {
    if (mouseDown)  return;
    e.preventDefault();
    e.stopPropagation();
    setCursor("default");
    setBoxIndex(-1);
    setEditMode("None");
    setMouseLocation(null);
    setMouseDown(false);
    debug.info("generatoricons: mouse leave body");
  }

  function onMouseUpBody(e: MouseEvent<SVGRectElement>): void {
    e.preventDefault();
    e.stopPropagation();
    setCursor("default");
    setBoxIndex(-1);
    setEditMode("None");
    setMouseLocation(null);
    setMouseDown(false);
    debug.info("generatoricons: mouse up body");
  }

  // when the mouse enters the icon text with the mouse up,
  // change it to a plus
  function onTextMouseEnter(e: MouseEvent<SVGTextElement>): void {
    if (mouseDown) return;
    e.preventDefault();
    e.stopPropagation();
    setCursor("cell");
    debug.info("generatoricons: mouse enter body");
  }
  // when the mouse goes down on the icon text, display the menu
  function onTextMouseDown(
    event: MouseEvent<HTMLOrSVGElement>,
    boxIndex: number
  ) {
    event.preventDefault();
    event.stopPropagation();
    const box = generatorBoxes[boxIndex];
    setGeneratorIndex(box.generatorIndex);
    setBoxIndex(boxIndex);

    // enable generator menu at the text element location
    // the relative position normal location of the
    // generator's menu is the lower left corner of the
    // trackdisplay. this move it to the right and up
    // where the generator's text is located.
    setMenuX(box.position.x + box.width / 2.0);
    setMenuY(box.position.y + box.height / 3.0 - 100);
    setEditGeneratorMenuVisible(track);
    setMouseDown(true);
  }

  // when the mouse goes up or leaves the icon text with the mouse up
  // terminate the icon menu
  function onTextMouseLeave(event: MouseEvent<SVGTextElement>): void {
    if (mouseDown) return;
    event.preventDefault();
    event.stopPropagation();
    setBoxIndex(-1);
    setEditGeneratorMenuVisible(null);
    setMouseDown(false);
  }

  function onTextMouseUp(event: MouseEvent<SVGTextElement>): void {
    event.preventDefault();
    event.stopPropagation();
    setBoxIndex(-1);
    setEditGeneratorMenuVisible(null);
    setMouseDown(false);
  }

  // when the mouse enters an icon edge with the mouse up,
  // set the move cursor
  function onEdgeEnter(e: MouseEvent<SVGLineElement>): void {
    if (mouseDown) return;
    e.preventDefault();
    e.stopPropagation();
    setCursor("ew-resize");
    debug.info('generatoricons: mouse enter edge');
  }
  // when the mouse goes down on an icon edge, initiate the icon move
  function onMouseDownEdge(
    e: MouseEvent<SVGPathElement>,
    boxIndex: number,
    edge: string
  ): void {
    setBoxIndex(boxIndex);
    setEditMode("MoveHorizontal");
    setMouseLocation({
      X: e.nativeEvent.offsetX,
      Y: e.nativeEvent.offsetY,
      dX: 0,
      dY: 0,
    });
    setEdgeSelected(edge);
    setMouseDown(true);
    debug.info("generatoricons: mouse down on edge", edge);
  }


  function onMouseMoveEdge (e: MouseEvent<SVGPathElement | SVGSVGElement>):void {
    if (!mouseDown) return;
    setMouseLocation({
      X: e.nativeEvent.offsetX,
      Y: e.nativeEvent.offsetY,
      dX: e.nativeEvent.movementX,
      dY: e.nativeEvent.movementY,
    });
  }

  // when the mouse goes up or leaves an icon edge, terminate all
  // movement
  function onMouseLeaveEdge(
    e: MouseEvent<SVGRectElement | SVGPathElement>
  ): void {
    if (mouseDown) return;
    e.preventDefault();
    e.stopPropagation();
    setCursor("default");
    setMouseDown(false);
    setEdgeSelected("None");
    setMouseLocation(null);
    debug.info("generatoricons: mouse leave edge ");
  }

  function onMouseUpEdge(
    e: MouseEvent<SVGRectElement | SVGPathElement>
  ): void {
    e.preventDefault();
    e.stopPropagation();
    setCursor("default");
    setMouseDown(false);
    setEdgeSelected("None");
    setMouseLocation(null);
    debug.info("generatoricons: mouse up edge ");
  }

  function selectClass(selected: boolean): string {
    if (selected) return "generator-selected";
    return "generator-normal";
  }

  return (
    <>
      <svg
        id={track.name.concat(": Generators")}
        key={track.name.concat(": Generators")}
        xmlns="http://www.w3.org/2000/svg"
        width={trackWidth}
        height={trackHeight}
        viewBox={`0 0 ${trackWidth} ${trackHeight}`}
        onMouseMove={onMouseMoveEdge}
      >
        {generatorBoxes.map((generatorBox, i) => (
          <React.Fragment key={"genbox-" + generatorBox.generator.name}>
            <rect
              className={selectClass(generatorBoxes[i].selected)}
              pointerEvents={"all"}
              x={generatorBox.position.x}
              y={generatorBox.position.y}
              width={generatorBox.width}
              height={generatorBox.height}
              fill="white"
              stroke="black"
              strokeWidth={1}
              onMouseEnter={(event) => onBodyEnter(event)}
              onMouseDown={(event) => onMouseDownBody(event, i)}
              onMouseMove={(event) => onMouseMoveBody(event)}
              onMouseLeave={(event) => onMouseLeaveBody(event)}
              onMouseUp={(event) => onMouseUpBody(event)}
            />
            <text
              pointerEvents={"all"}
              x={generatorBox.position.x + generatorBox.width / 2.0}
              y={generatorBox.position.y + generatorBox.height / 3.0}
              fontSize={"10pt"}
              fontWeight={"200"}
              textAnchor="middle"
              dominantBaseline="hanging"
              onMouseEnter={(event) => onTextMouseEnter(event)}
              onMouseDown={(event) => onTextMouseDown(event, i)}
              onMouseLeave={(event) => onTextMouseLeave(event)}
              onMouseUp={(event) => onTextMouseUp(event)}
              stroke={generatorBox.generator.mute ? "red" : "black"}
            >
              {generatorBox.generator.name
                .concat(":")
                .concat(generatorBox.generator.type)}
            </text>
            <line
              pointerEvents={"all"}
              stroke="blue"
              strokeWidth={5}
              x1={generatorBox.position.x}
              y1={generatorBox.position.y}
              x2={generatorBox.position.x}
              y2={generatorBox.position.y + generatorBox.height}
              onMouseEnter={(e) => onEdgeEnter(e)}
              onMouseDown={(e) => onMouseDownEdge(e, i, "start")}
              onMouseMove={(e) => onMouseMoveEdge(e)}
              onMouseLeave={(e) => onMouseLeaveEdge(e)}
              onMouseUp={(e) => onMouseUpEdge(e)}
            />
            <line
              pointerEvents={"all"}
              stroke="blue"
              strokeWidth={5}
              x1={generatorBox.position.x + generatorBox.width}
              y1={generatorBox.position.y}
              x2={generatorBox.position.x + generatorBox.width}
              y2={generatorBox.position.y + generatorBox.height}
              onMouseEnter={(e) => onEdgeEnter(e)}
              onMouseDown={(e) => onMouseDownEdge(e, i, "stop")}
              onMouseMove={(e) => onMouseMoveEdge(e)}
              onMouseLeave={(e) => onMouseLeaveEdge(e)}
              onMouseUp={(e) => onMouseUpEdge(e)}
            />
          </React.Fragment>
        ))}
      </svg>
      {editGeneratorMenuVisible &&
      editGeneratorMenuVisible == track &&
      generatorIndex >= 0 ? (
        <GeneratorMenuDialog
          track={track}
          generator={track.generators[generatorIndex]}
          setMenuVisible={setEditGeneratorMenuVisible}
          menuX={menuX}
          menuY={menuY}
        />
      ) : null}
    </>
  );
}
