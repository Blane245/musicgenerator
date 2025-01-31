// Display the generator icons for all generators on a track
// Handle icon positioning and menu selection
import {
  ChangeEvent,
  FormEvent,
  MouseEvent,
  useEffect,
  useState,
} from "react";
import CMGenerator from "../classes/cmg";
import Track from "../classes/track";
import { useCMGContext } from "../cmgcontext";
import GeneratorDialog from "../dialogs/generatordialog";
import Generate from "../generation/generate";
import { CMGeneratorType, GENERATIONMODE } from "../types";
import {
  addGenerator,
  flipGeneratorMute,
  moveGeneratorBodyPosition,
} from "../utils/cmfiletransactions";
import { getGeneratorUID } from "../utils/getgeneratoruid";
import setCursor from "../utils/setcursor";

export interface GeneratorIconProps {
  track: Track;
}
type GeneratorBox = {
  generator: CMGenerator;
  generatorIndex: number;
  position: { x: number; y: number };
  width: number;
  height: number;
  selected: boolean;
  playing: boolean;
};

// const GeneratorIcons = forwardRef((props: GeneratorIconProps) => {
export default function GeneratorIcons (props: GeneratorIconProps) {
  const { track } = props;
  const {
    setFileContents,
    timeLine,
    setStatus,
    fileContents,
    playing,
    timeInterval,
    generatorsPlaying,
    mouseDown,
    setMouseDown,
  } = useCMGContext();
  const [boxIndex, setBoxIndex] = useState<number>(-1);
  const [generatorIndex, setGeneratorIndex] = useState<number>(-1);
  const [menuEnabled, setMenuEnabled] = useState<boolean>(false);
  const [menuX, setMenuX] = useState<number>(0);
  const [menuY, setMenuY] = useState<number>(0);
  const [generatorBoxes, setGeneratorBoxes] = useState<GeneratorBox[]>([]);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [copyDialog, setCopyDialog] = useState<boolean>(false);
  const [selectedTrackName, setSelectedTrackName] = useState<string>("");
  const [preview, setPreview] = useState<CMGenerator | null>(null);
  const [mode, setMode] = useState<GENERATIONMODE>(GENERATIONMODE.idle);
  const [trackWidth, setTrackWidth] = useState<number>(100);
  const [trackHeight, setTrackHeight] = useState<number>(100);

  // useEffect(() => {
  //   const resizeObserver: ResizeObserver = new ResizeObserver(
  //     (event: ResizeObserverEntry[]) => {
  //       setTrackWidth(event[0].contentBoxSize[0].inlineSize);
  //       setTrackHeight(event[0].contentBoxSize[0].blockSize);
  //     }
  //   );
  //   if (elementRef && elementRef.current) {
  //     resizeObserver.observe(elementRef.current[trackIndex]);
  //   }
  // }, [elementRef]);
  // set the visible generator icon boxes based on the generator times and timeLine
  // handle highlighting from timeline interval selection and preview playing
  useEffect(() => {
    setTrackWidth(timeLine.width);
    setTrackHeight(100);
    // get all of the generator boxes
    setSelectedTrackName(track.name);
    const boxes: GeneratorBox[] = [];
    track.generators.forEach((g: CMGeneratorType, i: number) => {
      // is the generator out of the currently displayed current time?
      const tStop =
        timeLine.startTime + timeLine.timeLineScale.extent;
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
          playing: isPlaying(g),
        });
      }
    });
    setGeneratorBoxes(boxes);
  }, [
    track.generators,
    timeLine,
    timeInterval,
    trackHeight,
    generatorsPlaying,
  ]);

  useEffect(() => {
    if (mode == GENERATIONMODE.idle) setPreview(null);
  }, [mode]);

  // prepare to move the body horizontally
  function handleBodyMouseDown(
    event: MouseEvent<HTMLOrSVGElement>,
    boxIndex: number
  ) {
    if (playing.current) return;
    event.preventDefault();
    event.stopPropagation();

    const button = event.button;
    if (button == 0) {
      setBoxIndex(boxIndex);
      setGeneratorIndex(generatorBoxes[boxIndex].generatorIndex);

      setMouseDown(true);
      setStatus(``);
    }
  }

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
    setMenuEnabled(true);
    setStatus(``);
  }

  // move the icon vertically
  // this is a bit sloppy, but so be it
  function handleMouseMove(
    event: MouseEvent<SVGRectElement>,
    boxIndex: number
  ) {
    if (!mouseDown) return;
    event.preventDefault();
    event.stopPropagation();

    // skip if no change or output is bounds
    const deltaY: number = event.nativeEvent.movementY;
    if (deltaY != 0) {
      const moveTo: number = generatorBoxes[boxIndex].position.y + deltaY;
      if (moveTo < 0 || moveTo > (2 * trackHeight) / 3) return;
      moveGeneratorBodyPosition(
        track,
        generatorBoxes[boxIndex].generatorIndex,
        moveTo,
        setFileContents
      );

      setStatus(``);
    }
  }

  function handleMouseEnter(e: MouseEvent<SVGRectElement>): void {
    if (mouseDown || playing.current) return;
    e.preventDefault();
    e.stopPropagation();
    setCursor("ns-resize");
  }
  // when the mouse is up change cursor back to default
  function handleMouseLeave(e: MouseEvent<SVGRectElement>): void {
    if (mouseDown || playing.current) return;
    e.preventDefault();
    e.stopPropagation();
    setCursor("default");
  }

  // toggle the mute condition of the selected generator
  function toggleGeneratorMute(boxIndex: number) {
    flipGeneratorMute(
      track,
      generatorBoxes[boxIndex].generatorIndex,
      setFileContents
    );
    setStatus(``);
  }

  function handlePreviewClick() {
    setMenuEnabled(false);
    setMode(GENERATIONMODE.solo);
    setPreview(generatorBoxes[boxIndex].generator);
    setStatus(``);
  }

  function handleEditClick() {
    setOpenDialog(true);
    setMenuEnabled(false);
    setCursor("default");
    setStatus(``);
  }

  function handleMuteClick() {
    toggleGeneratorMute(boxIndex);
    setMenuEnabled(false);
    setCursor("default");
    setStatus(``);
  }

  function handleCopyClick() {
    setSelectedTrackName(track.name);
    setCopyDialog(true);
    setMenuEnabled(false);
    setStatus(``);
  }

  function handleSelectedTrackChange(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedTrackName(event.target.value);
    setStatus(``);
  }
  function handleCopyOK(event: FormEvent<Element>): void {
    event.preventDefault();
    setCopyDialog(false);

    const targetTrack = fileContents.tracks.find(
      (t) => t.name == selectedTrackName
    );
    if (!targetTrack) return;

    // get a copy of the selected generator
    // and find a unique name for the generator
    const newG = generatorBoxes[generatorIndex].generator.copy();
    let next = getGeneratorUID(fileContents.tracks);
    newG.name = "G".concat(next.toString());

    //add the generator to the track
    addGenerator(targetTrack, newG, setFileContents);
    setStatus(
      `Generator '${generatorBoxes[generatorIndex].generator.name}' copied to track '${targetTrack.name}' with name '${newG.name}'`
    );
  }

  function handleCopyCancel() {
    setCopyDialog(false);
    setStatus(``);
  }

  function isSelected(g: CMGenerator): boolean {
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

  function isPlaying(gen: CMGenerator): boolean {
    return generatorsPlaying.findIndex((g) => g.name == gen.name) >= 0;
  }

  function selectClass(selected: boolean, playing: boolean): string {
    if (playing) return "generator-playing";
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
          <>
            <rect
              className={selectClass(
                generatorBoxes[i].selected,
                generatorBoxes[i].playing
              )}
              pointerEvents={playing.current ? "none" : "all"}
              x={generatorBox.position.x}
              y={generatorBox.position.y}
              width={generatorBox.width}
              height={generatorBox.height}
              fill="white"
              stroke="black"
              strokeWidth={1}
              key={"genrect-" + track.name + "-" + i}
              onMouseDown={(event) => handleBodyMouseDown(event, i)}
              onMouseMove={(event) => handleMouseMove(event, i)}
              onMouseEnter={(event) => handleMouseEnter(event)}
              onMouseLeave={(event) => handleMouseLeave(event)}
            />
            <text
              pointerEvents={playing.current ? "none" : "all"}
              x={generatorBox.position.x + generatorBox.width / 2.0}
              y={generatorBox.position.y + generatorBox.height / 3.0}
              fontSize={"10pt"}
              fontWeight={"200"}
              textAnchor="middle"
              dominantBaseline="hanging"
              key={"gentext-" + track.name + "-" + i}
              onMouseDown={(event) => handleTextMouseDown(event, i)}
              stroke={generatorBox.generator.mute ? "red" : "black"}
            >
              {generatorBox.generator.name
                .concat(":")
                .concat(generatorBox.generator.type)}
            </text>
            <line
              pointerEvents={playing.current ? "none" : "all"}
              key={"genstart-" + track.name + "-" + i}
              stroke="blue"
              strokeWidth={5}
              x1={generatorBox.position.x}
              y1={generatorBox.position.y}
              x2={generatorBox.position.x}
              y2={generatorBox.position.y + generatorBox.height}
            />
            <line
              pointerEvents={playing.current ? "none" : "all"}
              key={"genstop-" + track.name + "-" + i}
              stroke="blue"
              strokeWidth={5}
              x1={generatorBox.position.x + generatorBox.width}
              y1={generatorBox.position.y}
              x2={generatorBox.position.x + generatorBox.width}
              y2={generatorBox.position.y + generatorBox.height}
            />
          </>
        ))}
      </svg>

      <div
        className="modal-menu"
        id="gen-menu"
        style={{
          display: menuEnabled ? "block" : "none",
          position: "relative",
          top: menuY.toString() + "px",
          left: menuX.toString() + "px",
          width: "100px",
          zIndex: 99,
        }}
      >
        <p style={{ margin: "0" }} onClick={() => handleEditClick()}>
          Edit
        </p>
        <p style={{ margin: "0" }} onClick={() => handleCopyClick()}>
          Copy
        </p>
        <p style={{ margin: "0" }} onClick={() => handleMuteClick()}>
          {generatorIndex >= 0 && track.generators[generatorIndex].mute
            ? "Unmute"
            : "Mute"}
        </p>
        <p style={{ margin: "0" }} onClick={() => handlePreviewClick()}>
          Preview
        </p>
        <p style={{ margin: "0" }} onClick={() => setMenuEnabled(false)}>
          Exit
        </p>
      </div>
      <GeneratorDialog
        track={track}
        generatorIndex={generatorIndex}
        setGeneratorIndex={setGeneratorIndex}
        closeTrackGenerator={setOpenDialog}
        open={openDialog}
        setOpen={setOpenDialog}
      />
      <Generate mode={mode} setMode={setMode} generator={preview} />
      <div
        className="modal-content"
        style={{ display: copyDialog ? "block" : "none" }}
      >
        <div className="modal-header">
          <span className="close" onClick={handleCopyCancel}>
            &times;
          </span>
          <h2>
            Select track to receive a copy of '
            {generatorIndex >= 0 ? track.generators[generatorIndex].name : ""}'
          </h2>
        </div>

        <div className="modal-body">
          <label>
            {" "}
            Track Name:
            <select
              value={selectedTrackName}
              onChange={handleSelectedTrackChange}
            >
              {fileContents.tracks.map((t: Track) => {
                return (
                  <option key={`select-track ${t.name}`} value={t.name}>
                    {t.name}
                  </option>
                );
              })}
            </select>
          </label>
          <br />
        </div>
        <div className="modal-footer">
          <button onClick={handleCopyOK}>Copy</button>
          <button onClick={handleCopyCancel}>Cancel</button>
        </div>
      </div>
    </>
  );
}
// );
// export default GeneratorIcons;
