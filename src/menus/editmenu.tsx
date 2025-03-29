// The file menu handles creating new files, opening existing ones,
// saving current ones, and adding tracks to current ones
import { useState } from "react";
import Track from "../classes/track";
import { useCMGContext } from "../cmgcontext";
import { addTrack, setFileComment } from "../utils/cmfiletransactions";
import { getTrackUID } from "../utils/gettrackuid";

export default function EditMenu() {
  const { fileContents, setFileContents, setStatus, setRecordFormat, playing } =
    useCMGContext();
  const [comment, setComment] = useState<string>("");
  const [commentModal, setCommentModal] = useState<boolean>(false);

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
    setStatus(`Track ${newTrack.name}' Added`);
  }

  function handleRecordFormat(format: string) {
    setRecordFormat(format);
    setStatus(`Record format set to ${format}`);
  }

  function handleMenuSelect(action: string) {
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
    </fieldset>
  );
}
