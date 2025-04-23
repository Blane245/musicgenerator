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
import { GeneratorType, SOUNDFONTLOCATIONOPTIONS, TimelineInterval } from "./types";

// the elements of this application that are used at many levels
interface CMGContextType {
  screenHeight: number;
  setScreenHeight: Dispatch<SetStateAction<number>>;
  screenWidth: number;
  setScreenWidth: Dispatch<SetStateAction<number>>;
  bodyHeight: number;
  setBodyHeight: Dispatch<SetStateAction<number>>;
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
  timeLine: TimeLine;
  setTimeLine: Dispatch<SetStateAction<TimeLine>>;
  playing: MutableRefObject<boolean>;
  timeProgress: number;
  setTimeProgress: Dispatch<SetStateAction<number>>;
  timeInterval: TimelineInterval;
  setTimeInterval: Dispatch<SetStateAction<TimelineInterval>>;
  mouseDown: boolean;
  setMouseDown: Dispatch<SetStateAction<boolean>>;
  generatorsPlaying: GeneratorType[];
  setGeneratorsPlaying: Dispatch<SetStateAction<GeneratorType[]>>;
  recordFormat: string;
  setRecordFormat: Dispatch<SetStateAction<string>>;
  signalLevels: {left: number, right: number};
  setSignalLevels: Dispatch<SetStateAction<{left: number, right: number}>>;
}

const CMGContext = createContext<CMGContextType | undefined>(undefined);

export const CMGProvider = ({ children }: { children: ReactNode }) => {
  const [screenHeight, setScreenHeight] = useState<number>(0);
  const [screenWidth, setScreenWidth] = useState<number>(0);
  const [bodyHeight, setBodyHeight] = useState<number>(0);
  const [verticalScrollWidth, setVerticalScrollWidth] = useState<number>(0);
  const [SFFileLocation, setSFFileLocation] = useState<SOUNDFONTLOCATIONOPTIONS>(SOUNDFONTLOCATIONOPTIONS.Server);
  const [SFFileList, setSFFileList] = useState<string[]>([]);
  const [SFLocalURI, setSFLocalURI] = useState<string>("");
  const [SFServerURI, setSFServerURI] = useState<string>("");

  const [fileContents, setFileContents] = useState<CMGFile>(new CMGFile());
  const [status, setStatus] = useState<string>("");
  const [timeLine, setTimeLine] = useState<TimeLine>(new TimeLine(0, 0));
  const [fileName, setFileName] = useState<string>("");

  const playing = useRef<boolean>(false);
  const [timeProgress, setTimeProgress] = useState<number>(0);
  const [timeInterval, setTimeInterval] = useState<TimelineInterval>({
    startOffset: -1,
    endOffset: -1,
  });
  const [mouseDown, setMouseDown] = useState(false);
  const [generatorsPlaying, setGeneratorsPlaying] = useState<GeneratorType[]>(
    []
  );
  const [recordFormat, setRecordFormat] = useState<string>("mp3");
  const [signalLevels, setSignalLevels] = useState<{left: number, right: number}>({left:-90,right:-90});
  const contextValue = {
    screenHeight,
    setScreenHeight,
    screenWidth,
    setScreenWidth,
    bodyHeight,
    setBodyHeight,
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
    timeProgress,
    setTimeProgress,
    timeInterval,
    setTimeInterval,
    mouseDown,
    setMouseDown,
    generatorsPlaying,
    setGeneratorsPlaying,
    recordFormat,
    setRecordFormat,
    signalLevels,
    setSignalLevels,
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
