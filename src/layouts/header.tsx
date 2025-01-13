// The CMG Header containing the log, title, file menu, and file-level controls
import { useEffect, useState } from "react";
// @ts-ignore
import CMG2 from "../assets/CGM2.svg";
import { useCMGContext } from "../cmgcontext";
import FileMenu from "../menus/filemenu";
import ControlsDisplay from "../panels/controlsdisplay";

export interface HeaderProps {
  appName: string;
  appVersion: string;
}

export default function Header(props: HeaderProps) {
  const { appName, appVersion } = props;
  const { fileName, fileContents } = useCMGContext();
  const [isDirty, setIsDirty] = useState("");
  useEffect(() => {
    setIsDirty(fileContents.dirty ? "*" : "");
  }, [fileContents]);
  return (
    <>
      <div className="page-header">
        <div className="page-grid">
          <div className="page-icon">
            <img
              src={CMG2}
              alt="CGM"
              style={{ width: 60, height: 60, margin: "0", padding: "0" }}
            />
          </div>
          <div className="page-title">
            <p style={{ fontWeight: "bold" }}>
              {`${appName}: ${appVersion} (${fileName})${isDirty}`}{" "}
            </p>
          </div>
          <div className="page-menus">
            <FileMenu />
          </div>
          <ControlsDisplay />
        </div>
      </div>
    </>
  );
}
