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
import { Algorithmic } from "classes/generators";
import SignalLevel from "classes/signallevel";
import TimeLine from "classes/timeline";
import Volume from "classes/volume";
import { useCMGContext } from "cmgcontext";
import numeral from "numeral";
import { useEffect, useRef, useState } from "react";
import {
  ActiveSource,
  GENERATIONMODE,
  GeneratorType,
  GENERATORTYPE,
  RawSourceData,
  TIMEFORMATS,
  TimeLineScale,
  TimeLineScales,
} from "../types";
import { buildRoomNodes } from "./buildroomnodes";
import { realizeSource } from "./realizesource";

// as this function is non-reactive, many of its props
// are CMG context variables
export interface Preview2Props {
  playbackLength: number;
  offsetTime: number;
  sourceData: RawSourceData[];
  setMode: Function;
}
enum SectionType {
  "Instrument" = "Instrument",
  "Percussion" = "Percussion",
  "AudioFile" = "AudioFile"
}
type DrawingSection = {
  type:SectionType;
  verticalOffset: number;
  height: number;
}
type SourceToDrawingSectionEntry = {
  sourceIndex: number;
  sectionIndex: number;
}
type Ticks = {
    majorTickCount: number;
    scaleExtent: number;
    tickCount: number;
    tickHeight: number;
    tickSpacing: number;
    labelSize: number;
    labelSpacing: number;
    labelFormat: string;
}

// this component uses very few state variables as all subcomponents are 
// highly integrated
export default function Preview2(params: Preview2Props): JSX.Element {
  const { sourceData, offsetTime, playbackLength, setMode } = params;
  const { fileContents, playing, screenHeight, screenWidth, timeLine } =
    useCMGContext();
  let displayWidth: number = 0;
  let displayHeight:number = 0;
  let headerHeight: number = 0;
  let timelineHeight: number = 0;
  let drawingHeight: number = 0;
  let statusHeight: number = 0;
  const drawingSections:DrawingSection[] = [];
  const sourceToDrawingSectionMap: SourceToDrawingSectionEntry[] = [];
  let previewTimeLine: TimeLine | null = null;
  const generatorsPlaying:GeneratorType[] = [];
  const selectedGenerators: GeneratorType[] = [];
  const activeSources:ActiveSource[] = [];
  const signalLevels:{    left: Number;    right: number;  }= { left: 0, right: 0 };
  const audioContext:AudioContext | null = null;
  let drawing: HTMLElement | null = null;
  const running: boolean = false;
  const paused: boolean = false;
  const timeProgress: number = 0;
  let ticks: Ticks   = {
    majorTickCount: 0,
    tickCount: 0,
    tickHeight: 0,
    tickSpacing: 0,
    labelSize: 0,
    labelSpacing: 0,
    scaleExtent: 0,
    labelFormat: "",
  };
  const HUELEFT: number = 0;
  const HUERIGHT: number = 60;
  const SATURATIONLO: number = 50;
  const SATURATIONHI: number = 100;
  const LIGHTNESSLO: number = 40;
  const LIGHTNESSHI: number = 60;
  let LINEWIDTH: string = "2";

  // initial conditions
  useEffect(() => {
    console.log("initializing preview layout");
    displayHeight = screenHeight - 25;
    displayWidth = screenWidth - 10;
    headerHeight = 20;
    timelineHeight = 40;
    statusHeight = 180;
    drawingHeight =
      displayHeight - headerHeight - timelineHeight - statusHeight;
    const nP: TimeLine = new TimeLine(displayWidth, timelineHeight);
    nP.currentZoomLevel = timeLine.currentZoomLevel;
      previewTimeLine = nP;
      const scale: TimeLineScale = TimeLineScales[nP.currentZoomLevel];
      ticks = {
        majorTickCount: scale.majorDivisions,
        scaleExtent: scale.extent,
        tickCount: scale.majorDivisions * scale.minorDivisions,
        tickHeight: nP.height / 3.0,
        tickSpacing:
          nP.width / (scale.majorDivisions * scale.minorDivisions),
        labelSize: nP.height / 3.0,
        labelSpacing: nP.width / scale.majorDivisions,
        labelFormat: TIMEFORMATS[scale.format].value,
};
    const newDrawing: HTMLElement | null = document.getElementById("drawing");
    drawing = newDrawing;

    // count the number of unique generators
      sourceData.forEach((s) => {
        if (selectedGenerators.find((g) => g.name == s.gen.name) == undefined)
          selectedGenerators.push(s.gen);
      });

    // assign each source to a section depending on the generator type
    // and preset bank
    // heights and vertical offsets are determined after all sections are known
    let nAudioFiles: number = 0;
    let nPercussion: number = 0;
    let nInstrument: number = 0;
    sourceData.forEach((s, index) => {
      if (s.gen.type == GENERATORTYPE.AudioFile) {
          const next: number = drawingSections.length;
        drawingSections.push({
          type:SectionType.AudioFile,
          height:0,
          verticalOffset: 0});
        sourceToDrawingSectionMap.push({
          sectionIndex: next,
          sourceIndex: index
        });
        nAudioFiles++;
      } else if (s.gen.type == GENERATORTYPE.Algorithmic) {
        const gen = s.gen as Algorithmic;
        if (gen.preset?.header.bank == 128) {
          const next: number = (nPercussion == 0? drawingSections.length: nPercussion);
          nPercussion = drawingSections.length;
          drawingSections.push({
            type:SectionType.Percussion,
            height: 0,
            verticalOffset: 0          });
        sourceToDrawingSectionMap.push({
          sectionIndex: next,
          sourceIndex: index
        });
      }
      else {
          const next: number = (nInstrument == 0? drawingSections.length: nInstrument);
          nInstrument = drawingSections.length;
          drawingSections.push({
            type:SectionType.Instrument,
            height: 0,
            verticalOffset: 0          });
        sourceToDrawingSectionMap.push({
          sectionIndex: next,
          sourceIndex: index
        });

      }
    }

    // set up the sections based on their numbers and types


    DrawSources(sourceData);

  }, [sourceData]);

  // draw all of the sources on the instrument or percussion
  // canvas as inactive
  function DrawSources(sources: RawSourceData[]) {
    console.log("drawing lines for ", sources.length, "sources");
    if (!drawing.current || !previewTimeLine.current) {
      console.log("either drawing or timeline is null");
      return;
    }
    // clear the current drawing
    while (drawing.current.firstChild) {
      drawing.current.firstChild.remove();
    }
    let stroke: string = "black";
    // const strokeWidth: string = "1";
    const timelineStart: number = previewTimeLine.current.startTime;
    const timelineEnd: number =
      timelineStart + TimeLineScales[previewTimeLine.current.currentZoomLevel].extent;
    console.log(
      "time progress and time line start and end",
      timeProgress,
      timelineStart,
      timelineEnd
    );
    sourceData.forEach((s: RawSourceData, i: number) => {
      if (!drawing.current) return;
      const { startTime, stopTime, note } = s.source;
      const lineStart = Math.min(
        Math.max(timelineStart, startTime),
        timelineEnd
      );
      const lineEnd = Math.min(Math.max(timelineStart, stopTime), timelineEnd);
      if (lineStart < lineEnd) {
        const xStart: number = getOffsetFromTime(
          startTime,
          drawing.current.clientWidth,
          timelineStart,
          timelineEnd
        );
        const xEnd: number = getOffsetFromTime(
          stopTime,
          drawing.current.clientWidth,
          timelineStart,
          timelineEnd
        );
        const yMidi: number = getOffsetFromMidi(note, drawing.current.clientHeight);
        const hue = getHue(s.panner.value);
        const saturation: number = getSaturation(s.vol.value);
        // const saturation: number = 100;
        const lightness: number = getLightness(s.source.started);
        stroke = "hsl(" + hue + "," + saturation + "%," + lightness + "%";
        const newLine: SVGLineElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        newLine.id = "line-" + i.toString();
        newLine.setAttribute("x1", xStart.toString());
        newLine.setAttribute("x2", xEnd.toString());
        newLine.setAttribute("y1", yMidi.toString());
        newLine.setAttribute("y2", yMidi.toString());
        newLine.setAttribute("stroke", stroke);
        newLine.setAttribute("stroke-width", LINEWIDTH);
        drawing.current.appendChild(newLine);
      }
    });
  }

  function redrawSource(s: RawSourceData, index: number) {
    if (s.gen.type != GENERATORTYPE.Algorithmic || !previewTimeLine.current || !drawing.current)
      return;
    console.log("redrawing a source for generator", s.gen.name);
    const generator: Algorithmic = s.gen as Algorithmic;
    const timelineStart: number = previewTimeLine.current.startTime;
    const timelineEnd: number =
      timelineStart + TimeLineScales[previewTimeLine.current.currentZoomLevel].extent;
    const iStart: number = s.source.startTime;
    const iEnd: number = s.source.stopTime;
    const lineStart = Math.min(Math.max(timelineStart, iStart), timelineEnd);
    const lineEnd = Math.min(Math.max(timelineStart, iEnd), timelineEnd);
    if (lineStart != lineEnd) {
      const xStart: number = getOffsetFromTime(
        lineStart,
        drawing.current.clientWidth,
        timelineStart,
        timelineEnd
      );
      const xEnd: number = getOffsetFromTime(
        lineEnd,
        drawing.current.clientWidth,
        timelineStart,
        timelineEnd
      );
      const yMidi: number = getOffsetFromMidi(
        s.source.note,
        drawing.current.clientHeight
      );
      // clear the part of the drawing containing the current source
      const sourceElement: Element | null = document.getElementById(
        "line-" + index.toString()
      );
      if (sourceElement) {
        const hue = getHue(s.panner.value);
        const saturation: number = getSaturation(s.vol.value);
        const lightness: number = getLightness(s.source.started);
        const stroke = "hsl(" + hue + "," + saturation + "%," + lightness + "%";
        sourceElement.setAttribute("stroke", stroke);
        console.log(
          "redraw source for generator",
          generator.name,
          xStart,
          xEnd,
          yMidi
        );
      } else {
        console.log("line with id ", "line-" + index.toString(), "not found");
      }
    }
  }
  // either start the previewer or exit
  function OnStartStop() {
    if (running) {
      setRunning(false);
      setMode(GENERATIONMODE.idle);
      playing.current = false;
      return;
    }
    setRunning(true);

    // draw the sources
    DrawSources(sourceData);

    console.log("previewing new sourcedata at offsettime", offsetTime);
    // initialize the timeline value
    setTimeProgress(offsetTime);

    // establish the context and realize the room effects
    const context: AudioContext = new AudioContext();
    setAudioContext(context);
    context.suspend;
    fileContents.equalizer.setContext(context);
    fileContents.compressor.setContext(context);
    fileContents.volume.setContext(context);
    fileContents.reverb.setContext(context);

    const concentrator: GainNode = buildRoomNodes(
      fileContents.compressor,
      fileContents.equalizer,
      fileContents.volume,
      fileContents.reverb,
      context
    );
    // determine the amount of time that the early reflections start
    let reflectionDelay: number = 0;
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

    const SCHEDULEAHEADTIME: number = 0.1; // how far ahead to schedule audio (seconds)
    const LOOKAHEAD: number = 25.0; // how frequently to call the schedule function (ms)
    let timerID: number = 0; // the timer used to set the schedule
    let nextTime: number = 0.0;

    // connect to the signal analyzer to the output of the volume (assumed to be last)
    const analyzer = new SignalLevel(
      context,
      (fileContents.volume as Volume).effect as GainNode
    );

    // the real time scheduler
    // when a source starts, realize and connect it to the room concentrator
    // when a source stops, disconnect and delete it when its stop time arrives
    let activeSources: ActiveSource[] = [];
    context.resume();
    scheduler();
    function scheduler(): void {
      if (playing.current) {
        const aheadTime = context.currentTime + SCHEDULEAHEADTIME;
        let nStarted: number = 0;
        let nStopped: number = 0;
        let triggerUpdate: boolean = false;
        while (nextTime < aheadTime) {
          // start the tones ready to start
          sourceData.forEach((s: RawSourceData, i: number) => {
            if (
              aheadTime >= s.source.startTime &&
              aheadTime <= s.source.startTime + s.source.duration &&
              !s.source.started
            ) {
              const activeSource: ActiveSource = realizeSource(
                context,
                s,
                i,
                concentrator
              );
              if (activeSource.gen.type != GENERATORTYPE.Silent) {
                activeSource.source.start(
                  s.source.startTime,
                  0,
                  s.source.duration
                );
              }
              console.log("source started at ", s.source.startTime);
              activeSources.push(activeSource);
              s.source.started = true;
              redrawSource(s, i);
              nStarted++;
              triggerUpdate = true;
            }
          });

          // disconnect all of the nodes that have finished playing
          // and delete them
          // don't turn them off until the early reflections stop
          activeSources = activeSources.filter((s: ActiveSource) => {
            const stopTime: number =
              s.stopTime +
              (reflectionDelay == 0
                ? 0
                : reflectionDelay / 1000 +
                  sourceData[s.sourceIndex].source.duration);
            if (context.currentTime > stopTime) {
              if (s.gen.type != GENERATORTYPE.Silent) {
                s.source.disconnect();
                s.vol.disconnect();
                s.panner.disconnect();
              }
              sourceData[s.sourceIndex].source.started = false;
              console.log("source stopped at", stopTime);
              redrawSource(sourceData[s.sourceIndex], s.sourceIndex);
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
          setActiveSources(activeSources);
        }
      }

      // check if done or stopped
      const done: boolean = context.currentTime > playbackLength;
      if (!done && playing.current) {
        timerID = window.setTimeout(scheduler, LOOKAHEAD);
      } else {
        timerID && clearTimeout(timerID);
        playing.current = false;
        if (context.state !== "closed") {
          (context as AudioContext).suspend();
          (context as AudioContext).close();
        }
        setMode(GENERATIONMODE.idle);
      }
    }

    // time progress clicker for updating the time progress widget
    let tickId: number = 0;
    let tickCounter: number = offsetTime;
    const tickInterval: number = 1000;
    tick();
    function tick(): void {
      if (playing.current && context.currentTime <= playbackLength) {
        tickId = window.setTimeout(tick, tickInterval);
        setTimeProgress(context.currentTime + offsetTime);
        tickCounter += tickInterval / 1000;
        updateTimeline(context.currentTime + offsetTime);
      } else {
        tickId && clearTimeout(tickId);
        setTimeProgress(-1);
      }
    }

    // generator highlighter running every 1/2 seconds
    let playingId: number = 0;
    playingGenerators();
    function playingGenerators() {
      if (playing.current && context.currentTime <= playbackLength) {
        // get the generators playing for highlighting
        setGeneratorsPlaying(() => {
          const newGeneratorsPlaying: GeneratorType[] = [];
          activeSources.forEach((s: ActiveSource) => {
            if (
              newGeneratorsPlaying.findIndex(
                (g: GeneratorType) => g.name == s.gen.name
              ) < 0
            ) {
              if (
                context.currentTime >= s.gen.startTime &&
                context.currentTime <= s.gen.stopTime
              )
                newGeneratorsPlaying.push(s.gen);
            }
          });
          return newGeneratorsPlaying;
        });
        playingId = window.setTimeout(playingGenerators, 500);
      } else {
        playingId && clearTimeout(playingId);
      }
    }

    // volume level monitor running every 1/2 second
    let signalId = 0;
    volumeMonitor();
    function volumeMonitor() {
      if (playing.current && context.currentTime <= playbackLength) {
        // get the current volume levels
        setSignalLevels(() => {
          const { left, right } = analyzer.getValues();
          return { left, right };
        });
        signalId = window.setTimeout(volumeMonitor, 500);
      } else {
        signalId && clearTimeout(signalId);
        setSignalLevels({ left: -90, right: -90 });
      }
    }
  }
  function onPauseResume() {
    if (paused) {
      audioContext?.resume();
      setPaused(false);
    } else {
      audioContext?.suspend();
      setPaused(true);
    }
  }

  const getHue = (pan: number): number => {
    let result: number = HUELEFT + (pan - -1) / (HUERIGHT - HUELEFT) / 2;
    return Math.max(Math.min(result, HUERIGHT), HUELEFT);
  };
  const getSaturation = (vol: number): number => {
    let result: number =
      SATURATIONLO + (vol - -10) / (SATURATIONHI - SATURATIONLO) / 10;
    return Math.max(Math.min(result, SATURATIONHI), SATURATIONLO);
  };
  const getLightness = (started: boolean): number => {
    return started ? LIGHTNESSHI : LIGHTNESSLO;
  };

  const getOffsetFromTime = (
    time: number,
    width: number,
    startTime: number,
    endTime: number
  ) => startTime + ((time - startTime) * width) / endTime;

  const getOffsetFromMidi = (midi: number, height: number) =>
    height - (midi * height) / 127;

  // if the time progress past the end of the current timeline
  // move the timeline ahead 1/2 of its curren extent
  function updateTimeline(timeProgress: number) {
    if (
      timeProgress >=
      timeLine.startTime + TimeLineScales[timeLine.currentZoomLevel].extent
    ) {
      const newStart: number =
        timeLine.startTime +
        TimeLineScales[timeLine.currentZoomLevel].extent / 2.0;
      console.log("new timeline start", newStart);
      if (previewTimeLine.current) previewTimeLine.current.startTime = newStart;
      DrawSources(sourceData);
    }
  }

  return (
    <div
      className="preview"
      style={{ height: displayHeight, width: displayWidth }}
    >
      {/* The layout should include 
    stop and pause/play buttons,
    room level effects,
    a graphical display, with the midi number on the Y axis and the 
    time on the xaxis
    sources are displayed a lines from the start to the release time.
    the vertical position is the midi number from 0 to 127
    line hue varies from HUELEFT to HUERIGHT depending on the pan
    a list of generators currently being played
    the signal levels 
    the page should be moveable but modal.
    special handling is needed for percussion as the midi number is used to
    select the instrument so is not real. maybe best to have a percussion section o the display that is 
    a height sufficient to accommodate the percussion channels (how many? 127?)
    */}
      <div
        className="header"
        style={{ width: displayWidth, height: headerHeight }}
      >
        <div className="buttons">
          <button onClick={() => OnStartStop()} style={{ fontSize: 12 }}>
            {running ? "Stop" : "Start"}
          </button>
          {/* the pause/resume button will set the context */}
          {running ? (
            <button onClick={() => onPauseResume()} style={{ fontSize: 12 }}>
              {paused ? "Resume" : "Pause"}
            </button>
          ) : null}
        </div>
        <div className="levels">Signal Levels</div>
      </div>
      <div
        className="timeline"
        style={{ width: displayWidth, height: timelineHeight }}
      >
        {previewTimeLine.current ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={displayWidth}
            height={timelineHeight}
            viewBox={`0 0 ${displayWidth} ${timelineHeight}`}
          >
            <rect
              className="timeline"
              id="timeline"
              x={0}
              y={0}
              width={displayWidth}
              height={timelineHeight}
            />
            <path
              stroke="black"
              d={`m 0 ${timelineHeight} H ${displayWidth}`}
            />
            {getTickLines(
              previewTimeLine.current, 
              ticks.tickCount, 
              ticks.tickHeight, 
              ticks.tickSpacing)}
            {getTickLabels(
              previewTimeLine.current,
              ticks.majorTickCount,
              ticks.labelSize,
              ticks.labelSpacing,
              ticks.scaleExtent,
              ticks.labelFormat
            )}
            {/* the playback time indicator */}
            <line
              stroke="red"
              x1="0"
              x2="0"
              y1="0"
              y2={timelineHeight}
              id="playback-tick"
            />
          </svg>
        ) : null}
      </div>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="drawing"
        id="drawing"
        width={displayWidth}
        height={drawingHeight}
        // style={{ width: displayWidth, height: canvasHeight }}
      />
      <div
        className="footer"
        style={{ width: displayWidth, height: statusHeight }}
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
              <td> </td>
              <td>Total</td>
              <td>{selectedGenerators.length}</td>
              <td>{sourceData.length}</td>
              </tr>
              <tr>
              <td> </td>
              <td>{generatorsPlaying.length}</td>
              <td>{activeSources.length}</td>
              </tr>
            </tbody>
          </table>
          <br/>
          {`${generatorsPlaying.map((g) => {
            return g.name + ",";
          })}`}
        </div>
        <div className="controls">room controls go here</div>
      </div>
    </div>
  );

  // build the tick marks
  function getTickLines(timeline: TimeLine, count: number, tickHeight: number, spacing: number) {
    const result: JSX.Element[] = [];
    if (timeline) {
      for (let i = 0; i <= count; i++) {
        const d: string = `m ${i * spacing} ${timelineHeight}  L ${
          i * spacing
        }  ${timelineHeight - tickHeight}`;
        result.push(<path key={"tick-" + i} d={d} stroke="black" />);
      }
    }
    return result;
  }
  // add the major tick mark labels
  function getTickLabels(
    timeline: TimeLine,
    count: number,
    size: number,
    spacing: number,
    extent: number,
    format: string
  ) {
    const result: JSX.Element[] = [];
    const sizepx: string = size.toString().concat("px");
    for (let i = 0; i <= count; i++) {
      const tValue: number = timeline.startTime + i * (extent / count);
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
}
