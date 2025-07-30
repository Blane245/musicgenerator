// preview the source nodes
// this component extends the entire display area, overlapping the composition editing area
// the timeline uses the zoom level from the composition but is otherwise independent
// It contains the scale and a time progress tick
// it advances by 1/2 of the timeline extent as the preview time progresses.
// it starts based on the offsettime such that the offset time is visible between
// the start time and the extent.
// the drawing has one or more sections. Each section has a height characteristic of
// its type. A section only exists if there are generators in the sectio
// The instrument section contains algorithmic sources whose perset bank is not 128
// The percussion section contains algorithmic sources whose preset bank is 128
// Each audiofile is allocated a section. Each raw signal is displayed in a different section.
// Algorithmic sources have HSL values set based on the following
// Hue - the pan value [-1,1]
// Saturation - the volume value [-10,10]
// Lightness - if the source is playing
// algorithmic sources are drawn as lines from their start to their stop time at their midi values
// Their are user controls:
// Exit - quit the preview. This disappears when Start is pressed
// Start/Stop - start the preview from the beginning. Stop is the same as exit
// Pause/Resume - Pause the preview and resume it.
// The display is divided into 4 sections:
// Header which includes the control buttons and the left and right signal levels
// Timeline which displays the timeline
// Drawing which includes the source graphics
// Footer which includes status on genrators and sources playing and the room effect controls
import CMG2 from "assets/CGM2.svg";
import { Algorithmic } from "classes/generators";
import SignalLevel from "classes/signallevel";
import TimeLine from "classes/timeline";
import { useCMGContext } from "cmgcontext";
import RoomCompressorDialog from "dialogs/roomcompressordialog";
import RoomEqualizerDialog from "dialogs/roomequalizerdialog";
import RoomReverbDialog from "dialogs/roomreverbdialog";
import RoomVolumeDialog from "dialogs/roomvolumedialog";
import { buildRoomNodes } from "generation/buildroomnodes";
import { realizeSource } from "generation/realizesource";
import { useEffect, useRef, useState } from "react";
import {
  ActiveSource,
  GENERATIONMODE,
  GeneratorType,
  GENERATORTYPE,
  RawSourceData,
  TimeLineScales,
  TimeTicks,
} from "types";
import getTickLinesandLabels from "utils/getticklinesandlabels";
import updateTimeTicks from "utils/updatetimeticks";

// as this function is non-reactive except for exit, stop, pause, resume, many of its props
// are CMG context variables
export interface Preview2Props {
  playbackLength: number;
  offsetTime: number;
  sourceData: RawSourceData[];
  setMode: Function;
  appName: string;
  appVersion: string;
}
enum SectionType {
  "Instrument" = "Instrument",
  "Percussion" = "Percussion",
  "AudioFile" = "AudioFile",
  "None" = "None",
}
type DrawingSection = {
  type: SectionType;
  verticalOffset: number;
  height: number;
  loValue: number;
  hiValue: number;
};
type SourceToDrawingSectionEntry = {
  sourceIndex: number;
  sectionIndex: number;
};
type SignalLevels = {
  left: number;
  right: number;
};

// this component uses very few state variables as all subcomponents are
// highly integrated
export default function Preview2(params: Preview2Props): JSX.Element {
  const {
    sourceData,
    offsetTime,
    playbackLength,
    setMode,
    appName,
    appVersion,
  } = params;
  const {
    fileContents,
    fileName,
    playing,
    displayHeight,
    displayWidth,
    headerHeight,
    previewHeight,
    timelineHeight,
    footerHeight,
    timeLine,
  } = useCMGContext();
  const [pendingSourceData, setPendingSourceData] = useState<RawSourceData[]>(
    []
  );
  const [drawingSections, setDrawingSections] = useState<DrawingSection[]>([]);
  const [sourceToDrawingSectionMap, setSourceToDrawingSectionMap] = useState<
    SourceToDrawingSectionEntry[]
  >([]);
  let nAudioFiles: number = 0;
  let nPercussion: number = -1;
  let nInstrument: number = -1;
  const previewTimeline = useRef<TimeLine | null>(null);
  const activeGenerators = useRef<string[]>([]);
  const [activeGeneratorsCount, setActiveGeneratorsCount] = useState<number>(0);
  const [selectedGenerators, setSelectedGenerators] = useState<GeneratorType[]>(
    []
  );
  const activeSources = useRef<ActiveSource[]>([]);
  const [activeSourcesCount, setActiveSourcesCount] = useState<number>(0);
  const [signalLevels, setSignalLevels] = useState<SignalLevels>({
    left: -90,
    right: -90,
  });

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  let concentrator: GainNode | null = null;

  const [drawing, setDrawing] = useState<HTMLElement | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const paused = useRef<Boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [timeProgress, setTimeProgress] = useState<number>(-1);
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
  let reflectionDelay: number = 0;
  let analyzer: SignalLevel | null = null;

  const HUELEFT: number = 0;
  const HUERIGHT: number = 270;
  const SATURATIONLO: number = 50;
  const SATURATIONHI: number = 100;
  const LIGHTNESSLO: number = 40;
  const LIGHTNESSHI: number = 60;
  let tickId: number = 0;
  let playingId: number = 0;
  let signalId = 0;
  const tickInterval: number = 1000;
  const SCHEDULEAHEADTIME: number = 0.1; // how far ahead to schedule audio (seconds)
  const LOOKAHEAD: number = 25.0; // how frequently to call the schedule function (ms)
  let timerID: number = 0; // the timer used to set the schedule
  let nextTime: number = 0.0;

  // initialize the preview timeline and the ticks when the display layout changes
  useEffect(() => {
    console.log(
      "initializing the preview timeline and ticks with displaywidth and offsettime",
      displayWidth,
      offsetTime
    );
    if (timeLine) {
      const nP: TimeLine = timeLine.copy();
      nP.width = displayWidth;
      const extent: number = TimeLineScales[nP.currentZoomLevel].extent;
      while (offsetTime > nP.startTime + extent) {
        nP.startTime += extent / 2.0;
      }
      while (offsetTime < nP.startTime) {
        nP.startTime -= extent / 2.0;
      }
      previewTimeline.current = nP;
      setTimeProgress(offsetTime);
      const newTimeTicks: TimeTicks | null = updateTimeTicks(nP);
      if (newTimeTicks) setTicks(newTimeTicks);
    }
  }, [displayWidth, offsetTime]);

  // prepare the drawing when new sources arrive
  useEffect(() => {
    console.log(
      "initializing preview layout with new data for new sources or previewtimeline pan right",
      sourceData.length
    );

    // initialize the timeprogress value
    setTimeProgress(offsetTime);

    const newDrawing: HTMLElement | null = document.getElementById("drawing");
    setDrawing(newDrawing);

    // count the number of unique generators
    const nList: GeneratorType[] = [];
    sourceData.forEach((s) => {
      if (nList.find((g) => g.name == s.gen.name) == undefined)
        nList.push(s.gen);
    });
    console.log("preview generator list", nList);
    setSelectedGenerators(nList);

    // map sources to drawing sections
    const [newSections, newMap] = mapSourcesToSections();
    // set up the sections based on their numbers and types
    setupSections(newSections, newMap, previewHeight);
    setDrawingSections(newSections);
    setSourceToDrawingSectionMap(newMap);

    // initialize the pending source data
    setPendingSourceData(sourceData);
  }, [sourceData]);

  // draw the sources when a new previewtimeline and a drawing exists
  useEffect(() => {
    if (previewTimeline.current && drawing) {
      console.log("previewtimeline or drawing update ");
      DrawSources(
        pendingSourceData,
        drawing,
        previewTimeline.current,
        timeProgress,
        drawingSections,
        sourceToDrawingSectionMap
      );
    }
  }, [drawing]);

  function onExit() {
    setMode(GENERATIONMODE.idle);
    setRunning(false);
    playing.current = false;
    paused.current = true;
    timerID && clearTimeout(timerID);
    tickId && clearTimeout(tickId);
    playingId && clearTimeout(playingId);
    signalId && clearTimeout(signalId);
    if (audioContext) {
      audioContext.close();
    }
  }

  // either start the previewer or exit
  function OnStartStop() {
    if (running) {
      onExit();
      return;
    }

    setRunning(true);
    console.log("previewing new sourcedata at offsettime", offsetTime);

    // establish the context and realize the room effects
    const ctx: AudioContext = new AudioContext();
    setAudioContext(ctx);
    ctx.suspend;
    initializeRoomEffects(ctx);

    // the real time scheduler
    ctx.resume();
    scheduler(ctx);
    // time progress updated every second
    tick(ctx);
    // generator highlighter running every 1/2 seconds
    playingGenerators(ctx);
    // volume level monitor running every 1/2 second
    volumeMonitor(ctx);
  }

  // on a pause, stop the timers
  // on resume, this restarts them
  function onPauseResume() {
    if (!audioContext) {
      console.log("no audio context on pause request");
      return;
    }
    if (paused.current) {
      console.log(
        "exit from pause at",
        audioContext.currentTime,
        "activeSource count",
        activeSources.current.length
      );
      paused.current = false;
      setIsPaused(false);
      audioContext.resume();
      scheduler(audioContext);
      tick(audioContext);
      playingGenerators(audioContext);
      volumeMonitor(audioContext);
    } else {
      console.log("enter pause at", audioContext.currentTime);
      paused.current = true;
      setIsPaused(true);
      audioContext.suspend();
      timerID && clearTimeout(timerID);
      tickId && clearTimeout(tickId);
      playingId && clearTimeout(playingId);
      signalId && clearTimeout(signalId);
    }
  }

  return (
    <div
      className="preview"
      style={{ height: displayHeight, width: displayWidth }}
    >
      <div
        className="header"
        style={{ width: displayWidth, height: headerHeight }}
      >
        <div className="icon">
          <img
            src={CMG2}
            alt="CGM"
            style={{ width: 40, height: 40, margin: "0", padding: "0" }}
          />
        </div>
        <div className="buttons">
          {!running ? (
            <button onClick={() => onExit()} style={{ fontSize: 12 }}>
              Exit
            </button>
          ) : null}
          <button onClick={() => OnStartStop()} style={{ fontSize: 12 }}>
            {running ? "Stop" : "Start"}
          </button>
          {running ? (
            <button onClick={() => onPauseResume()} style={{ fontSize: 12 }}>
              {isPaused ? "Resume" : "Pause"}
            </button>
          ) : null}
        </div>
        <div className="title" style={{ fontWeight: "bold" }}>
          {`${appName}: ${appVersion} (${fileName})${
            fileContents.dirty ? "*" : ""
          }`}
        </div>
        <div className="left">
          <input
            type="range"
            readOnly
            value={signalLevels.left}
            min={-90}
            max={0}
          ></input>
        </div>
        <div className="right">
          <input
            type="range"
            readOnly
            value={signalLevels.right}
            min={-90}
            max={0}
          ></input>
        </div>
      </div>
      <div
        className="timeline"
        style={{ width: displayWidth, height: timelineHeight }}
      >
        {previewTimeline.current ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={displayWidth}
            height={timelineHeight}
            viewBox={`0 0 ${displayWidth} ${timelineHeight}`}
          >
            <rect
              id="timeline"
              x={0}
              y={0}
              width={displayWidth}
              height={timelineHeight}
              fill="white"
            />
            <path
              stroke="black"
              d={`m 0 ${timelineHeight} H ${displayWidth}`}
            />
            {getTickLinesandLabels(previewTimeline.current, ticks)}
          </svg>
        ) : null}
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="drawing"
        id="drawing"
        width={displayWidth}
        height={previewHeight}
      />
      <div
        className="footer"
        style={{ width: displayWidth, height: footerHeight }}
      >
        <div className="status">
          <table>
            <thead>
              <tr>
                <th>Counts</th>
                <th>Generators</th>
                <th>Sources</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total</td>
                <td>{selectedGenerators.length}</td>
                <td>{sourceData.length}</td>
              </tr>
              <tr>
                <td>Active </td>
                <td>{activeGeneratorsCount}</td>
                <td>{activeSourcesCount}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <RoomVolumeDialog />
        <RoomReverbDialog />
        <RoomCompressorDialog />
        <RoomEqualizerDialog />
      </div>
    </div>
  );

  // get the type of the drawing section based on the source type
  function getSectionType(s: RawSourceData): SectionType {
    if (s.gen.type == GENERATORTYPE.AudioFile) {
      return SectionType.AudioFile;
    } else if (s.gen.type == GENERATORTYPE.Algorithmic) {
      const gen: Algorithmic = s.gen as Algorithmic;
      if (gen.preset != undefined) {
        if (gen.preset?.header.bank == 128) {
          return SectionType.Percussion;
        } else return SectionType.Instrument;
      } else return SectionType.None;
    } else return SectionType.None;
  }

  // assign each source to a section depending on the generator type
  // and preset bank
  // heights and vertical offsets are determined after all sections are known
  function mapSourcesToSections(): [
    DrawingSection[],
    SourceToDrawingSectionEntry[]
  ] {
    const newDrawingSections: DrawingSection[] = [];
    const newSourceToDrawingSectionMap: SourceToDrawingSectionEntry[] = [];
    nInstrument = -1;
    nPercussion = -1;
    nAudioFiles = 0;
    sourceData.forEach((s: RawSourceData) => {
      const sectionType = getSectionType(s);
      switch (sectionType) {
        case SectionType.AudioFile:
          {
            const iSection: number = newDrawingSections.length;
            newDrawingSections.push({
              type: SectionType.AudioFile,
              height: 0,
              verticalOffset: 0,
              loValue: -1,
              hiValue: 1,
            });
            newSourceToDrawingSectionMap.push({
              sectionIndex: iSection,
              sourceIndex: s.index,
            });
            nAudioFiles++;
            console.log(
              "source",
              s.index,
              "mapped to section",
              sectionType,
              "for generator ",
              s.gen.name,
              iSection
            );
          }
          break;
        case SectionType.Percussion:
          {
            const iSection: number =
              nPercussion == -1 ? newDrawingSections.length : nPercussion;
            if (nPercussion == -1) {
              nPercussion = newDrawingSections.length;
              newDrawingSections.push({
                type: SectionType.Percussion,
                height: 0,
                verticalOffset: 0,
                loValue: Number.MAX_SAFE_INTEGER,
                hiValue: Number.MIN_SAFE_INTEGER,
              });
            }
            newSourceToDrawingSectionMap.push({
              sectionIndex: iSection,
              sourceIndex: s.index,
            });
            console.log(
              "source",
              s.index,
              "mapped to section",
              sectionType,
              "for generator ",
              s.gen.name,
              iSection
            );
          }
          break;
        case SectionType.Instrument:
          {
            const iSection: number =
              nInstrument == -1 ? newDrawingSections.length : nInstrument;
            if (nInstrument == -1) {
              nInstrument = newDrawingSections.length;
              newDrawingSections.push({
                type: SectionType.Instrument,
                height: 0,
                verticalOffset: 0,
                loValue: Number.MAX_SAFE_INTEGER,
                hiValue: Number.MIN_SAFE_INTEGER,
              });
            }
            newSourceToDrawingSectionMap.push({
              sectionIndex: iSection,
              sourceIndex: s.index,
            });
            console.log(
              "source",
              s.index,
              "mapped to section",
              sectionType,
              "for generator",
              s.gen.name,
              iSection
            );
          }
          break;
        default: {
          console.log(
            "source has no section for generator",
            s.gen.name,
            s.gen.type
          );
          break;
        }
      }
    });
    return [newDrawingSections, newSourceToDrawingSectionMap];
  }

  // basd on the source data types, the drawing is partitioned into sections
  // based on the following scheme
  // 1. Only instruments or only percussion or only 1 audiofile - the full drawing
  //    is allocated to the section
  // 2. N audio files - each AF section is allocated 1/N of the drawing
  // 3. Instrument + percussion, 0 AF - 75% to instrument, 25% to percussion
  // 4. Instrument + percussion + n AF - 70% to instrument, 25% to percussion, 10% to all AFs split 10%/N each
  function setupSections(
    drawingSections: DrawingSection[],
    map: SourceToDrawingSectionEntry[],
    height: number
  ) {
    // abnormal case - no sections
    if (drawingSections.length == 0) {
      console.log("no drawing sections defined");
      return;
    }

    // only one section
    if (
      (nInstrument != -1 && nPercussion == -1 && nAudioFiles == 0) ||
      (nInstrument == -1 && nPercussion != -1 && nAudioFiles == 0) ||
      (nInstrument == -1 && nPercussion == -1 && nAudioFiles == 1)
    ) {
      console.log("one drawing section");
      drawingSections[0].height = height;
      drawingSections[0].verticalOffset = 0;
    }
    // only n audiofiles
    else if (nInstrument == -1 && nPercussion == -1) {
      console.log(nAudioFiles, "audiofile sections");
      const sectionSize: number = height / nAudioFiles;
      let offset: number = 0;
      drawingSections.forEach((section) => {
        section.height = sectionSize;
        section.verticalOffset = offset;
        offset += sectionSize;
      });
    }
    // instrument + percussion, no audiofiles
    else if (nInstrument > -1 && nPercussion > -1 && nAudioFiles == 0) {
      console.log("instrument and percussion sections");
      // there are two sections. first wil be instrument at 75%, then percussion at 25%
      const sectionSize: number = height * 0.75;
      drawingSections[nInstrument].height = sectionSize;
      drawingSections[nInstrument].verticalOffset = 0;
      drawingSections[nPercussion].height = height - sectionSize;
      drawingSections[nPercussion].verticalOffset = sectionSize;
    }

    // instrument, no percussion, n audiofiles
    // no instrument, percussion, n audiofiles
    else if (
      (nInstrument > -1 && nPercussion == -1 && nAudioFiles > 0) ||
      (nInstrument == -1 && nPercussion > -1 && nAudioFiles > 0)
    ) {
      console.log(
        "either 1 instrument or percussion, and",
        nAudioFiles,
        "audiofiles"
      );
      const section1: number = height * 0.7;
      const section2: number = height * 0.3;
      if (nInstrument > -1) {
        drawingSections[nInstrument].height = section1;
      }
      if (nPercussion > -1) {
        drawingSections[nPercussion].height = section1;
      }
      // process each audiofile section
      const subsectionHeight = section2 / nAudioFiles;
      let offset: number = section1;
      drawingSections.forEach((section) => {
        if (section.type != SectionType.AudioFile) return;
        section.height = subsectionHeight;
        section.verticalOffset = offset;
        offset += subsectionHeight;
      });
    }
    // instrument + percussion + n audioFiles
    else if (nInstrument > -1 && nPercussion > -1 && nAudioFiles > 0) {
      console.log(
        "1 instrument and percussion, and",
        nAudioFiles,
        "audiofiles"
      );
      const section1: number = height * 0.7;
      const section2: number = height * 0.2;
      const section3: number = height * 0.1;
      drawingSections[nInstrument].verticalOffset = 0;
      drawingSections[nInstrument].height = section1;
      drawingSections[nPercussion].height = section2;
      drawingSections[nPercussion].verticalOffset = section1;
      // process each audiofile section
      const subsectionHeight = section3 / nAudioFiles;
      let offset: number = section2;
      drawingSections.forEach((section) => {
        if (section.type != SectionType.AudioFile) return;
        section.height = subsectionHeight;
        section.verticalOffset = offset;
        offset += subsectionHeight;
      });
    } else {
      console.log(
        "drawing sectioning case not determined",
        "nInstrument",
        nInstrument,
        "nPercussion",
        nPercussion,
        "nAudioFiles",
        nAudioFiles
      );
    }

    // determine to lo and hi value for each section
    map.forEach((m) => {
      const section: DrawingSection = drawingSections[m.sectionIndex];
      const source: RawSourceData | undefined = sourceData.find(
        (s) => s.index == m.sourceIndex
      );
      if (source == undefined) {
        console.log(
          "source not found with index",
          m.sourceIndex,
          "during lo hi search"
        );
        return;
      }
      if (section.type != SectionType.AudioFile) {
        section.loValue = Math.min(source.source.note, section.loValue);
        section.hiValue = Math.max(source.source.note, section.hiValue);
      }
    });
  }

  // draw all of the sources on the instrument or percussion
  // canvas as inactive
  function DrawSources(
    sources: RawSourceData[],
    drawing: HTMLElement,
    timeline: TimeLine,
    timeProgress: number,
    sections: DrawingSection[],
    sourceMap: SourceToDrawingSectionEntry[]
  ) {
    console.log("drawing lines for ", sources.length, "sources");
    if (!drawing || !timeline) {
      console.log("either drawing or timeline is null");
      return;
    }

    // clear the current drawing
    while (drawing.firstChild) {
      drawing.firstChild.remove();
    }

    // draw a horizontal line at the bottom of each drawing section
    // and write its name along the left side
    let stroke: string = "black";
    drawingSections.forEach((section: DrawingSection) => {
      const newLine: SVGLineElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      // draw line between sections
      newLine.setAttribute("x1", "0");
      newLine.setAttribute("x2", displayWidth.toString());
      newLine.setAttribute(
        "y1",
        (section.height + section.verticalOffset).toString()
      );
      newLine.setAttribute(
        "y2",
        (section.height + section.verticalOffset).toString()
      );
      newLine.setAttribute("stroke", stroke);
      newLine.setAttribute("stroke-width", "2");
      newLine.setAttribute("stroke-dasharray", "5,5");
      drawing.appendChild(newLine);
      const sectionNameElement: SVGTextElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );
      sectionNameElement.textContent = section.type + "s";
      // sectionNameElement.setAttribute("transform", "rotate(-90)");
      sectionNameElement.setAttribute("x", "2");
      sectionNameElement.setAttribute(
        "y",
        (section.height + section.verticalOffset - 5).toString()
      );
      sectionNameElement.style = "font-size: 12pt; fill: black;";
      drawing.appendChild(sectionNameElement);
    });

    // get the time line start and end points. time progress should be between
    // this values
    // const strokeWidth: string = "1";
    const timelineStart: number = timeline.startTime;
    const timelineEnd: number =
      timelineStart + TimeLineScales[timeline.currentZoomLevel].extent;
    console.log(
      "time progress and time line start and end",
      timeProgress,
      timelineStart,
      timelineEnd
    );
    // draw the timeprogress line
    const progressLine: SVGLineElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    if (timeProgress >= timelineStart && timeProgress <= timelineEnd) {
      const offset = getOffsetFromTime(
        timeProgress,
        displayWidth,
        timelineStart,
        timelineEnd
      );
      progressLine.setAttribute("x1", offset.toString());
      progressLine.setAttribute("x2", offset.toString());
      progressLine.setAttribute("y1", "0");
      progressLine.setAttribute("y2", displayHeight.toString());
      progressLine.setAttribute("stroke", "red");
      progressLine.id = "timeprogress";
      drawing.appendChild(progressLine);
    }

    // loop through the source data and find each that appears on the current
    // time line
    pendingSourceData.forEach((s: RawSourceData) => {
      const { startTime, stopTime, note } = s.source;

      // determine if any part of the source appears in the time line
      const lineStart = Math.min(
        Math.max(timelineStart, startTime),
        timelineEnd
      );
      const lineEnd = Math.min(Math.max(timelineStart, stopTime), timelineEnd);
      if (lineStart >= lineEnd) {
        // console.log('line', i,'not visible', startTime, stopTime, lineStart, lineEnd);
        return;
      }
      // find the section for this source and retrieve its section height and offset
      const entry: SourceToDrawingSectionEntry | undefined = sourceMap.find(
        (map) => map.sourceIndex == s.index
      );
      if (entry == undefined) {
        console.log("section not found for source generator", s.gen.name);
        return;
      }
      const sectionIndex = entry.sectionIndex;
      const { height, type, loValue, hiValue, verticalOffset } =
        sections[sectionIndex];

      // convert the source's start and stop time to drawing coorindates
      const xStart: number = getOffsetFromTime(
        startTime,
        displayWidth,
        timelineStart,
        timelineEnd
      );
      const xEnd: number = getOffsetFromTime(
        stopTime,
        displayWidth,
        timelineStart,
        timelineEnd
      );
      // for instruments and percussion, draw lines at midi notes based on
      // source start and stop times, volume, pan, and activity
      // TODO for now, just draw a line for an audiofile
      if (
        type == SectionType.Instrument ||
        type == SectionType.Percussion ||
        type == SectionType.AudioFile
      ) {
        const yMidi: number = getOffsetFromMidi(
          note,
          loValue,
          hiValue,
          height,
          verticalOffset
        );
        const hue = getHue(s.panner.value);
        const saturation: number = getSaturation(s.vol.value);
        // const saturation: number = 100;
        const lightness: number = getLightness(s.source.started);
        stroke = "hsl(" + hue + "," + saturation + "%," + lightness + "%";
        const newLine: SVGLineElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        newLine.id = "line-" + s.index.toString();
        newLine.setAttribute("x1", xStart.toString());
        newLine.setAttribute("x2", xEnd.toString());
        newLine.setAttribute("y1", yMidi.toString());
        newLine.setAttribute("y2", yMidi.toString());
        newLine.setAttribute("stroke", stroke);
        newLine.setAttribute(
          "stroke-width",
          type == SectionType.Instrument ? "3" : "3"
        );
        drawing.appendChild(newLine);
      } else {
        console.log("bad section type", type);
      }
      // TODO for audiofiles, draw the portion of the sample that fits in the timeline
    });
  }

  // change a line's color
  function redrawSource(s: RawSourceData) {
    // console.log("recoloring a source for generator", s.gen.name);

    // find the source's line
    const sourceElement: Element | null = document.getElementById(
      "line-" + s.index.toString()
    );
    if (!sourceElement) {
      console.log("line not found for source", s.index);
      return;
    }
    const hue = getHue(s.panner.value);
    const saturation: number = getSaturation(s.vol.value);
    const lightness: number = getLightness(s.source.started);
    const stroke = "hsl(" + hue + "," + saturation + "%," + lightness + "%";
    sourceElement.setAttribute("stroke", stroke);
  }

  function scheduler(ctx: AudioContext): void {
    if (paused.current) {
      console.log("scheduler paused");
      timerID && clearTimeout(timerID);
      return;
    }
    let triggerUpdate: boolean = false;
    let newActiveSources: ActiveSource[] = [...activeSources.current];
    if (playing.current && previewTimeline.current) {
      // eliminate any pending sources whose stoptime is
      const aheadTime = ctx.currentTime + SCHEDULEAHEADTIME;
      let nStarted: number = 0;
      let nStopped: number = 0;
      while (nextTime < aheadTime) {
        // console.log(activeSources.length,'active sources at time ', nextTime);
        pendingSourceData.forEach((s: RawSourceData) => {
          if (!ctx || !concentrator) return;

          // add any sources that are ready to start and are not already started
          if (
            aheadTime >= s.source.startTime &&
            aheadTime <= s.source.startTime + s.source.duration &&
            !s.source.started
          ) {
            const activeSource: ActiveSource = realizeSource(
              ctx,
              s,
              s.index,
              concentrator
            );
            if (activeSource.gen.type != GENERATORTYPE.Silent) {
              activeSource.source.start(
                s.source.startTime,
                0,
                s.source.duration
              );
            }
            // console.log("source", s.index, "started at ", s.source.startTime);
            newActiveSources.push(activeSource);
            s.source.started = true;
            redrawSource(s);
            triggerUpdate = true;
            nStarted++;
          }
        });

        // disconnect all of the nodes that have finished playing
        // and delete them
        // don't turn them off until the early reflections stop
        // console.log('activesources count', newActiveSources);
        newActiveSources = newActiveSources.filter((activeSource) => {
          if (!ctx) return false;

          const thisSource: RawSourceData | undefined = pendingSourceData.find(
            (s) => s.index == activeSource.sourceIndex
          );
          if (thisSource == undefined) {
            console.log(
              "could not find pending source with index",
              activeSource.sourceIndex
            );
            return;
          }
          const stopTime: number =
            activeSource.stopTime +
            (reflectionDelay == 0
              ? 0
              : reflectionDelay / 1000 + thisSource.source.duration);
          // console.log('source stop candidate stoptime, audioContext', stopTime, ctx.currentTime);
          if (ctx.currentTime > stopTime) {
            if (activeSource.gen.type != GENERATORTYPE.Silent) {
              activeSource.source.disconnect();
              activeSource.vol.disconnect();
              activeSource.panner.disconnect();
            }
            thisSource.source.started = false;
            // console.log("source stopped at", stopTime);
            redrawSource(thisSource);
            nStopped++;
            triggerUpdate = true;
            return false;
          } else return true;
        });
        // advance to the next scheduled time
        nextTime += SCHEDULEAHEADTIME;
      }
      // notify the display engine of the sources currently playing
      if (triggerUpdate) {
        // console.log('activesources has changed', newActiveSources.length);
        activeSources.current = newActiveSources;
        setActiveSourcesCount(newActiveSources.length);
      }
    }
    // check if done or stopped
    const done: boolean = ctx.currentTime > playbackLength;
    if (!done && playing.current) {
      timerID = window.setTimeout(scheduler, LOOKAHEAD, ctx);
    } else {
      if (ctx.state !== "closed") {
        ctx.suspend();
        ctx.close();
      }
      console.log("completed preview at ", playbackLength);
      onExit();
    }
  }
  // time progress clicker for updating the time progress widget
  function tick(ctx: AudioContext): void {
    if (paused.current) {
      console.log("tick paused");
      tickId && clearTimeout(tickId);
      return;
    }
    if (playing.current && ctx.currentTime <= playbackLength) {
      // console.log("tick at", ctx.currentTime);
      tickId = window.setTimeout(tick, tickInterval, ctx);
      if (previewTimeline.current) {
        const newTime: number = Math.round(ctx.currentTime + offsetTime);
        const ptl: TimeLine | null = updateTimeline(newTime);
        if (!ptl) return;
        const timelineStart = ptl.startTime;

        // if the timeline starttime chanages update the timeline and
        // trim the pending sources
        if (ptl.startTime != previewTimeline.current.startTime) {
          previewTimeline.current = ptl;
          const newSourceData: RawSourceData[] = pendingSourceData.filter(
            (source) => {
              const sourceStopTime: number = source.source.stopTime;
              return sourceStopTime >= timelineStart;
            }
          );
          if (newSourceData.length != pendingSourceData.length) {
            // console.log(
            //   "remaining sources after trimming",
            //   newSourceData.length
            // );
            setPendingSourceData(newSourceData);
          }
          if (drawing)
            DrawSources(
              newSourceData,
              drawing,
              ptl,
              newTime,
              drawingSections,
              sourceToDrawingSectionMap
            );
        }
        setTimeProgress(newTime);
      }
    } else {
      tickId && clearTimeout(tickId);
      setTimeProgress(-1);
    }
  }

  // determine which generators are currently playing
  function playingGenerators(ctx: AudioContext) {
    if (paused.current) {
      console.log("playingGenerators paused");
      playingId && clearTimeout(playingId);
      return;
    }

    // update the generators playing list
    if (playing.current && ctx.currentTime <= playbackLength) {
      const newActiveGenerators: string[] = [];
      // console.log(
      //   "checking",
      //   activeSources.current.length,
      //   "sources for active generators at",
      //   ctx.currentTime
      // );
      activeSources.current.forEach((s: ActiveSource) => {
        if (
          newActiveGenerators.findIndex((name: string) => name == s.gen.name) <
          0
        ) {
          if (
            ctx.currentTime >= s.gen.startTime &&
            ctx.currentTime <= s.gen.stopTime
          ) {
            // console.log(
            //   "active generator at time",
            //   ctx.currentTime,
            //   s.gen.name
            // );
            newActiveGenerators.push(s.gen.name);
          }
        }
        newActiveGenerators;
        activeGenerators.current = newActiveGenerators;
        setActiveGeneratorsCount(newActiveGenerators.length);
      });
      playingId = window.setTimeout(playingGenerators, 500, ctx);
    } else {
      playingId && clearTimeout(playingId);
    }
  }

  function volumeMonitor(ctx: AudioContext) {
    if (paused.current) {
      console.log("volumeMonitor paused");
      signalId && clearTimeout(signalId);
      return;
    }

    if (playing.current && ctx.currentTime <= playbackLength) {
      // get the current volume levels
      setSignalLevels(() => {
        if (!analyzer) return { left: -90, right: -90 };
        const { left, right } = analyzer.getValues();
        return { left, right };
      });
      signalId = window.setTimeout(volumeMonitor, 500, ctx);
    } else {
      signalId && clearTimeout(signalId);
      setSignalLevels({ left: -90, right: -90 });
    }
  }

  function getHue(pan: number): number {
    let result: number = HUELEFT + ((pan - -1) * (HUERIGHT - HUELEFT)) / 2;
    return Math.max(Math.min(result, HUERIGHT), HUELEFT);
  }

  function getSaturation(vol: number): number {
    let result: number =
      SATURATIONLO + ((vol - -10) * (SATURATIONHI - SATURATIONLO)) / 20;
    return Math.max(Math.min(result, SATURATIONHI), SATURATIONLO);
  }

  function getLightness(started: boolean): number {
    return started ? LIGHTNESSHI : LIGHTNESSLO;
  }

  function getOffsetFromTime(
    time: number,
    width: number,
    startTime: number,
    endTime: number
  ) {
    return ((time - startTime) * width) / (endTime - startTime);
  }

  function getOffsetFromMidi(
    midi: number,
    loMidi: number,
    hiMidi: number,
    height: number,
    offset: number
  ) {
    // adjust the range to add 10% to lo and 10% to high
    let lo: number = loMidi - 5;
    let hi: number = hiMidi + 5;
    return height - ((midi - lo) * height) / (hi - lo) + offset;
  }

  // if the time progress past the end of the current timeline
  // move the timeline ahead 1/2 of its current extent
  function updateTimeline(timeProgress: number): TimeLine | null {
    if (!previewTimeline.current) {
      console.log("in updatetimeline, previewtimeline is null");
      return null;
    }
    let result: TimeLine = previewTimeline.current;
    const extent: number =
      TimeLineScales[previewTimeline.current.currentZoomLevel].extent;
    let newStart: number = previewTimeline.current.startTime;
    if (timeProgress >= newStart + extent) {
      newStart = previewTimeline.current.startTime + extent / 2.0;
      while (newStart + extent <= timeProgress) newStart += extent / 2.0;
      console.log("new timeline start", newStart);
      const newPreviewTimeline: TimeLine = previewTimeline.current.copy();
      newPreviewTimeline.startTime = newStart;
      result = newPreviewTimeline;
    }

    // move the timeprogress line
    const timeProgressLine: HTMLElement | null =
      document.getElementById("timeprogress");
    if (timeProgressLine) {
      const offset: number = getOffsetFromTime(
        timeProgress,
        displayWidth,
        newStart,
        newStart + extent
      );
      timeProgressLine.setAttribute("x1", offset.toString());
      timeProgressLine.setAttribute("x2", offset.toString());
    }
    return result;
  }

  function initializeRoomEffects(ctx: AudioContext) {
    fileContents.equalizer.setContext(ctx);
    fileContents.compressor.setContext(ctx);
    fileContents.volume.setContext(ctx);
    fileContents.reverb.setContext(ctx);

    concentrator = buildRoomNodes(
      fileContents.compressor,
      fileContents.equalizer,
      fileContents.volume,
      fileContents.reverb,
      ctx
    );
    // determine the amount of time that the early reflections start
    if (fileContents.reverb.leftWall.gain > 0)
      reflectionDelay = Math.max(
        reflectionDelay,
        fileContents.reverb.leftWall.delay
      );
    if (fileContents.reverb.rightWall.gain > 0)
      reflectionDelay = Math.max(
        reflectionDelay,
        fileContents.reverb.rightWall.delay
      );
    if (fileContents.reverb.ceiling.gain > 0)
      reflectionDelay = Math.max(
        reflectionDelay,
        fileContents.reverb.ceiling.delay
      );

    // connect to the signal analyzer to the output of the volume (assumed to be last)
    analyzer = new SignalLevel(ctx, fileContents.volume.effect as GainNode);
  }
}
