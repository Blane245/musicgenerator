// The CMG Header containing the log, title, file menu, and file-level controls
import { MutableRefObject, useEffect, useRef, useState } from "react";
// @ts-ignore
import CMG2 from "../assets/CGM2.svg";
import { useCMGContext } from "../cmgcontext";
import FileMenu from "../menus/filemenu";
import EditMenu from "../menus/editmenu";
import TimeLineDisplay from "../panels/timelinedisplay";
import TimeLineControlsDisplay from "../panels/timelinecontrolsdisplay";
import GenerateMenu from "../menus/generatemenu";
import HelpMenu from "../menus/helpmenu";

export interface HeaderProps {
  appName: string;
  appVersion: string;
}

export default function Header(props: HeaderProps) {
  const { appName, appVersion } = props;
  const { screenWidth, fileName, fileContents, signalLevels } = useCMGContext();
  const [isDirty, setIsDirty] = useState("");
  const [width, setWidth] = useState<number>(screenWidth);
  const [signals, setSignals] = useState<{left: number, right: number}>({left: 0, right: 0});
  const timeLineRef: MutableRefObject<HTMLDivElement[]> = useRef<
    HTMLDivElement[]
  >([]);
  useEffect(() => {
    setWidth(screenWidth);
  }, [screenWidth]);

  useEffect(() => {
    setIsDirty(fileContents.dirty ? "*" : "");
  }, [fileContents]);

  useEffect(() => {
    setSignals({left: signalLevels.left, right: signalLevels.right})
  },[signalLevels]);

  return (
    <>
      <div className="header" style={{ width: width }}>
        <div className="icon">
          <img
            src={CMG2}
            alt="CGM"
            style={{ width: 60, height: 60, margin: "0", padding: "0" }}
          />
        </div>
        <div className="title">
          <p style={{ fontWeight: "bold" }}>
            {`${appName}: ${appVersion} (${fileName})${isDirty}`}{" "}
          </p>
        </div>
        <div className="menu">
          <FileMenu />
          <EditMenu />
          <GenerateMenu />
          <HelpMenu />
        </div>
        <div className="left">
          <input type="range" readOnly value={signals.left} min={-90} max={0} ></input>
        </div>
        <div className="right">
          <input type="range" readOnly value={signals.right} min={-90} max={0}></input>
        </div>
        <div className="time-control">
          <TimeLineControlsDisplay />
        </div>
        <div
          className="time-timeline"
          ref={(el: HTMLDivElement) => {
            timeLineRef.current[0] = el;
            return el;
          }}
        >
          <TimeLineDisplay timeLineRef={timeLineRef} />
        </div>
      </div>
    </>
  );
}
