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
import { Preset } from "./sfcomponents/types";
import { GeneratorType, TimelineInterval } from "./types";

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
  fileName: string;
  setFileName: Dispatch<SetStateAction<string>>;
  fileContents: CMGFile;
  setFileContents: Dispatch<SetStateAction<CMGFile>>;
  status: string;
  setStatus: Dispatch<SetStateAction<string>>;
  timeLine: TimeLine;
  setTimeLine: Dispatch<SetStateAction<TimeLine>>;
  presets: Preset[];
  setPresets: Dispatch<SetStateAction<Preset[]>>;
  playing: MutableRefObject<boolean>;
  timeProgress: number;
  setTimeProgress: Dispatch<SetStateAction<number>>;
  timeInterval: TimelineInterval;
  setTimeInterval: Dispatch<SetStateAction<TimelineInterval>>;
  mouseDown: boolean;
  setMouseDown: Dispatch<SetStateAction<boolean>>;
  generatorsPlaying: GeneratorType[];
  setGeneratorsPlaying: Dispatch<SetStateAction<GeneratorType[]>>;
}

const CMGContext = createContext<CMGContextType | undefined>(undefined);

export const CMGProvider = ({ children }: { children: ReactNode }) => {
  const [screenHeight, setScreenHeight] = useState<number>(0);
  const [screenWidth, setScreenWidth] = useState<number>(0);
  const [bodyHeight, setBodyHeight] = useState<number>(0);
  const [verticalScrollWidth, setVerticalScrollWidth] = useState<number>(0);
  const [fileContents, setFileContents] = useState<CMGFile>(new CMGFile());
  const [status, setStatus] = useState<string>("");
  const [timeLine, setTimeLine] = useState<TimeLine>(new TimeLine(0, 0));
  const [fileName, setFileName] = useState<string>("");

  const [presets, setPresets] = useState<Preset[]>([]);
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
  const contextValue = {
    screenHeight,
    setScreenHeight,
    screenWidth,
    setScreenWidth,
    bodyHeight,
    setBodyHeight,
    verticalScrollWidth,
    setVerticalScrollWidth,
    fileName,
    setFileName,
    fileContents,
    setFileContents,
    status,
    setStatus,
    timeLine,
    setTimeLine,
    presets,
    setPresets,
    playing,
    timeProgress,
    setTimeProgress,
    timeInterval,
    setTimeInterval,
    mouseDown,
    setMouseDown,
    generatorsPlaying,
    setGeneratorsPlaying,
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
