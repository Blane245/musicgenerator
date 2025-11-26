// Display the generator icons for all generators on a track
// Handle icon positioning requests
// Handle timeline and timeinterval changes
// Menu functions are handled by the GeneratorMenu component
import Track from "classes/track";
import { useCMGContext } from "cmgcontext";
import GeneratorMenuDialog from "dialogs/generator/generatormenudialog";
import React, { MouseEvent, useEffect, useState } from "react";
import { GeneratorType, TimeLineScales, TIMELINETYPE } from "types";
import {
  moveGeneratorBodyPosition,
  moveGeneratorTime,
} from "utils/cmfiletransactions";
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
  const {
    setFileContents,
    timeLine,
    setStatus,
    playing,
    timeInterval,
    mouseDown,
    mouseLocation,
    setMouseLocation,
  } = useCMGContext();
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
  const [accumXLocation, setAccumXLocation] = useState<number>(0);
  const [positionXTick, setPositionXTick] = useState<number>(0);
  const [startTickPosition, setStartTickPosition] = useState<number>(0);
  // const [endTickPosition, setEndTickPosition] = useState<number>(0);
  const [edgeSelected, setEdgeSelected] = useState<string>("");

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
        // console.log("new generator box", boxes[boxes.length - 1]);
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
        // console.log('Time snap mode. tick size is', positionTick);
      } else {
        // the number of displayed beats in the time line
        const { tickPositionSize, startTickPosition } =
          measureScaling({
            startTime: timeLine.startTime,
            timeExtent: TimeLineScales[timeLine.currentZoomLevel].extent,
            positionWidth: timeLine.width,
            measureTime: timeLine.measureSize,
            beatsPerMeasure: timeLine.beatsPerMeasure,
          });

        setPositionXTick(tickPositionSize);
        setStartTickPosition(startTickPosition);
        // setEndTickPosition(endTickPosition);
      }
    }
  }, [track.generators, timeLine, timeInterval]);

  // handle vertical movements
  useEffect(() => {
    if (!mouseLocation) return;
    if (editMode != "MoveVertical") return;
    if (!timeLine) return;
    if (mouseLocation.dY == 0) return;
    const moveTo: number =
      generatorBoxes[boxIndex].position.y + mouseLocation.dY;
    if (moveTo < 0 || moveTo > (2 * trackHeight) / 3) return;
    moveGeneratorBodyPosition(
      track,
      generatorBoxes[boxIndex].generatorIndex,
      moveTo,
      setFileContents
    );
    // console.log("generator moved to new position", moveTo);
    setStatus(``);
  }, [mouseLocation?.dY]);

  // accumulate the X mouse movements
  useEffect(() => {
    // console.log('mouselocation x fired. edit mode is ', editMode, 'snap mode is', timeLine?.snap);
    if (!mouseLocation) return;
    if (editMode != "MoveHorizontal") return;
    if (!timeLine) return;
    if (!timeLine.snap) {
      setAccumXLocation(mouseLocation.X);
      // console.log('not snap mode. x location is', mouseLocation.X);
    } else {
      // in snap mode we need to constrain the accumulated location to ticks
      // the mouse x location may be anywhere in the window so we round off
      // this location to the nearest tick position
      const newPosition: number =
        mouseLocation.X > 0
          ? Math.trunc(mouseLocation.X / positionXTick) * positionXTick +
            startTickPosition
          : Math.trunc(mouseLocation.X / positionXTick) * positionXTick -
            1 +
            startTickPosition;
      console.log(
        "snap mode mouse location is ",
        mouseLocation.X,
        "tick size is ",
        positionXTick,
        "new position is ",
        newPosition,
        "old position is ",
        accumXLocation
      );
      if (
        (newPosition < 0 && edgeSelected == "start") ||
        (newPosition < positionXTick && edgeSelected == "stop") ||
        newPosition > timeLine.width
      )
        return;
      if (newPosition != accumXLocation) setAccumXLocation(newPosition);
      // console.log('mouse moved in snap move, new accumulated position is', newPosition, 'old position is ', accumXLocation);
    }
  }, [mouseLocation?.X]);

  // handle horizontal movements when auumulated mouse movements are passed
  useEffect(() => {
    // console.log(`accumulated x location fired at ${accumXLocation}, edit mode is '${editMode}', timeline width is ${timeLine?.width}, edge selected is '${edgeSelected}'`);
    if (editMode != "MoveHorizontal") {
      return;
    }
    if (!timeLine) return;
    const newTime: number = linearInterpolate(
      accumXLocation,
      0,
      timeLine.width,
      timeLine.startTime,
      timeLine.startTime + TimeLineScales[timeLine.currentZoomLevel].extent
    );
    console.log(`generator move ${edgeSelected} time to ${newTime}`);
    // modify the moveto point based on the timeline mode
    // move to the closest time or measure tick if in snap mode
    moveGeneratorTime(
      track,
      generatorBoxes[boxIndex].generatorIndex,
      newTime,
      edgeSelected,
      setFileContents
    );
    setStatus("");
  }, [accumXLocation]);

  // enable the icon menu
  function handleTextMouseDown(
    event: MouseEvent<HTMLOrSVGElement>,
    boxIndex: number
  ) {
    if (playing.current) return;
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
    setStatus(``);
  }

  // handlers for mouse events on icon body and edges
  // useEffect captures mouse up and mouse movements
  function onBodyEnter(e: MouseEvent<SVGRectElement>): void {
    if (mouseDown.current) return;
    e.preventDefault();
    e.stopPropagation();
    setCursor("ns-resize");
    // console.log('mouse enter body');
  }
  function onEdgeEnter(e: MouseEvent<SVGLineElement>): void {
    if (mouseDown.current) return;
    e.preventDefault();
    e.stopPropagation();
    setCursor("grab");
    // console.log('mouse enter edge');
  }
  function onMouseDownStartEdge(
    e: MouseEvent<SVGPathElement>,
    boxIndex: number
  ): void {
    setBoxIndex(boxIndex);
    setEditMode("MoveHorizontal");
    setMouseLocation({
      X: e.nativeEvent.offsetX,
      Y: e.nativeEvent.offsetY,
      dX: 0,
      dY: 0,
    });
    setAccumXLocation(e.nativeEvent.offsetX);
    setEdgeSelected("start");
    mouseDown.current = true;
    // console.log('mouse down on start edge');
  }
  function onMouseDownStopEdge(
    e: MouseEvent<SVGPathElement>,
    boxIndex: number
  ): void {
    setBoxIndex(boxIndex);
    setEditMode("MoveHorizontal");
    setMouseLocation({
      X: e.nativeEvent.offsetX,
      Y: e.nativeEvent.offsetY,
      dX: 0,
      dY: 0,
    });
    setAccumXLocation(e.nativeEvent.offsetX);
    setEdgeSelected("stop");
    mouseDown.current = true;
    // console.log('mouse down on stop edge');
  }
  function onLeave(e: MouseEvent<SVGRectElement | SVGPathElement>): void {
    if (mouseDown.current) return;
    e.preventDefault();
    e.stopPropagation();
    setCursor("default");
    // console.log('mouse leave');
  }

  // let mousedown events propagate to the main page
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
    mouseDown.current = true;
    // console.log('mouse down on body');
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
      >
        {generatorBoxes.map((generatorBox, i) => (
          <React.Fragment key={"genbox-" + generatorBox.generator.name}>
            <rect
              className={selectClass(generatorBoxes[i].selected)}
              pointerEvents={playing.current ? "none" : "all"}
              x={generatorBox.position.x}
              y={generatorBox.position.y}
              width={generatorBox.width}
              height={generatorBox.height}
              fill="white"
              stroke="black"
              strokeWidth={1}
              onMouseDown={(event) => onMouseDownBody(event, i)}
              onMouseEnter={(event) => onBodyEnter(event)}
              onMouseLeave={(event) => onLeave(event)}
            />
            <text
              pointerEvents={playing.current ? "none" : "all"}
              x={generatorBox.position.x + generatorBox.width / 2.0}
              y={generatorBox.position.y + generatorBox.height / 3.0}
              fontSize={"10pt"}
              fontWeight={"200"}
              textAnchor="middle"
              dominantBaseline="hanging"
              onMouseDown={(event) => handleTextMouseDown(event, i)}
              stroke={generatorBox.generator.mute ? "red" : "black"}
            >
              {generatorBox.generator.name
                .concat(":")
                .concat(generatorBox.generator.type)}
            </text>
            <line
              pointerEvents={playing.current ? "none" : "all"}
              stroke="blue"
              strokeWidth={5}
              x1={generatorBox.position.x}
              y1={generatorBox.position.y}
              x2={generatorBox.position.x}
              y2={generatorBox.position.y + generatorBox.height}
              onMouseEnter={(e) => onEdgeEnter(e)}
              onMouseLeave={(e) => onLeave(e)}
              onMouseDown={(e) => onMouseDownStartEdge(e, i)}
            />
            <line
              pointerEvents={playing.current ? "none" : "all"}
              stroke="blue"
              strokeWidth={5}
              x1={generatorBox.position.x + generatorBox.width}
              y1={generatorBox.position.y}
              x2={generatorBox.position.x + generatorBox.width}
              y2={generatorBox.position.y + generatorBox.height}
              onMouseEnter={(e) => onEdgeEnter(e)}
              onMouseLeave={(e) => onLeave(e)}
              onMouseDown={(e) => onMouseDownStopEdge(e, i)}
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
