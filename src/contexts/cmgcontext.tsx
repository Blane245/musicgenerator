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
    playing: RefObject<{on:boolean}>;
    timeProgress: number;
    setTimeProgress: Dispatch<SetStateAction<number>>;
}

const CMGContext = createContext<CMGContextType | undefined>(undefined);

export const CMGProvider = ({ children, }: { children: ReactNode }) => {
    const [fileContents, setFileContents] = useState<CMGFile>(new CMGFile());
    const [message, setMessage] = useState<Message>({ error: false, text: 'Welcome' });
    const [status, setStatus] = useState<string>('')
    const [timeLine, setTimeLine] = useState<TimeLine>(new TimeLine(0, 0));
    const [fileName, setFileName] = useState<string>('');

    const [presets, setPresets] = useState<Preset[]>([]);
    const playing = useRef<{on:boolean}>({on:false});
    const [timeProgress, setTimeProgress] = useState<number>(0);

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
        playing,
        timeProgress,
        setTimeProgress,
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
