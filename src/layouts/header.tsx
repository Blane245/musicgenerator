// The CMG Header containing the log, title, file menu, and file-level controls
import { useEffect, useState } from "react";
// @ts-ignore
import CMG2 from "../assets/CGM2.svg";
import { useCMGContext } from "../cmgcontext";
import FileMenu from "../menus/filemenu";
import ControlsDisplay from "../panels/controlsdisplay";
import { setFileComment } from "../utils/cmfiletransactions";

export interface HeaderProps {
  appName: string;
  appVersion: string;
}

export default function Header(props: HeaderProps) {
  const { appName, appVersion } = props;
  const { fileName, fileContents, setFileContents } = useCMGContext();
  const [isDirty, setIsDirty] = useState("");
  const [comment, setComment] = useState<string>("");
  const [commentModal, setCommentModal] = useState<boolean>(false);
  useEffect(() => {
    setIsDirty(fileContents.dirty ? "*" : "");
    setComment(fileContents.comment);
  }, [fileContents]);

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
          <div className="page-comment">
            <button onClick={handleEditComment}>Comment</button>
          </div>
          <div className="page-menus">
            <FileMenu />
          </div>
          <ControlsDisplay />
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
            onChange={(e)=>handleCommentChange(e)}
          />
          <br />
        </div>
        <div className="modal-footer">
          <button onClick={() => handleNewComment()}>Submit</button>
          <button onClick={() => setCommentModal(false)}>Cancel</button>
        </div>
      </div>
    </>
  );
}
