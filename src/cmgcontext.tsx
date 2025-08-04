// the primary context for the CMG application
// it contains attributes that are used by multiple
// components.
// Its use avoids a whole lot of parameter passing between components
import {
  createContext,
  Dispatch,
  MutableRefObject,
  ReactNode,
  SetStateAction,
  useContext,
  useRef,
  useState,
} from "react";
import CMGFile from "./classes/cmgfile";
import TimeLine from "./classes/timeline";
import {
  GENERATIONMODE,
  GeneratorType,
  MouseLocation,
  RawSourceData,
  SOUNDFONTLOCATIONOPTIONS,
  TimelineInterval,
  EditGenerator,
  SignalLevelsType
} from "./types";

// the elements of this application that are used at many levels
interface CMGContextType {
  screenHeight: number;
  setScreenHeight: Dispatch<SetStateAction<number>>;
  screenWidth: number;
  setScreenWidth: Dispatch<SetStateAction<number>>;
  displayWidth: number;
  setDisplayWidth: Dispatch<SetStateAction<number>>;
  displayHeight: number;
  setDisplayHeight: Dispatch<SetStateAction<number>>;
  headerHeight: number;
  setHeaderHeight: Dispatch<SetStateAction<number>>;
  timelineWidth: number;
  setTimelineWidth: Dispatch<SetStateAction<number>>;
  controlWidth: number;
  setControlWidth: Dispatch<SetStateAction<number>>;
  timelineHeight: number;
  setTimelineHeight: Dispatch<SetStateAction<number>>;
  previewHeight: number;
  setPreviewHeight: Dispatch<SetStateAction<number>>;
  previewWidth: number;
  setPreviewWidth: Dispatch<SetStateAction<number>>;
  bodyHeight: number;
  setBodyHeight: Dispatch<SetStateAction<number>>;
  footerHeight: number;
  setFooterHeight: Dispatch<SetStateAction<number>>;
  verticalScrollWidth: number;
  setVerticalScrollWidth: Dispatch<SetStateAction<number>>;
  SFFileLocation: SOUNDFONTLOCATIONOPTIONS;
  setSFFileLocation: Dispatch<SetStateAction<SOUNDFONTLOCATIONOPTIONS>>;
  SFLocalURI: string;
  setSFLocalURI: Dispatch<SetStateAction<string>>;
  SFServerURI: string;
  setSFServerURI: Dispatch<SetStateAction<string>>;
  SFFileList: string[];
  setSFFileList: Dispatch<SetStateAction<string[]>>;
  fileName: string;
  setFileName: Dispatch<SetStateAction<string>>;
  fileContents: CMGFile;
  setFileContents: Dispatch<SetStateAction<CMGFile>>;
  status: string;
  setStatus: Dispatch<SetStateAction<string>>;
  timeLine: TimeLine | null;
  setTimeLine: Dispatch<SetStateAction<TimeLine | null>>;
  playing: MutableRefObject<boolean>;
  mode: GENERATIONMODE;
  setMode: Dispatch<SetStateAction<GENERATIONMODE>>;
  playbackLength: number;
  setPlaybackLength: Dispatch<SetStateAction<number>>;
  offsetTime: number;
  setOffsetTime: Dispatch<SetStateAction<number>>;
  sourceData: RawSourceData[];
  setSourceData: Dispatch<SetStateAction<RawSourceData[]>>;
  timeProgress: number;
  setTimeProgress: Dispatch<SetStateAction<number>>;
  timeInterval: TimelineInterval;
  setTimeInterval: Dispatch<SetStateAction<TimelineInterval>>;
  generatorDialogVisible: boolean;
  setGeneratorDialogVisible: Dispatch<SetStateAction<boolean>>;
  editGeneratorMenuVisible: boolean;
  setEditGeneratorMenuVisible: Dispatch<SetStateAction<boolean>>;
  trackIndex: number;
  setTrackIndex: Dispatch<SetStateAction<number>>;
  editGeneratorData: EditGenerator;
  setEditGeneratorData: Dispatch<SetStateAction<EditGenerator>>;
  mouseDown: MutableRefObject<boolean>;
  mouseLocation: MouseLocation | null;
  setMouseLocation: Dispatch<SetStateAction<MouseLocation | null>>;
  generatorsPlaying: GeneratorType[];
  setGeneratorsPlaying: Dispatch<SetStateAction<GeneratorType[]>>;
  recordFormat: string;
  setRecordFormat: Dispatch<SetStateAction<string>>;
  signalLevels: SignalLevelsType;
  setSignalLevels: Dispatch<SetStateAction<SignalLevelsType>>;
  // generatorType: GENERATORTYPE;
  // setGeneratorType: Dispatch<SetStateAction<GENERATORTYPE>>;
}

const CMGContext = createContext<CMGContextType | undefined>(undefined);

export const CMGProvider = ({ children }: { children: ReactNode }) => {
  const [screenHeight, setScreenHeight] = useState<number>(0);
  const [screenWidth, setScreenWidth] = useState<number>(0);
  const [displayWidth, setDisplayWidth] = useState<number>(0);
  const [displayHeight, setDisplayHeight] = useState<number>(0);
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  const [timelineHeight, setTimelineHeight] = useState<number>(0);
  const [timelineWidth, setTimelineWidth] = useState<number>(0);
  const [controlWidth, setControlWidth] = useState<number>(0);
  const [bodyHeight, setBodyHeight] = useState<number>(0);
  const [previewHeight, setPreviewHeight] = useState<number>(0);
  const [previewWidth, setPreviewWidth] = useState<number>(0);
  const [footerHeight, setFooterHeight] = useState<number>(0);
  const [verticalScrollWidth, setVerticalScrollWidth] = useState<number>(0);
  const [SFFileLocation, setSFFileLocation] =
    useState<SOUNDFONTLOCATIONOPTIONS>(SOUNDFONTLOCATIONOPTIONS.Server);
  const [SFFileList, setSFFileList] = useState<string[]>([]);
  const [SFLocalURI, setSFLocalURI] = useState<string>("");
  const [SFServerURI, setSFServerURI] = useState<string>("");

  const [fileContents, setFileContents] = useState<CMGFile>(new CMGFile());
  const [status, setStatus] = useState<string>("");
  const [timeLine, setTimeLine] = useState<TimeLine | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const playing = useRef<boolean>(false);
  const [mode, setMode] = useState<GENERATIONMODE>(GENERATIONMODE.idle);
  const [playbackLength, setPlaybackLength] = useState<number>(0);
  const [offsetTime, setOffsetTime] = useState<number>(0);
  const [sourceData, setSourceData] = useState<RawSourceData[]>([]);
  const [timeProgress, setTimeProgress] = useState<number>(0);
  const [timeInterval, setTimeInterval] = useState<TimelineInterval>({
    startOffset: -1,
    endOffset: -1,
  });
  const [generatorDialogVisible, setGeneratorDialogVisible] = useState<boolean>(false);
  const [editGeneratorMenuVisible, setEditGeneratorMenuVisible] = useState<boolean>(false);
  const [editGeneratorData, setEditGeneratorData] = useState<EditGenerator>({track: null, generator: null, type: null, newGenerator: false})
  const [trackIndex, setTrackIndex] = useState<number>(-1);
  const mouseDown = useRef<boolean>(false);
  const [mouseLocation, setMouseLocation] = useState<MouseLocation | null>(
    null
  );
  const [generatorsPlaying, setGeneratorsPlaying] = useState<GeneratorType[]>(
    []
  );
  const [recordFormat, setRecordFormat] = useState<string>("mp3");
  const [signalLevels, setSignalLevels] = useState<SignalLevelsType> (
  { leftVolume: -90, rightVolume: -90, leftSpectrum: new Uint8Array(0), rightSpectrum: new Uint8Array(0) });
  // const [generatorType, setGeneratorType] = useState<GENERATORTYPE>(
  //   GENERATORTYPE.Silent
  // );
  const contextValue = {
    screenHeight,
    setScreenHeight,
    screenWidth,
    setScreenWidth,
    displayWidth,
    setDisplayWidth,
    displayHeight,
    setDisplayHeight,
    timelineWidth,
    setTimelineWidth,
    controlWidth,
    setControlWidth,
    headerHeight,
    setHeaderHeight,
    timelineHeight,
    setTimelineHeight,
    previewHeight,
    setPreviewHeight,
    previewWidth,
    setPreviewWidth,
    bodyHeight,
    setBodyHeight,
    footerHeight,
    setFooterHeight,
    verticalScrollWidth,
    setVerticalScrollWidth,
    SFFileLocation,
    setSFFileLocation,
    SFFileList,
    setSFFileList,
    SFLocalURI,
    setSFLocalURI,
    SFServerURI,
    setSFServerURI,
    fileName,
    setFileName,
    fileContents,
    setFileContents,
    status,
    setStatus,
    timeLine,
    setTimeLine,
    playing,
    mode,
    setMode,
    playbackLength,
    setPlaybackLength,
    offsetTime,
    setOffsetTime,
    sourceData,
    setSourceData,
    timeProgress,
    setTimeProgress,
    timeInterval,
    setTimeInterval,
    generatorDialogVisible,
    setGeneratorDialogVisible,
    editGeneratorMenuVisible,
    setEditGeneratorMenuVisible,
    editGeneratorData,
    setEditGeneratorData,
    trackIndex,
    setTrackIndex,
    mouseDown,
    mouseLocation,
    setMouseLocation,
    generatorsPlaying,
    setGeneratorsPlaying,
    recordFormat,
    setRecordFormat,
    signalLevels,
    setSignalLevels,
    // generatorType,
    // setGeneratorType,
  };

  return (
    <CMGContext.Provider value={contextValue}>{children}</CMGContext.Provider>
  );
};

export const useCMGContext = (): CMGContextType => {
  const context = useContext(CMGContext);

  if (context === undefined) {
    throw new Error("useCMGContext must be used within an CMGProvider");
  }

  return context;
};
