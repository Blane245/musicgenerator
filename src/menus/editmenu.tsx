// The file menu handles creating new files, opening existing ones,
// saving current ones, and adding tracks to current ones
// import { Algorithmic } from "classes/generators";
import { Algorithmic } from "classes/generators";
import Track from "classes/track";
import { useCMGContext } from "cmgcontext";
import { FormEvent, useEffect, useState } from "react";
import { GENERATORTYPE, RECORDFORMAT, SFFILELOCATION } from "types";
import { addTrack, setFileComment } from "utils/cmfiletransactions";
import { getDirectoryList } from "utils/getdirectorylist";
import { getTrackUID } from "utils/gettrackuid";

export default function EditMenu() {
  const {
    setSFLocalDirectory,
    fileContents,
    setFileContents,
    setStatus,
    setRecordFormat,
    setSFFileList,
    SFFileList,
    playing,
    recordFormat,
    SFLocalDirectory,
  } = useCMGContext();
  const [comment, setComment] = useState<string>("");
  const [commentModal, setCommentModal] = useState<boolean>(false);
  const [preferencesModal, setPreferencesModal] = useState<boolean>(false);
  const [errorMsgs, setErrorMsgs] = useState<string[]>([]);

  useEffect(() => {
    // check if any generators are using a soundfont file that does not
    // exist in the new directory
    const errors: string[] = [];
    const found: Track | undefined = fileContents.tracks.find(
      (t) =>
        t.generators.find(
          (g) =>
            (g.type == GENERATORTYPE.Algorithmic &&
              SFFileList.find((f) => (g as Algorithmic).soundFontFile == f)) ||
            g.type != GENERATORTYPE.Algorithmic
        ) != undefined
    );
    if (found != undefined)
      errors.push(
        `The current composition contains a generator that uses a soundfont file that is not it this directory.`
      );
    setErrorMsgs(errors);
  }, [SFFileList]);

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

  function handleEditPreferences() {
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
    let newSFFileList: { list: string[]; error: string } = {
      list: [],
      error: "",
    };

    try {
      location = location.replace(/\\/g,'/');
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
      case "preferences":
        handleEditPreferences();
        break;
      default:
        break;
    }
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
                  value={recordFormat}
                >
                  <option value="mp3">mp3</option>
                  <option value="wav">wav</option>
                </select>
              </label>
              <br />
              <input type="submit" value="Save" />
              <button
                onClick={() => setPreferencesModal(false)}
                style={{
                  color: "ButtonText",
                  backgroundColor: "ButtonFace",
                  fontSize: "12px",
                  paddingLeft: "6px",
                  paddingTop: "1px",
                  paddingRight: "6px",
                  paddingBottom: "1px",
                  border: "3.333",
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
    </>
  );
}
