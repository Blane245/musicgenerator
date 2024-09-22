import { Message } from "../types/types"
import FileMenu from "../components/menus/filemenu"
import EditMenu from "../components/menus/editmenu"
import { TrackMenu } from "../components/menus/trackmenu"
import CGMFile from "../classes/cgmfile"
import { AudioPlayerProvider } from "../components/panels/audioplayercontext"
import ControlsDisplay from "../components/panels/controlsdisplay"
import TimeLineDisplay from "../components/panels/timelinedisplay"
import TimeLine from "../classes/timeline"

export interface HeaderProps {
    appIcon: string,
    appName: string,
    appVersion: string,
    message: Message,
    setMessage: Function,
    setStatus: Function,
    setFileContents: Function,
    fileContents: CGMFile | null,
    timeLine: TimeLine,
    setTimeLine: Function,
}

export default function Header(props: HeaderProps) {
    const { appIcon, appName, appVersion, message, setMessage, setStatus, setFileContents, fileContents, timeLine, setTimeLine } = props

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
                    <p style={{ fontWeight: "bold" }}>{appName + ":" + appVersion}                    </p>
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
                    />

                    <EditMenu
                        fileContents={fileContents}
                        setFileContents={setFileContents}
                        setMessage={setMessage}
                        setStatus={setStatus}
                    />
                    <TrackMenu
                        selectedTrack={null}
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