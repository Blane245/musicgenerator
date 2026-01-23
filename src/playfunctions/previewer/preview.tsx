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
// algorithmic sources are drawn as lines from their start to their stop time at their pitch values
// Their are user controls:
// Exit - quit the preview. This disappears when Start is pressed
// Start/Stop - start the preview from the beginning. Stop is the same as exit
// Pause/Resume - Pause the preview and resume it.
// The display is divided into 4 sections:
// Header which includes the control buttons and the left and right signal levels
// Timeline which displays the timeline
// Drawing which includes the source graphics
// Footer which includes status on genrators and sources playing and the room effect controls
import SignalLevel from "classes/signallevel";
import TimeLine from "classes/timeline";
import { useCMGContext } from "cmgcontext";
import { buildRoomNodes } from "playfunctions/buildroomnodes";
import { useEffect, useRef, useState } from "react";
import {
  ActiveSource,
  DrawingSection,
  GeneratorType,
  PLAYMODE,
  RawSourceData,
  SignalLevelsType,
  SourceToDrawingSectionEntry,
  TimeLineScales,
  TimeTicks,
} from "types";
import updateTimeTicks from "utils/updatetimeticks";
import changeTimerState from "./changetimestate";
import drawingSetup from "./drawingsetup";
import DrawSources, { redrawSource } from "./drawsources";
import Footer from "./footer";
import Header from "./header";
import Timeline from "./timeline";
import { debug } from "utils/debug";

// as this function is non-reactive except for exit, stop, pause, resume, many of its props
// are CMG context variables
export interface PreviewProps {
  sourceData: RawSourceData[];
  setMode: React.Dispatch<React.SetStateAction<PLAYMODE>>;
}

// this component uses many state variables as all subcomponents are
// highly integrated
export default function Preview(params: PreviewProps): JSX.Element {
  const { setMode, sourceData } = params;
  const {
    fileContents,
    setStatus,
    playing,
    displayHeight,
    displayWidth,
    previewHeight,
    footerHeight,
    timeLine,
    FFTSize,
    frequencyDisplay,
  } = useCMGContext();
  const pendingSourceData = useRef<RawSourceData[]>([]);
  const [drawingSections, setDrawingSections] = useState<DrawingSection[]>([]);
  const [sourceToDrawingSectionMap, setSourceToDrawingSectionMap] = useState<
    SourceToDrawingSectionEntry[]
  >([]);
  const previewTimeline = useRef<TimeLine | null>(null);
  const activeGenerators = useRef<string[]>([]);
  const [activeGeneratorsCount, setActiveGeneratorsCount] = useState<number>(0);
  const [playbackLength, setPlaybackLength] = useState<number>(0);
  const [offsetTime, setOffsetTime] = useState<number>(0);
  const [selectedGenerators, setSelectedGenerators] = useState<GeneratorType[]>(
    []
  );
  const activeSources = useRef<ActiveSource[]>([]);
  const [activeSourcesCount, setActiveSourcesCount] = useState<number>(0);
  const [signalLevels, setSignalLevels] = useState<SignalLevelsType>({
    leftVolume: 0,
    leftMax: 0,
    rightVolume: 0,
    rightMax: 0,
    leftSpectrum: new Uint8Array(0),
    rightSpectrum: new Uint8Array(0),
  });
  const [frequencyBins, setFrequencyBins] = useState<Float32Array>(
    new Float32Array(0)
  );
  const [leftVolumes, setLeftVolumes] = useState<string>("");
  const [rightVolumes, setRightVolumes] = useState<string>("");
  const [leftMaxes, setLeftMaxes] = useState<string>("");
  const [rightMaxes, setRightMaxes] = useState<string>("");

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [concentrator, setConcentrator] = useState<GainNode | null>(null);
  const [drawing, setDrawing] = useState<HTMLElement | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const paused = useRef<boolean>(false);
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
  const [analyser, setAnalyser] = useState<SignalLevel | null>(null);

  const tickId: number = 0;
  const playingId: number = 0;
  const signalId = 0;
  const timerID: number = 0;
  const nextTime: number = 0.0;

  // initialize the preview timeline and the ticks when the display layout changes
  useEffect(() => {
    debug.info(
      "Preview: initializing the preview timeline and ticks with displaywidth and offsettime",
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
      nP.startTime = Math.max(nP.startTime, 0);
      previewTimeline.current = nP;
      setTimeProgress(offsetTime);
      const newTimeTicks: TimeTicks | null = updateTimeTicks(nP);
      if (newTimeTicks) setTicks(newTimeTicks);
    }
  }, [displayWidth, offsetTime, timeLine]);

  // prepare the drawing when new sources arrive
  useEffect(() => {
    // find the offsettime and playback length
    let newLength: number = 0;
    let newOffset: number = Number.MAX_VALUE;
    sourceData.forEach((s) => {
      newLength = Math.max(newLength, s.source.stopTime);
      newOffset = Math.min(newOffset, s.source.startTime);
    });
    setPlaybackLength(newLength - newOffset);
    setOffsetTime(newOffset);

    // initialize the timeprogress value
    setTimeProgress(newOffset);

    const newDrawing: HTMLElement | null = document.getElementById("drawing");
    setDrawing(newDrawing);

    // count the number of unique generators
    const nList: GeneratorType[] = [];
    sourceData.forEach((s) => {
      if (nList.find((g) => g.name == s.gen.name) == undefined)
        nList.push(s.gen);
    });
    debug.info("Preview: preview generator list", nList);
    setSelectedGenerators(nList);

    // map sources to drawing sections
    drawingSetup(
      sourceData,
      previewHeight,
      setDrawingSections,
      setSourceToDrawingSectionMap
    );

    // initialize the pending source data
    pendingSourceData.current = [...sourceData];

    // initialize the audiocontext and prepare the room
    // establish the context and realize the room effects
    const ctx: AudioContext = new AudioContext();
    ctx.suspend();
    setAudioContext(ctx);
    initializeRoomEffects(ctx);

  function initializeRoomEffects(ctx: AudioContext) {
    fileContents.equalizer.setContext(ctx);
    fileContents.compressor.setContext(ctx);
    fileContents.volume.setContext(ctx);
    fileContents.reverb.setContext(ctx);

    setConcentrator(
      buildRoomNodes(
        fileContents.compressor,
        fileContents.equalizer,
        fileContents.volume,
        fileContents.reverb,
        ctx
      )
    );

    setAnalyser(
      new SignalLevel(ctx, fileContents.volume.effect as GainNode, FFTSize)
    );

    // initialize the frequency bins
    debug.info("Preview: analyzer connected", fileContents.volume.effect);
    const bins: Float32Array = new Float32Array(FFTSize / 2);
    for (let i = 0; i < bins.length; i++) {
      bins[i] = frequencyForBinIndex(i, ctx.sampleRate, FFTSize);
    }
    setFrequencyBins(bins);
  }

  }, [sourceData, FFTSize, fileContents, previewHeight]);

  // draw the sources when a new previewtimeline and a drawing exists
  useEffect(() => {
    if (previewTimeline.current && drawing) {
      debug.info("Preview: drawing update ");
      DrawSources(
        pendingSourceData.current,
        drawing,
        previewTimeline.current,
        timeProgress,
        drawingSections,
        sourceToDrawingSectionMap,
        displayWidth,
        displayHeight
      );
    }
    // timeProgress is intentionally omitted to avoid infinite loop during playback
  }, [drawing, drawingSections, sourceToDrawingSectionMap, displayWidth, displayHeight]);

  function onExit() {
    setMode(PLAYMODE.idle);
    setRunning(false);
    playing.current = false;
    // paused.current = true;
    if(timerID!=0) clearTimeout(timerID);
    if (tickId != 0) clearTimeout(tickId);
    if (playingId !=0) clearTimeout(playingId);
    if (signalId != 0) clearTimeout(signalId);
    if (audioContext && audioContext.state != "closed") {
      audioContext.close();
    }
    // free up some memory
    setAudioContext(null);
    setDrawing(null);
    activeSources.current = [];
    pendingSourceData.current = [];

    setStatus(`Preview Terminated`)
    return;
  }

  // either start the previewer or exit
  function OnStartStop() {
    if (running) {
      onExit();
      return;
    }

    if (!audioContext) {
      debug.info("Preview: starting preview without an audiocontext");
      return;
    }
    setRunning(true);
    debug.info("Preview: previewing new sourcedata at time", audioContext.currentTime);
    audioContext.resume();

    changeTimerState(
      displayWidth,
      displayHeight,
      footerHeight,
      paused,
      playing,
      tickId,
      playingId,
      signalId,
      timerID,
      offsetTime,
      nextTime,
      playbackLength,
      audioContext,
      concentrator,
      activeSources,
      setActiveSourcesCount,
      pendingSourceData,
      activeGenerators,
      setActiveGeneratorsCount,
      previewTimeline,
      setTimeProgress,
      drawing,
      drawingSections,
      sourceToDrawingSectionMap,
      setSignalLevels,
      analyser,
      frequencyDisplay,
      frequencyBins,
      setLeftVolumes,
      setRightVolumes,
      setLeftMaxes,
      setRightMaxes,
      DrawSources,
      redrawSource,
      onExit,
      fileContents,
    );
  }

  // on a pause, stop the timers
  // on resume, this restarts them
  function onPauseResume() {
    if (!audioContext) {
      debug.error("Preview: no audio context on pause request");
      return;
    }
    if (isPaused) {
      debug.info(
        "Preview: exit from pause at",
        audioContext.currentTime,
        "activeSource count",
        activeSources.current.length,
        "pendingSourceData count",
        pendingSourceData.current.length
      );
      setIsPaused(false);
      paused.current = false;
      audioContext.resume();
    } else {
      debug.info("Preview: enter pause at", audioContext.currentTime);
      setIsPaused(true);
      paused.current = true;
      audioContext.suspend();
    }
    changeTimerState(
      displayWidth,
      displayHeight,
      footerHeight,
      paused,
      playing,
      tickId,
      playingId,
      signalId,
      timerID,
      offsetTime,
      nextTime,
      playbackLength,
      audioContext,
      concentrator,
      activeSources,
      setActiveSourcesCount,
      pendingSourceData,
      activeGenerators,
      setActiveGeneratorsCount,
      previewTimeline,
      setTimeProgress,
      drawing,
      drawingSections,
      sourceToDrawingSectionMap,
      setSignalLevels,
      analyser,
      frequencyDisplay,
      frequencyBins,
      setLeftVolumes,
      setRightVolumes,
      setLeftMaxes,
      setRightMaxes,
      DrawSources,
      redrawSource,
      onExit,
      fileContents,
    );
  }

  function frequencyForBinIndex(
    index: number,
    sampleRate: number,
    FFTSize: number
  ) {
    return Math.log10(((index + 1) * sampleRate) / FFTSize / 2);
  }

  return (
    <div className="preview">
      <Header
        running={running}
        isPaused={isPaused}
        onExit={onExit}
        OnStartStop={OnStartStop}
        onPauseResume={onPauseResume}
      />
      <Timeline previewTimeline={previewTimeline} ticks={ticks} />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="drawing"
        id="drawing"
        width={displayWidth}
        height={previewHeight}
      />
      <Footer
        selectedGenerators={selectedGenerators}
        sourceData={sourceData}
        activeGeneratorsCount={activeGeneratorsCount}
        activeSourcesCount={activeSourcesCount}
        activeGenerators={activeGenerators}
        signalLevels={signalLevels}
        frequencyDisplay={frequencyDisplay}
        frequencyBins={frequencyBins}
        rightVolumes={rightVolumes}
        rightMaxes={rightMaxes}
        leftVolumes={leftVolumes}
        leftMaxes={leftMaxes}
      />
    </div>
  );
}
