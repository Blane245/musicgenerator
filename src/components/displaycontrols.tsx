//  display the control components that are visible on the timeline.
//  create their mouse event handlers, which will bring up a menu to
//  select the control to edit or delete

import Control from "classes/control";
import TimeLine from "classes/timeline";
import { useCMGContext } from "cmgcontext";
import ControlDialog from "dialogs/control/controldialog";
import { MouseEvent, useEffect, useState } from "react";
import {
  AiFillCaretDown,
  AiOutlineDown
} from "react-icons/ai";
import { TimeLineScales } from "types";

// set the icon to a carat if only one control is present at the time
// other set the icon to a filled carat. The carat need to point to the
// list of associated controls

interface DisplayControlsProps {
  timeLine: TimeLine;
}

export default function DisplayControls(
  props: DisplayControlsProps
): JSX.Element {
  const { timeLine } = props;
  const {
    headerHeight,
    controlWidth,
    timelineWidth,
    fileContents,
    setDisplayControlDialog,
    displayControlDialog,
  } = useCMGContext();
  const [ctlLists, setCtlLists] = useState<Record<string, string[]>>({});
  const [controlMenu, setControlMenu] = useState<boolean>(false);
  const [ctlList, setCtlList] = useState<string[]>([]);
  const [editCtl, setEditCtl] = useState<Control | undefined>(undefined);

  // build the list of control icons based on time
  useEffect(() => {
    // console.log("displaycontrols: new controls");
    // debugger;
    const lists: Record<string, string[]> = {};
    let timeKey: string = "";
    for (let i = 0; i < fileContents.controls.length; i++) {
      const c: Control = fileContents.controls[i];
      if (
        c.time >= timeLine.startTime &&
        c.time <=
          TimeLineScales[timeLine.currentZoomLevel].extent + timeLine.startTime
      ) {
        if (i == 0 || c.time != fileContents.controls[i - 1].time) {
          timeKey = c.time.toFixed(2);
          lists[timeKey] = [];
          // console.log(
          //   "displaycontrols: starting new list at time, lists, nlists",
          //   c.time,
          //   lists
          // );
        }
        lists[timeKey].push(c.name);
        // console.log(
        //   "displaycontrols: added name to new list, lists, nLists",
        //   c.name,
        //   lists
        // );
      }
    }
    setCtlLists(lists);
  }, [fileContents.controls, timeLine.currentZoomLevel, timeLine.startTime]);
  function handleEditControl(event: MouseEvent, name: string): void {
    event.preventDefault();
    event.stopPropagation();
    setEditCtl(fileContents.controls.find((c) => c.name == name));
    setControlMenu(false);
    setDisplayControlDialog(true);
  }
  function handleSelectControl(event: MouseEvent, list: string[]): void {
    event.preventDefault();
    event.stopPropagation();
    setControlMenu(true);
    setCtlList(list);
  }

  const timeToPosition = (key: string): string => {
    const time: number = parseFloat(key);
    const position: number =
      controlWidth +
      ((time - timeLine.startTime) * timelineWidth) /
        TimeLineScales[timeLine.currentZoomLevel].extent;
    return (position - 15).toString().concat("px");
  };
  const controlCaret = (): string => {
    return (2*headerHeight / 3).toString().concat("px");
  };
  return (
    <>
      {Object.keys(ctlLists).map((key: string, i) =>
        ctlLists[key].length == 1 ? (
          <button
            className="control-button"
            id={`control-btn:${i}`}
            key={`control-btn:${i}`}
            onClick={(event) => handleEditControl(event, ctlLists[key][0])}
            style={{
              position: "absolute",
              background: "none",
              left: timeToPosition(key),
              top: controlCaret(),
            }}
          >
            <AiOutlineDown />
          </button>
        ) : (
          <button
            className="control-button"
            id={`control-btn:${i}`}
            key={`control-btn:${i}`}
            onClick={(event) => handleSelectControl(event, ctlLists[key])}
            style={{
              position: "absolute",
              background: "none",
              left: timeToPosition(key),
              top: controlCaret(),
            }}
          >
            <AiFillCaretDown />
          </button>
        )
      )}
      {!!controlMenu && (
        <>
          <div
            className="navbar"
            style={{
              position: "relative",
              top: "0px",
              visibility: "hidden",
            }}
          >
            <div
              className="dropdown"
              style={{
                visibility: "visible",
                zIndex: "99"
              }}
            >
              <div className="dropbtn">
                Select Control
                <i className="fa fa-caret-down" />
              </div>
              <div className="dropdown-one">
                {ctlList.map((name: string, i) => (
                  <div
                    className="dItem"
                    key={`controllist:${i}`}
                    onClick={(e) => handleEditControl(e, name)}
                  >
                    {name}
                  </div>
                ))}
                <div className="dItem" onClick={() => setControlMenu(false)}>
                  Exit
                </div>
              </div>
            </div>
          </div>
          {/* </div> */}
        </>
      )}
      {!!(displayControlDialog && editCtl != undefined) && (
        <ControlDialog control={editCtl} tracks={fileContents.tracks} />
      )}
    </>
  );
}
