import { useEffect, useState } from "react"
import { useCMGContext } from "../../contexts/cmgcontext"
import FileMenu from "../menus/filemenu"
import TrackMenu from "../menus/trackmenu"
import ControlsDisplay from "../panels/controlsdisplay"
import CMG2 from '../../images/CGM2.svg'

export interface HeaderProps {
    appName: string,
    appVersion: string,
}

export default function Header(props: HeaderProps) {
    const { appName, appVersion } = props
    const { fileName, fileContents } = useCMGContext();
    const [isDirty, setIsDirty] = useState('');
    useEffect(() => {
        setIsDirty(fileContents.dirty? '*':'');
    }, [fileContents])
    return (
        <>
            <div className="page-icon">
                <img
                    src={CMG2}
                    alt="CGM"
                    style={{ width: 60, height: 60, margin: '0', padding: '0' }}
                />
            </div>
            <div className="page-title">
                <p style={{ fontWeight: "bold" }}>{`${appName}: ${appVersion} (${fileName})${isDirty}`} </p>
            </div>
            <div className="page-menus">
                <FileMenu />
                <TrackMenu />
            </div>
            <ControlsDisplay />
        </>
    )
}