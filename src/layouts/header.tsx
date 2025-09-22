// The CMG Header containing the log, title, file menu, and file-level controls
import CMG2 from "assets/CGM2.svg";
import { useCMGContext } from "cmgcontext";
import EditMenu from "menus/editmenu";
import FileMenu from "menus/filemenu";
import HelpMenu from "menus/helpmenu";
import PlayMenu from "menus/playmenu";
import ToolsMenu from "menus/toolsmenu";
import TimeLineControls from "panels/timelinecontrols";
import TimeLineDisplay from "panels/timelinedisplay";
import { useEffect, useState } from "react";

export interface HeaderProps {
  appName: string;
  appVersion: string;
}

export default function Header(props: HeaderProps) {
  const { appName, appVersion } = props;
  const { fileName, fileContents, displayWidth, timelineWidth, controlWidth } =
    useCMGContext();
  const [isDirty, setIsDirty] = useState("");

  useEffect(() => {
    setIsDirty(fileContents.dirty ? "*" : "");
  }, [fileContents]);

  return (
    <>
      <div className="header" style={{ width: displayWidth }}>
        <div className="icon">
          <img
            src={CMG2}
            alt="CGM"
            style={{ width: 40, height: 40, margin: "0", padding: "0" }}
          />
        </div>
        <div className="menu">
          <div className="file">
            <FileMenu />
          </div>
          <div className="edit">
            <EditMenu />
          </div>
          <div className="tools">
            <ToolsMenu />
          </div>
          <div className="play">
            <PlayMenu />
          </div>
          <div className="help">
            <HelpMenu />
          </div>
        </div>
        <div className="title" style={{ fontWeight: "bold" }}>
          {`${appName}: ${appVersion} (${fileName})${isDirty}`}
        </div>
      </div>
      <div className="timeline" style={{ width: displayWidth }}>
        <div className="control" style={{ width: controlWidth }}>
          <TimeLineControls />
        </div>
        <div className="display" style={{ width: timelineWidth }}>
          <TimeLineDisplay />
        </div>
      </div>
    </>
  );
}
