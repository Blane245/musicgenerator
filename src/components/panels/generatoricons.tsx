import {
  ChangeEvent,
  FormEvent,
  forwardRef,
  MouseEvent,
  MutableRefObject,
  useEffect,
  useState,
} from "react";
import CMGenerator from "../../classes/cmg";
import Track from "../../classes/track";
import Generate from "../../components/generation/generate";
import { useCMGContext } from "../../contexts/cmgcontext";
import { GENERATIONMODE, TimeLineScales } from "../../types/types";
import {
  addGenerator,
  flipGeneratorMute,
  moveGeneratorBodyPosition,
} from "../../utils/cmfiletransactions";
import { getGeneratorUID } from "../../utils/util";
import GeneratorDialog from "../dialogs/generatordialog";

export interface GeneratorIconProps {
  track: Track;
  trackIndex: number;
  elementRef: MutableRefObject<Element[]>;
}
type GeneratorBox = {
  generator: CMGenerator;
  position: { x: number; y: number };
  width: number;
  height: number;
  selected: boolean;
  playing: boolean;
};
//TODO high the generators as they are previewing
// thanx for AWolf's option 2 answer to https://stackoverflow.com/questions/58222004/how-to-get-parent-width-height-in-react-using-hooks
const GeneratorIcons = forwardRef((props: GeneratorIconProps) => {
  const { track, trackIndex, elementRef } = props;
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
  const [generatorIndex, setGeneratorIndex] = useState<number>(-1);
  const [cursorStyle, setCursorStyle] = useState<string>("cursor-default");
  const [menuEnabled, setMenuEnabled] = useState<boolean>(false);
  const [menuX, setMenuX] = useState<number>(0);
  const [menuY, setMenuY] = useState<number>(0);
  const [generatorBoxes, setGeneratorBoxes] = useState<GeneratorBox[]>([]);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [copyDialog, setCopyDialog] = useState<boolean>(false);
  const [selectedTrackName, setSelectedTrackName] = useState<string>("");
  const [preview, setPreview] = useState<CMGenerator | null>(null);
  // const preview = useRef<CMGenerator | null>();
  const [mode, setMode] = useState<GENERATIONMODE>(GENERATIONMODE.idle);

  const [trackWidth, setTrackWidth] = useState(100);
  const [trackHeight, setTrackHeight] = useState(100);

  useEffect(() => {
    const resizeObserver: ResizeObserver = new ResizeObserver(
      (event: ResizeObserverEntry[]) => {
        setTrackWidth(event[0].contentBoxSize[0].inlineSize);
        setTrackHeight(event[0].contentBoxSize[0].blockSize);
      }
    );
    if (elementRef && elementRef.current) {
      resizeObserver.observe(elementRef.current[trackIndex]);
    }
  }, [elementRef]);

  // set the generator icon boxes based on the generator times and timeLine
  useEffect(() => {
    // get all of the generator boxes
    setSelectedTrackName(track.name);
    const boxes: GeneratorBox[] = [];
    track.generators.forEach((generator) => {
      // is the generator out of the currently displayed current time?
      const timeLineStop =
        timeLine.startTime + TimeLineScales[timeLine.currentZoomLevel].extent;
      const timeLineStart = timeLine.startTime;
      const generatorStart = generator.startTime;
      const generatorStop = generator.stopTime;

      // if either the generators start or stop time is within the timeline, display it
      // bound the icon's start and stop time to the timeline
      const iconStartTime: number = Math.max(generatorStart, timeLineStart);
      const iconStopTime: number = Math.min(generatorStop, timeLineStop);

      // the track timeline box
      const height = trackHeight;
      const width = trackWidth;
      const iconTop = generator.position;
      const iconLeft =
        (width * (iconStartTime - timeLineStart)) /
        (timeLineStop - timeLineStart);
      const iconWidth: number =
        (width * (iconStopTime - iconStartTime)) /
        (timeLineStop - timeLineStart);
      const iconHeight: number = height / 3.0;
      if (iconWidth > 0 && iconHeight > 0) {
        boxes.push({
          generator: generator,
          position: { x: iconLeft, y: iconTop },
          width: iconWidth,
          height: iconHeight,
          selected: isSelected(generator),
          playing: isPlaying(generator),
        });
      }
    });
    setGeneratorBoxes(boxes);
  }, [
    track.generators,
    timeLine,
    trackWidth,
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
    index: number
  ) {
    if (playing.current?.on) return;
    event.preventDefault();
    event.stopPropagation();

    const button = event.button;
    if (button == 0) {
      setGeneratorIndex(index);

      //enable cursor movement
      setCursorStyle("cursor-all-scroll");
      setMouseDown(true);
      setStatus(``);
    }
  }

  // enable the icon menu
  function handleTextMouseDown(
    event: MouseEvent<HTMLOrSVGElement>,
    index: number
  ) {
    if (playing.current?.on) return;
    event.preventDefault();
    event.stopPropagation();
    setGeneratorIndex(index);

    // enable generator menu
    setCursorStyle("cursor-context-menu");
    setMenuX(event.clientX);
    setMenuY(event.clientY);
    setMenuEnabled(true);
    setStatus(``);
  }

  function handleMouseMove(event: any, index: number) {
    if (!mouseDown) return;
    event.preventDefault();
    event.stopPropagation();

    const y: number = event.nativeEvent.offsetY;
    const deltaY: number = event.nativeEvent.movementY;

    // skip if no change or output of bounds
    if (deltaY == 0 || y < 0 || y > (2.0 * trackHeight) / 3.0) return;
    moveGeneratorBodyPosition(track, index, y, setFileContents);

    setStatus(``);
  }

  function handleMouseEnter(e: any): void {
    if (mouseDown || playing.current?.on) return;
    e.preventDefault();
    e.stopPropagation();
    const page = document.getElementById("page");
    if (page) page.style.cursor = "ew-resize";
    else console.log("handleMouseEnter page element not found");
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

  // toggle the mute condition of the selected generator
  function toggleGeneratorMute(index: number) {
    flipGeneratorMute(track, index, setFileContents);
    setStatus(``);
  }

  function handlePreviewClick() {
    setMenuEnabled(false);
    setCursorStyle("cursor-default");
    setMode(GENERATIONMODE.solo);
    setPreview(generatorBoxes[generatorIndex].generator);
    setStatus(``);
  }

  function handleEditClick() {
    setOpenDialog(true);
    setMenuEnabled(false);
    setCursorStyle("cursor-default");
    setStatus(``);
  }

  function handleMuteClick() {
    toggleGeneratorMute(generatorIndex);
    setMenuEnabled(false);
    setCursorStyle("cursor-default");
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

  function isSelected(generator: CMGenerator): boolean {
    if (
      timeInterval.startTime != undefined &&
      timeInterval.endTime != undefined
    ) {
      if (
        generator.startTime >= timeInterval.startTime &&
        generator.stopTime <= timeInterval.endTime
      )
        return true;
      else return false;
    }
    return false;
  }

  function isPlaying(generator: CMGenerator): boolean {
    for (let i = 0; i < generatorsPlaying.length; i++) {
      if (generatorsPlaying[i].name == generator.name) return true;
    }
    return false;
  }

  function selectClass(selected: boolean, playing: boolean): string {
    if (playing) return "generator-playing";
    if (selected) return "generator-selected";
    return "generator-normal";
  }

  return (
    <>
      <svg
        className={cursorStyle}
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
              pointerEvents={playing.current?.on ? "none" : "all"}
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
              pointerEvents={playing.current?.on ? "none" : "all"}
              x={generatorBox.position.x + generatorBox.width / 2.0}
              y={generatorBox.position.y + generatorBox.height / 3.0}
              fontSize={"10pt"}
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
              pointerEvents={playing.current?.on ? "none" : "all"}
              key={"genstart-" + track.name + "-" + i}
              stroke="blue"
              strokeWidth={5}
              x1={generatorBox.position.x}
              y1={generatorBox.position.y}
              x2={generatorBox.position.x}
              y2={generatorBox.position.y + generatorBox.height}
            />
            <line
              pointerEvents={playing.current?.on ? "none" : "all"}
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
          position: "absolute",
          top: menuY.toString() + "px",
          left: menuX.toString() + "px",
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
});
export default GeneratorIcons;
