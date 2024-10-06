import CMGFile from "../classes/cmgfile";
import TimeLine from "../classes/timeline";
import { createContext, Dispatch, ReactNode, RefObject, SetStateAction, useContext, useRef, useState } from "react";
import { Message } from "../types/types";
import { Preset } from "types/soundfonttypes";

// the elements of this application that are used at many levels
interface CMGContextType {
    fileName: string;
    setFileName: Dispatch<SetStateAction<string>>;
    fileContents: CMGFile;
    setFileContents: Dispatch<SetStateAction<CMGFile>>;
    message: Message;
    setMessage: Dispatch<SetStateAction<Message>>;
    status: string;
    setStatus: Dispatch<SetStateAction<string>>;
    timeLine: TimeLine;
    setTimeLine: Dispatch<SetStateAction<TimeLine>>;
    presets: Preset[];
    setPresets: Dispatch<SetStateAction<Preset[]>>;

    // integrated from audioplayercontext
    currentTrack: string;
    setCurrentTrack: Dispatch<SetStateAction<string>>;
    timeProgress: number;
    setTimeProgress: Dispatch<SetStateAction<number>>;
    duration: number;
    setDuration: Dispatch<SetStateAction<number>>;
    audioRef: RefObject<HTMLAudioElement>;
    progressBarRef: RefObject<HTMLInputElement>;
    isPlaying: boolean;
    setIsPlaying: Dispatch<SetStateAction<boolean>>;

}

const CMGContext = createContext<CMGContextType | undefined>(undefined);

export const CMGProvider = ({ children, }: { children: ReactNode }) => {
    const [fileContents, setFileContents] = useState<CMGFile>(new CMGFile());
    const [message, setMessage] = useState<Message>({ error: false, text: 'Welcome' });
    const [status, setStatus] = useState<string>('')
    const [timeLine, setTimeLine] = useState<TimeLine>(new TimeLine(0, 0));
    const [currentTrack, setCurrentTrack] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');

    //audiocontext
    const [presets, setPresets] = useState<Preset[]>([]);
    const [timeProgress, setTimeProgress] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const progressBarRef = useRef<HTMLInputElement>(null);

    const contextValue = {
        fileName,
        setFileName,
        fileContents,
        setFileContents,
        message,
        setMessage,
        status,
        setStatus,
        timeLine,
        setTimeLine,
        presets,
        setPresets,
// audiocontext
        currentTrack,
        setCurrentTrack,
        audioRef,
        progressBarRef,
        timeProgress,
        setTimeProgress,
        duration,
        setDuration,
        isPlaying,
        setIsPlaying,
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
