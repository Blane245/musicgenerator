import CMGFile from "../classes/cmgfile"
import TimeLine from "../classes/timeline"
import FileMenu from "../components/menus/filemenu"
import TrackMenu from "../components/menus/trackmenu"
import ControlsDisplay from "../components/panels/controlsdisplay"
import { useState } from "react"
import { Message } from "../types/types"

export interface HeaderProps {
    appIcon: string,
    appName: string,
    appVersion: string,
    message: Message,
    setMessage: Function,
    setStatus: Function,
    setFileContents: Function,
    fileContents: CMGFile,
    timeLine: TimeLine,
    setTimeLine: Function,
}

export default function Header(props: HeaderProps) {
    const { appIcon, appName, appVersion, message, setMessage, setStatus, setFileContents, fileContents, timeLine, setTimeLine } = props
    const [fileName, setFileName] = useState<string>('');
    return (
        <>
            <div className="page-icon">
                <img
                    src={appIcon}
                    alt="CGM"
                    style={{ width: 40, height: 40, margin: '0', padding: '0' }}
                />
            </div>
            <div className="page-title">
                <p style={{ fontWeight: "bold" }}>{`${appName}: ${appVersion} (${fileName})`}                    </p>
            </div>
            <div className="page-message">
                <p style={{ fontWeight: "bold" }} color={message.error ? 'red' : 'black'}>{message.text}</p>
            </div>
            <div className="page-menus">
                <FileMenu
                    fileContents={fileContents}
                    setFileContents={setFileContents}
                    setMessage={setMessage}
                    setStatus={setStatus}
                    setFileName={setFileName}
                />
                <TrackMenu
                    fileContents={fileContents}
                    setFileContents={setFileContents}
                    setMessage={setMessage}
                    setStatus={setStatus}
                />
            </div>
            <ControlsDisplay
                fileContents={fileContents}
                setFileContents={setFileContents}
                setTimeLine={setTimeLine}
                timeLine={timeLine}
                setMessage={setMessage}
                setStatus={setStatus}
            />
        </>
    )
}