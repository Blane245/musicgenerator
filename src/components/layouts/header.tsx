import { useCMGContext } from "../../contexts/cmgcontext"
import FileMenu from "../menus/filemenu"
import TrackMenu from "../menus/trackmenu"
import ControlsDisplay from "../panels/controlsdisplay"

export interface HeaderProps {
    appIcon: string,
    appName: string,
    appVersion: string,
}

export default function Header(props: HeaderProps) {
    const { appIcon, appName, appVersion } = props
    const { fileName, message } = useCMGContext();
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
                <p style={{ fontWeight: "bold" }}>{`${appName}: ${appVersion} (${fileName})`} </p>
            </div>
            <div className="page-message">
                <p style=
                    {message.error ?
                        { fontWeight: "bold", color: 'red' }
                        :
                        { fontWeight: "bold", color: 'black' }
                    }
                >{message.text}</p>
            </div>
            <div className="page-menus">
                <FileMenu />
                <TrackMenu />
            </div>
            <ControlsDisplay />
        </>
    )
}