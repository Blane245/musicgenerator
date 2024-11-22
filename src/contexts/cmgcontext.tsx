import CMGFile from "../classes/cmgfile";
import TimeLine from "../classes/timeline";
import { createContext, Dispatch, ReactNode, RefObject, SetStateAction, useContext, useRef, useState } from "react";
import { CMGeneratorType, TimelineInterval } from "../types/types";
import { Preset } from "../types/soundfonttypes";

// the elements of this application that are used at many levels
interface CMGContextType {
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
    playing: RefObject<{on:boolean}>;
    timeProgress: number;
    setTimeProgress: Dispatch<SetStateAction<number>>;
    timeInterval: TimelineInterval;
    setTimeInterval: Dispatch<SetStateAction<TimelineInterval>>;
    mouseDown: boolean;
    setMouseDown: Dispatch<SetStateAction<boolean>>;
    generatorsPlaying: CMGeneratorType[];
    setGeneratorsPlaying: Dispatch<SetStateAction<CMGeneratorType[]>>;
}

const CMGContext = createContext<CMGContextType | undefined>(undefined);

export const CMGProvider = ({ children, }: { children: ReactNode }) => {
    const [fileContents, setFileContents] = useState<CMGFile>(new CMGFile());
    const [status, setStatus] = useState<string>('')
    const [timeLine, setTimeLine] = useState<TimeLine>(new TimeLine(0, 0));
    const [fileName, setFileName] = useState<string>('');

    const [presets, setPresets] = useState<Preset[]>([]);
    const playing = useRef<{on:boolean}>({on:false});
    const [timeProgress, setTimeProgress] = useState<number>(0);
    const [timeInterval, setTimeInterval] = useState<TimelineInterval>({startOffset: -1, endOffset: -1});
    const [mouseDown, setMouseDown] = useState(false);
    const [generatorsPlaying, setGeneratorsPlaying] = useState<CMGeneratorType[]>([]);
    const contextValue = {
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
        <CMGContext.Provider value={contextValue}>
            {children}
        </CMGContext.Provider>
    );
};

export const useCMGContext = (): CMGContextType => {
    const context = useContext(CMGContext);

    if (context === undefined) {
        throw new Error(
            'useCMGContext must be used within an CMGProvider'
        );
    }

    return context;
}
