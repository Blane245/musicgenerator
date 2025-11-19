// invoke the various timers changes are made to running and paused

import {
  ActiveSource,
  DrawingSection,
  RawSourceData,
  SignalLevelsType,
  SourceToDrawingSectionEntry,
} from "types";
import { playingGenerators } from "./playingGenerators";
import scheduler from "./scheduler";
import signalMonitor from "./signalmonitor";
import tick from "./tick";
import TimeLine from "classes/timeline";
import SignalLevel from "classes/signallevel";
import {signalWidth} from "./footer"

export default function changeTimerState(
  displayWidth: number,
  displayHeight: number,
  footerHeight: number,
  paused: React.MutableRefObject<boolean>,
  playing: React.MutableRefObject<boolean>,
  tickId: number,
  playingId: number,
  signalId: number,
  timerID: number,
  offsetTime: number,
  nextTime: number,
  playbackLength: number,
  audioContext: AudioContext,
  concentrator: GainNode | null,
  activeSources: React.MutableRefObject<ActiveSource[]>,
  setActiveSourcesCount: React.Dispatch<React.SetStateAction<number>>,
  pendingSourceData: React.MutableRefObject<RawSourceData[]>,
  activeGenerators: React.MutableRefObject<string[]>,
  setActiveGeneratorsCount: React.Dispatch<React.SetStateAction<number>>,
  previewTimeline: React.MutableRefObject<TimeLine | null>,
  setTimeProgress: React.Dispatch<React.SetStateAction<number>>,
  drawing: HTMLElement | null,
  drawingSections: DrawingSection[],
  sourceToDrawingSectionMap: SourceToDrawingSectionEntry[],
  setSignalLevels: React.Dispatch<React.SetStateAction<SignalLevelsType>>,
  analyser: SignalLevel | null,
  frequencyDisplay: string,
  frequencyBins: Float32Array<ArrayBufferLike>,
  setLeftVolumes: React.Dispatch<React.SetStateAction<string>>,
  setRightVolumes: React.Dispatch<React.SetStateAction<string>>,
  setLeftMaxes: React.Dispatch<React.SetStateAction<string>>,
  setRightMaxes: React.Dispatch<React.SetStateAction<string>>,
  DrawSources: Function,
  redrawSource: Function,
  onExit: Function,
) {
  tick(
    paused,
    playing,
    tickId,
    audioContext,
    playbackLength,
    previewTimeline,
    offsetTime,
    pendingSourceData,
    drawing,
    DrawSources,
    drawingSections,
    sourceToDrawingSectionMap,
    setTimeProgress,
    displayWidth,
    displayHeight
  );
  // generator highlighter running every 1/2 seconds
  playingGenerators(
    paused,
    playing,
    playingId,
    audioContext,
    playbackLength,
    activeSources,
    activeGenerators,
    setActiveGeneratorsCount
  );
  // volume level monitor running every 1/2 second
  signalMonitor(
    paused,
    playing,
    signalId,
    audioContext,
    playbackLength,
    setSignalLevels,
    analyser,
    frequencyDisplay,
    signalWidth,
    footerHeight,
    setLeftVolumes,
    setRightVolumes,
    setLeftMaxes,
    setRightMaxes,
    frequencyBins
  );
  scheduler(
    paused,
    playing,
    timerID,
    audioContext,
    playbackLength,
    onExit,
    concentrator,
    activeSources,
    previewTimeline,
    nextTime,
    pendingSourceData,
    offsetTime,
    redrawSource,
    setActiveSourcesCount
  );
}
