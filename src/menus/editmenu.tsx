// The file menu handles creating new files, opening existing ones,
// saving current ones, and adding tracks to current ones
// import Algorithmic from "classes/generators";
import Control from "classes/control";
import TimeLine from "classes/timeline";
import Track from "classes/track";
import { useCMGContext } from "cmgcontext";
import ControlDialog from "dialogs/control/controldialog";
import { ChangeEvent, FormEvent, useState } from "react";
import {
  PREVIEWFFTSIZE,
  PREVIEWFREQUENCYDISPLAY,
  RECORDFORMAT,
  SFFILELOCATION,
  TIMELINETYPE
} from "types";
import { addTrack, setDirty, setFileComment } from "utils/cmfiletransactions";
import { getControlUID } from "utils/getcontroluid";
import { getDirectoryList } from "utils/getdirectorylist";
import { getTrackUID } from "utils/gettrackuid";

export default function EditMenu() {
  const {
    setSFLocalDirectory,
    fileContents,
    setFileContents,
    timelineWidth,
    timelineHeight,
    timeLine,
    setTimeLine,
    controlNew,
    setControlNew,
    displayControlDialog,
    setDisplayControlDialog,
    setStatus,
    setRecordFormat,
    setSFFileList,
    playing,
    recordFormat,
    SFLocalDirectory,
    FFTSize,
    setFFTSize,
    frequencyDisplay,
    setFrequencyDisplay,
  } = useCMGContext();
  const [comment, setComment] = useState<string>("");
  const [commentModal, setCommentModal] = useState<boolean>(false);
  const [preferencesModal, setPreferencesModal] = useState<boolean>(false);
  const [errorMsgs, setErrorMsgs] = useState<string[]>([]);
  const [formData, setFormData] = useState<TimeLine>(
    new TimeLine(timelineWidth, timelineHeight)
  );

  // useEffect(() => {
  //   if (SFFileList.length == 0) return;
  //   // check if any generators are using a soundfont file that does not
  //   // exist in the new directory
  //   const errors: string[] = [];
  //   const found: Track | undefined = fileContents.tracks.find(
  //     (t) =>
  //       t.generators.find(
  //         (g) =>
  //           (g.type == GENERATORTYPE.Algorithmic &&
  //             SFFileList.find((f) => (g as Algorithmic).soundFontFile == f)) ||
  //           g.type != GENERATORTYPE.Algorithmic
  //       ) != undefined
  //   );
  //   if (found != undefined)
  //     errors.push(
  //       `The current composition contains a generator that uses a soundfont file that is not it this directory.`
  //     );
  //   setErrorMsgs(errors);
  // }, [SFFileList, fileContents.tracks]);

  function handleEditComment() {
    setCommentModal(true);
  }

  function handleNewComment() {
    const elem: HTMLElement | null = document.getElementById("file-comment");
    if (elem) {
      setFileComment((elem as HTMLInputElement).value, setFileContents);
      setCommentModal(false);
    }
  }
  function handleCommentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setComment(e.currentTarget.value);
  }

  // handle request to add a new track.
  function handleNewTrack() {
    // find a track number that is unique, start wiith the next number
    const next = getTrackUID(fileContents.tracks);

    // create a track with this UID;
    const newTrack = new Track(next);
    // and added to the file
    addTrack(newTrack, setFileContents);
    setStatus(`Track '${newTrack.name}' Added`);
  }

  function handleNewControl() {
    // get a unique name for the new control
    const uid: number = getControlUID(fileContents.controls);
    setControlNew(new Control(uid));
    setDisplayControlDialog(true);
  }

  function handleEditPreferences() {
    if (!timeLine) return;
    setErrorMsgs([]);
    setFormData(timeLine.copy());
    setPreferencesModal(true);
  }

  function handlePreferencesSubmit(event: FormEvent<Element>): void {
    event.preventDefault();
    event.stopPropagation();

    const newErrors: string[] = [];
    // get the form values
    let location: string = event.target["SFLocalDirectory"].value;
    const format: string = event.target["recordFormat"].value;

    // check the format for with 'mp3' or 'wav'
    if (["mp3", "wav"].indexOf(format) < 0) {
      newErrors.push(`${format} is not a valid recording format`);
    }

    // check if the soundfont file location has changed
    const newSFFileList: { list: string[]; error: string } = {
      list: [],
      error: "",
    };

    try {
      location = location.replace(/\\/g, "/");
      getDirectoryList(location, ["sf2", "SF2"], setSFFileList, setStatus);
    } catch (e) {
      newErrors.push(e as string);
    }

    setErrorMsgs(newErrors);
    if (newErrors.length != 0) return;

    // update the react hooks and local storage
    setRecordFormat(format);
    window.localStorage.setItem(RECORDFORMAT, format);
    setSFLocalDirectory(location);
    window.localStorage.setItem(SFFILELOCATION, location);
    setSFFileList(newSFFileList.list);
    setTimeLine(formData.copy());
    const newFFTSize:number = parseInt(event.target["FFTSize"].value);
    setFFTSize(newFFTSize);
    window.localStorage.setItem(PREVIEWFFTSIZE, newFFTSize.toString());
    const newDisplay:string = event.target["frequencyDisplay"].value;
    setFrequencyDisplay(newDisplay);
    window.localStorage.setItem(PREVIEWFREQUENCYDISPLAY, newDisplay);
    setDirty(true, fileContents, setFileContents);

    // disable the preferences modal
    setPreferencesModal(false);
  }
  function handleMenuSelect(action: string) {
    if (playing.current) return;
    switch (action) {
      case "comment":
        handleEditComment();
        break;
      case "track":
        handleNewTrack();
        break;
      case "control":
        handleNewControl();
        break;
      case "preferences":
        handleEditPreferences();
        break;
      default:
        break;
    }
  }

  // handle changes to the time line preferences
  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void {
    const eventName: string | null = e.target["name"];
    const eventValue: string = e.target["value"];
    if (!eventName || !eventValue) return;
    setFormData((prev: TimeLine) => {
      const nf: TimeLine = prev.copy();
      nf.setAttribute(eventName, eventValue);
      return nf;
    });
  }

  function handleSnapChange(): void {
    setFormData((prev: TimeLine) => {
      const nf: TimeLine = prev.copy();
      nf.setAttribute("snap", prev.snap ? "false" : "true");
      return nf;
    });
  }
  return (
    <>
      <div className="navbar">
        <div className="dropdown">
          <div className="dropbtn">
            Edit
            <i className="fa fa-caret-down"></i>
          </div>
          <div className="dropdown-one">
            <div className="dItem" onClick={() => handleMenuSelect("track")}>
              Add Track
            </div>
            <div className="dItem" onClick={() => handleMenuSelect("control")}>
              Add Control
            </div>
            <div className="dItem" onClick={() => handleMenuSelect("comment")}>
              Edit Comment...
            </div>
            <div
              className="dItem"
              onClick={() => handleMenuSelect("preferences")}
            >
              Edit Preferences...
            </div>
          </div>
        </div>
      </div>

      {commentModal ? (
        <div className="modal-content">
          <div className="modal-header">
            <h2> Enter comment for '{fileContents.name}'</h2>
          </div>
          <div className="modal-body">
            <textarea
              name="file-comment"
              id="file-comment"
              rows={10}
              cols={30}
              value={comment}
              onChange={(e) => handleCommentChange(e)}
            />
            <br />
          </div>
          <div className="modal-footer">
            <button onClick={() => handleNewComment()}>Submit</button>
            <button onClick={() => setCommentModal(false)}>Cancel</button>
          </div>
        </div>
      ) : null}
      {preferencesModal ? (
        <div className="modal-content">
          <div className="modal-header">
            <h2> Edit Preferences</h2>
          </div>
          <div className="modal-body">
            <form onSubmit={handlePreferencesSubmit}>
              <label>
                Soundfont Directory:&nbsp;
                <input
                  type="text"
                  size={50}
                  name="SFLocalDirectory"
                  defaultValue={SFLocalDirectory}
                  style={{ marginBottom: "2px" }}
                />
              </label>
              <br />
              <label>
                Record Format:&nbsp;
                <select
                  id="recordFormat"
                  name="recordFormat"
                  defaultValue={recordFormat}
                >
                  <option value="mp3">mp3</option>
                  <option value="wav">wav</option>
                </select>
              </label>
              <hr />
              <label>
                Time Line Mode:&nbsp;
                <select
                  id="mode"
                  name="mode"
                  value={formData.mode}
                  onChange={handleChange}
                >
                  <option value="Time">Time</option>
                  <option value="Measure">Measure</option>
                </select>
              </label>
              <br />
              <div><b>Measure Definition</b></div><br/>
              <label>
                Measure Length:&nbsp;
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  max={1000}
                  name="measureSize"
                  value={formData.measureSize}
                  onChange={handleChange}
                  style={{ marginBottom: "2px" }}
                />
                <span> (sec)</span>
              </label>
              <br />
              <label>
                Beats per Measure:&nbsp;
                <input
                  type="number"
                  min={1}
                  max={1000}
                  name="beatsPerMeasure"
                  value={formData.beatsPerMeasure}
                  onChange={handleChange}
                  style={{ marginBottom: "2px" }}
                />
              </label>
              <br />
              <div><b>Snap Option</b></div><br/>
              <label>
                Snap Mode:&nbsp;
                <input
                  type="checkbox"
                  size={50}
                  defaultChecked={formData.snap}
                  name="snap"
                  onClick={handleSnapChange}
                  style={{ marginBottom: "2px" }}
                />
              </label>
              <br />
              {formData.mode == TIMELINETYPE.Time ? (
                <label>
                  Snap Increment:&nbsp;
                  <input
                    type="number"
                    size={50}
                    min={0.01}
                    step={0.01}
                    name="snapIncrement"
                    value={formData.snapIncrement}
                    onChange={handleChange}
                    style={{ marginBottom: "2px" }}
                  />
                  <span>&nbsp;(sec)</span>
                </label>
              ) : null}
              <hr/>
              <div><b>Frequency Display Options</b></div><br/>
              <label>
                FFT Size:&nbsp;
                <input type="number"
                size={10}
                min={256}
                max={256*32}
                step={256}
                name="FFTSize"
                defaultValue={FFTSize}
                    style={{ marginBottom: "2px" }}
                    />
              </label>
              <br />
              <label>
                Frequency Display:&nbsp;
                <select
                name="frequencyDisplay"
                  defaultValue={frequencyDisplay}
                >
                  <option value="spectrum">spectrum</option>
                  <option value="sonogram">sonogram</option>
                </select>
              </label>
              <hr />
              <input type="submit" value="Save" />
              <button
                onClick={() => setPreferencesModal(false)}
                style={{ paddingLeft: "6px", color: "ButtonText"
                }}
              >
                Cancel
              </button>
            </form>
          </div>
          <div className="modal-footer">
            <div>
              {errorMsgs.map((m, i) => (
                <h3 color="red" key={`error-${i}`}>
                  {m}
                </h3>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {!!(displayControlDialog && controlNew) && (
        <ControlDialog control={null}
        tracks={fileContents.tracks}
        />
      )}
    </>
  );
}
