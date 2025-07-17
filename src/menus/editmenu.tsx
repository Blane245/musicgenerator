// The file menu handles creating new files, opening existing ones,
// saving current ones, and adding tracks to current ones
import { FormEvent, useEffect, useState } from "react";
import Track from "../classes/track";
import { useCMGContext } from "../cmgcontext";
import { addTrack, setFileComment } from "../utils/cmfiletransactions";
import { getTrackUID } from "../utils/gettrackuid";
import {
  GeneratorType,
  GENERATORTYPE,
  SFFILELOCATIONITEM,
  SFLOCALURIITEM,
  SFSERVERURIITEM,
  SOUNDFONTLOCATIONOPTIONS,
} from "../types";
import { Algorithmic } from "../classes/generators";
import { getSFFileList } from "../utils/getsffilelist";

export default function EditMenu() {
  const {
    fileContents,
    setFileContents,
    setStatus,
    setRecordFormat,
    playing,
    SFFileList,
    setSFFileList,
    SFFileLocation,
    setSFFileLocation,
    SFLocalURI,
    setSFLocalURI,
    SFServerURI,
    setSFServerURI,
  } = useCMGContext();
  const [comment, setComment] = useState<string>("");
  const [commentModal, setCommentModal] = useState<boolean>(false);
  const [preferencesModal, setPreferencesModal] = useState<boolean>(false);
  const [errorMsgs, setErrorMsgs] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState<SOUNDFONTLOCATIONOPTIONS>(
    SOUNDFONTLOCATIONOPTIONS.Server
  );

  useEffect(() => {
    setNewLocation(SFFileLocation);
  }, [SFFileLocation]);
  // edit the CMG file's comment
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

  function handleRecordFormat(format: string) {
    setRecordFormat(format);
    setStatus(`Record format set to ${format}`);
  }

  function handleEditPreferences() {
    setPreferencesModal(true);
  }

  function handlePreferencesSubmit(event: FormEvent<Element>): void {
    event.preventDefault();

    // get the new SF file list
    const location: SOUNDFONTLOCATIONOPTIONS = newLocation;
    const uri: string =
      location == SOUNDFONTLOCATIONOPTIONS.Local
        ? event.target["SFLocalURI"].value
        : event.target["SFServerURI"].value;
    getSFFileList(
      // location,
      uri,
      setSFFileList,
      setStatus
    );

    const msgs: string[] = [];
    // check all current algorithmic generators to see if the selected
    // file is in this list
    fileContents.tracks.forEach((t) => {
      t.generators.forEach((g: GeneratorType) => {
        if (g.type == GENERATORTYPE.Algorithmic) {
          if (SFFileList.indexOf((g as Algorithmic).soundFontFile) < 0) {
            msgs.push(
              `Generator ${g.name} is using '${
                (g as Algorithmic).soundFontFile
              }' which is not in that location `
            );
          }
        }
      });
    });

    if (msgs.length == 0) {
      // update the react hooks and local storage
      setSFFileLocation(newLocation);
      setSFLocalURI(event.target["SFLocalURI"].value);
      setSFServerURI(event.target["SFServerURI"].value);
      window.localStorage.setItem(SFFILELOCATIONITEM, newLocation);
      window.localStorage.setItem(
        SFLOCALURIITEM,
        event.target["SFLocalURI"].value
      );
      window.localStorage.setItem(
        SFSERVERURIITEM,
        event.target["SFServerURI"].value
      );
      // disable the preferences modal
      setErrorMsgs([]);
      setPreferencesModal(false);
    }
    // errors occurred
    else setErrorMsgs(msgs);
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
      case "mp3":
        handleRecordFormat("mp3");
        break;
      case "wav":
        handleRecordFormat("wav");
        break;
      case "preferences":
        handleEditPreferences();
        break;
      default:
        break;
    }
  }

  return (
    <fieldset disabled={playing.current}>
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
            <div className="dItem" id="link1">
              Record Format
              <i className="fa fa-caret-down"></i>
              <div className="dropdown-two">
                <div className="dItem" onClick={() => handleMenuSelect("mp3")}>
                  mp3
                </div>
                <div className="dItem" onClick={() => handleMenuSelect("wav")}>
                  wav
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{ display: !commentModal ? "none" : "block" }}
        className="modal-content"
      >
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
      <div
        style={{ display: preferencesModal ? "block" : "none" }}
        className="modal-content"
      >
        <div className="modal-header">
          <h2> Edit Preferences'</h2>
        </div>
        <div className="modal-body">
          <form onSubmit={handlePreferencesSubmit}>
            <p>SoundFont file location</p>
            <label>
              Local
              {SFFileLocation == SOUNDFONTLOCATIONOPTIONS.Local ? (
                <input
                  type="radio"
                  id="SFlocal"
                  name="SFlocation"
                  value="Local"
                  checked
                  onChange={() =>
                    setNewLocation(SOUNDFONTLOCATIONOPTIONS.Server)
                  }
                />
              ) : (
                <input
                  type="radio"
                  name="SFlocation"
                  value="Local"
                  onChange={() =>
                    setNewLocation(SOUNDFONTLOCATIONOPTIONS.Local)
                  }
                />
              )}
            </label>
            <label>
              Local URI{" "}
              <input
                type="text"
                size={50}
                name="SFLocalURI"
                value={SFLocalURI}
                onChange={(e) => setSFLocalURI(e.currentTarget.value)}
              />
            </label>
            <br />
            <label>
              Server
              {SFFileLocation == SOUNDFONTLOCATIONOPTIONS.Server ? (
                <input
                  type="radio"
                  id="SFserver"
                  name="SFlocation"
                  value="server"
                  checked
                  onChange={() =>
                    setNewLocation(SOUNDFONTLOCATIONOPTIONS.Local)
                  }
                />
              ) : (
                <input
                  type="radio"
                  name="SFlocation"
                  value="Local"
                  onChange={() =>
                    setNewLocation(SOUNDFONTLOCATIONOPTIONS.Server)
                  }
                />
              )}
            </label>
            <label>
              Server URI{" "}
              <input
                type="text"
                size={50}
                name="SFServerURI"
                value={SFServerURI}
                onChange={(e) => setSFServerURI(e.currentTarget.value)}
              />
            </label>
            <br />
            <input type="submit" value="Save" />
          </form>
        </div>
        <div className="modal-footer">
          <button onClick={() => setPreferencesModal(false)}>Cancel</button>
          {errorMsgs.map((m) => (
            <p>{m}</p>
          ))}
        </div>
      </div>
    </fieldset>
  );
}
