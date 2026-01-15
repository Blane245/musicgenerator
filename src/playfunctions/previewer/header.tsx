import CMG2 from "assets/CGM2.svg";
import { useCMGContext } from "cmgcontext";

interface HeaderProps {
  running: boolean;
  isPaused: boolean;
  onExit: ()=>void;
  OnStartStop: ()=>void;
  onPauseResume: ()=>void;
}
export default function Header(props: HeaderProps): JSX.Element {
  const {
    running,
    isPaused,
    onExit,
    OnStartStop,
    onPauseResume,
  } = props;
  const {appName, appVersion, displayWidth, headerHeight, fileContents, fileName } = useCMGContext();
  return (
    <div
      className="preview-header"
      style={{ width: displayWidth, height: headerHeight }}
    >
      <div className="icon">
        <img
          src={CMG2}
          alt="CGM"
          style={{ width: 40, height: 40, margin: "0", padding: "0" }}
        />
      </div>
      <div className="buttons">
        {!running ? (
          <button onClick={() => onExit()} style={{ fontSize: 12 }}>
            Exit
          </button>
        ) : null}
        <button onClick={() => OnStartStop()} style={{ fontSize: 12 }}>
          {running ? "Stop" : "Start"}
        </button>
        {running ? (
          <button onClick={() => onPauseResume()} style={{ fontSize: 12 }}>
            {isPaused ? "Resume" : "Pause"}
          </button>
        ) : null}
      </div>
      <div className="title" style={{ fontWeight: "bold" }}>
        {`${appName}: ${appVersion} (${fileName})${fileContents.dirty ? "*" : ""}`}
      </div>
    </div>
  );
}
