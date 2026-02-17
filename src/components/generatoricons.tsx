// Display the generator icons for all generators on a track
// Handle icon positioning requests
// Handle timeline and timeinterval changes
// Menu functions are handled by the GeneratorMenu component
import Track from "classes/track";
import { useCMGContext } from "cmgcontext";
import GeneratorCopyMoveDialog from "dialogs/generator/generatorcopymovedialog";
import GeneratorDeleteDialog from "dialogs/generator/generatordeletedialog";
import { useAudioWorkerShared } from "hooks/useAudioWorkerShared";
import readyPlay from "playfunctions/readyplay";
import React, { MouseEvent, useEffect, useState } from "react";
import {
  GeneratorType,
  MouseLocation,
  SAMPLERATE,
  PlayData,
  TimeLineScales,
  TIMELINETYPE,
} from "types";
import {
  flipGeneratorMute,
  moveGeneratorBodyPosition,
  moveGeneratorTime,
} from "utils/cmfiletransactions";
import { debug } from "utils/debug";
import { linearInterpolate } from "utils/interpolation";
import { measureScaling } from "utils/measurescaling";

export interface GeneratorIconProps {
  track: Track;
  trackIndex: number;
}
type GeneratorBox = {
  generator: GeneratorType;
  generatorIndex: number;
  position: { x: number; y: number };
  width: number;
  height: number;
  selected: boolean;
  nameWidth: number;
  stackOrder: number;
};

export default function GeneratorIcons(props: GeneratorIconProps) {
  const { track, trackIndex } = props;
  const {
    cursor,
    setCursor,
    setFileContents,
    screenHeight,
    screenWidth,
    recordFormat,
    timeLine,
    setStatus,
    timeInterval,
    setTrackIndex,
    setEditGeneratorData,
    fileContents,
    setPlayData,
    setGeneratorDialogVisible,
  } = useCMGContext();
  const { startProcessing, sharedBuffers, audioBlob, image, voiceHues } =
    useAudioWorkerShared();
  const [boxIndex, setBoxIndex] = useState<number>(-1);
  const [generatorBoxes, setGeneratorBoxes] = useState<GeneratorBox[]>([]);
  const [editMode, setEditMode] = useState<string>("None");
  const [trackWidth, setTrackWidth] = useState<number>(100);
  const [trackHeight, setTrackHeight] = useState<number>(100);
  const [positionXTick, setPositionXTick] = useState<number>(0);
  const [startTickPosition, setStartTickPosition] = useState<number>(0);
  const [edgeSelected, setEdgeSelected] = useState<string>("");
  const [mouseLocation, setMouseLocation] = useState<MouseLocation | null>(
    null,
  );
  const [mouseDown, setMouseDown] = useState<boolean>(false);
  const [copyMoveMode, setCopyMoveMode] = useState<{
    mode: string;
    generator?: GeneratorType;
  }>({ mode: "" });
  const [copyMoveDialogVisible, setCopyMoveDialogVisible] =
    useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<{
    visible: boolean;
    generator?: GeneratorType;
  }>({ visible: false });

  // set the visible generator icon boxes based on the generator times and timeLine
  // handle highlighting from timeline interval selection and playing
  // determine the mouse movement tick size
  useEffect(() => {
    if (!timeLine) return;
    setTrackWidth(timeLine.width);
    setTrackHeight(100);
    // get all of the generator boxes by filtering the generators by the timeLine
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

      // only use the generators whose icons have a positive width on this timeline
      if (iWidth > 0 && iHeight > 0) {
        // build the name of the generator text so its size is known
        const text: HTMLSpanElement = document.createElement("span");
        document.body.appendChild(text);
        text.style.font = "Arial";
        text.style.fontSize = "10px";
        text.style.height = "auto";
        text.style.fontSize = "auto";
        text.style.position = "absolute";
        text.style.whiteSpace = "no-wrap";
        text.innerHTML = g.name + ":" + g.type;
        const nameWidth: number = Math.ceil(text.clientWidth);
        document.body.removeChild(text);
        const stackOrder: number = 1000 - trackIndex * 10 - i;
        boxes.push({
          generator: g,
          generatorIndex: i,
          position: { x: iLeft, y: iTop },
          width: iWidth,
          height: iHeight,
          selected: isSelected(g),
          nameWidth,
          stackOrder,
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
        debug.info(
          "generatoricons: Time snap mode. tick size is",
          positionTick,
        );
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
  }, [fileContents, timeLine, timeInterval]);

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
    debug.info(
      `generatoricons: move generator ${boxIndex} vertically`,
      moveTo,
      mouseLocation.dY,
    );
    if (moveTo < 0 || moveTo > (2 * trackHeight) / 3) return;
    moveGeneratorBodyPosition(
      track,
      generatorBoxes[boxIndex].generatorIndex,
      moveTo,
      setFileContents,
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
      newPosition,
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
      timeLine.startTime + TimeLineScales[timeLine.currentZoomLevel].extent,
    );
    debug.info(
      `generatoricons: generator move ${edgeSelected} time to ${newTime}`,
    );
    moveGeneratorTime(
      track,
      generatorBoxes[boxIndex].generatorIndex,
      newTime,
      edgeSelected,
      setFileContents,
    );
  }, [mouseLocation, mouseDown]);

  // Handle play when data is available
  useEffect(() => {
    if (audioBlob && image && voiceHues && sharedBuffers) {
      // The audio buffers are in shared memory - no copying needed!
      const playData: PlayData = {
        audioBuffer: sharedBuffers.audioChannels,
        audio: audioBlob,
        image,
        voiceHues,
      };
      setPlayData(playData);
      setCursor("default");
    }
  }, [audioBlob, image, voiceHues, sharedBuffers]);

  // when the mouse enters an icon body with the mouse up change the cursor to ns
  function onBodyEnter(e: MouseEvent<SVGRectElement>): void {
    if (mouseDown || cursor == "wait") return;
    e.preventDefault();
    e.stopPropagation();
    setCursor("ns-resize");
    // debug.info("generatoricons: mouse enter body");
  }

  // when mouse goes down in the icon body
  // initiate a vertical move
  function onMouseDownBody(
    e: MouseEvent<SVGRectElement>,
    boxIndex: number,
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
    // debug.info("generatoricons: mouse down on body");
  }

  // when mouse moves in the icon body
  // update the mouse location so the icon move can execute
  function onMouseMoveBody(e: MouseEvent<SVGRectElement>): void {
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
    if (mouseDown || cursor == "wait") return;
    e.preventDefault();
    e.stopPropagation();
    setCursor("default");
    setBoxIndex(-1);
    setEditMode("None");
    setMouseLocation(null);
    setMouseDown(false);
    // debug.info("generatoricons: mouse leave body");
  }

  function onMouseUpBody(e: MouseEvent<SVGRectElement>): void {
    if (cursor == "wait") return;
    e.preventDefault();
    e.stopPropagation();
    setCursor("default");
    setBoxIndex(-1);
    setEditMode("None");
    setMouseLocation(null);
    setMouseDown(false);
    // debug.info("generatoricons: mouse up body");
  }

  // when the mouse enters an icon edge with the mouse up,
  // set the move cursor
  function onEdgeEnter(e: MouseEvent<SVGLineElement>): void {
    if (mouseDown || cursor == "wait") return;
    e.preventDefault();
    e.stopPropagation();
    setCursor("ew-resize");
    // debug.info("generatoricons: mouse enter edge");
  }
  // when the mouse goes down on an icon edge, initiate the icon move
  function onMouseDownEdge(
    e: MouseEvent<SVGPathElement>,
    boxIndex: number,
    edge: string,
  ): void {
    if (cursor == "wait") return;
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
    // debug.info("generatoricons: mouse down on edge", edge);
  }

  function onMouseMoveEdge(
    e: MouseEvent<SVGPathElement | SVGSVGElement>,
  ): void {
    if (!mouseDown || cursor == "wait") return;
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
    e: MouseEvent<SVGRectElement | SVGPathElement>,
  ): void {
    if (mouseDown || cursor == "wait") return;
    e.preventDefault();
    e.stopPropagation();
    setCursor("default");
    setMouseDown(false);
    setEdgeSelected("None");
    setMouseLocation(null);
    // debug.info("generatoricons: mouse leave edge ");
  }

  function onMouseUpEdge(e: MouseEvent<SVGRectElement | SVGPathElement>): void {
    if (cursor == "wait") return;
    e.preventDefault();
    e.stopPropagation();
    setCursor("default");
    setMouseDown(false);
    setEdgeSelected("None");
    setMouseLocation(null);
    // debug.info("generatoricons: mouse up edge ");
  }

  function selectClass(selected: boolean): string {
    if (selected) return "generator-selected";
    return "generator-normal";
  }
  function onPlayClick(generator: GeneratorType) {
    const { generators, duration, error } = readyPlay({
      generator,
      fileContents,
      timeInterval,
    });
    // catch any errors while selecting generators
    setStatus(error);
    if (error != "") {
      setCursor("default");
      return;
    }
    setCursor("wait");
    // Start processing in the worker with shared buffers
    startProcessing({
      generators,
      duration,
      sampleRate: SAMPLERATE,
      recordFormat,
      timeInterval,
      windowWidth: screenWidth,
      windowHeight: screenHeight - 40,
    });
  }

  function onEditClick(generator: GeneratorType) {
    setTrackIndex(-1);
    setGeneratorDialogVisible(true);
    setEditGeneratorData({
      track: track,
      generator: generator,
      newGenerator: false,
      type: generator.type,
    });
  }
  function onCopyClick(generator: GeneratorType) {
    setCopyMoveMode({ mode: "copy", generator });
    setCopyMoveDialogVisible(true);
  }
  function onMoveClick(generator: GeneratorType) {
    setCopyMoveMode({ mode: "move", generator });
    setCopyMoveDialogVisible(true);
  }
  function onMuteClick(generator: GeneratorType) {
    const index: number = track.generators.findIndex(
      (g) => g.name == generator.name,
    );
    if (index < 0) return;
    flipGeneratorMute(track, index, setFileContents);
    setStatus(`Generator mute toggled`);
  }

  function onDeleteClick(generator: GeneratorType) {
    setDeleteModal({ visible: true, generator });
  }

  return (
    <>
      <div
        style={{ position: "relative", width: trackWidth, height: trackHeight }}
      >
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
        {/* create the dropdown buttons for the generator menus */}
        {cursor != "wait" && (
          <>
            {generatorBoxes.map((generatorBox: GeneratorBox, i) => (
              <div
                className="dropdown"
                key={`gmenu-${i}`}
                style={{
                  left:
                    generatorBox.position.x +
                    generatorBox.width / 2.0 -
                    generatorBox.nameWidth / 2 -
                    4,
                  top: generatorBox.position.y,
                  zIndex: generatorBox.stackOrder,
                }}
              >
                <button className="dropbtn">
                  {generatorBox.generator.name
                    .concat(":")
                    .concat(generatorBox.generator.type)}
                </button>
                <div
                  className="dropdown-content"
                  style={{ zIndex: generatorBox.stackOrder }}
                >
                  <a
                    href="#"
                    onClick={() =>
                      onPlayClick(track.generators[generatorBox.generatorIndex])
                    }
                  >
                    Play
                  </a>
                  <a
                    href="#"
                    onClick={() =>
                      onEditClick(track.generators[generatorBox.generatorIndex])
                    }
                  >
                    Edit
                  </a>
                  <a
                    href="#"
                    onClick={() =>
                      onCopyClick(track.generators[generatorBox.generatorIndex])
                    }
                  >
                    Copy
                  </a>
                  <a
                    href="#"
                    onClick={() =>
                      onMoveClick(track.generators[generatorBox.generatorIndex])
                    }
                  >
                    Move
                  </a>
                  <a
                    href="#"
                    onClick={() =>
                      onMuteClick(track.generators[generatorBox.generatorIndex])
                    }
                  >
                    {track.generators[generatorBox.generatorIndex] &&
                    track.generators[generatorBox.generatorIndex].mute
                      ? "Unmute"
                      : "Mute"}
                  </a>
                  <a
                    href="#"
                    onClick={() =>
                      onDeleteClick(
                        track.generators[generatorBox.generatorIndex],
                      )
                    }
                  >
                    Delete
                  </a>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      {copyMoveDialogVisible && copyMoveMode.generator && (
        <GeneratorCopyMoveDialog
          mode={copyMoveMode.mode}
          trackName={track.name}
          generator={copyMoveMode.generator}
          setDialogVisible={setCopyMoveDialogVisible}
        />
      )}
      {deleteModal.visible && deleteModal.generator && (
        <GeneratorDeleteDialog
          trackName={track.name}
          generator={deleteModal.generator}
          setDialogVisible={setDeleteModal}
        />
      )}
    </>
  );
}
