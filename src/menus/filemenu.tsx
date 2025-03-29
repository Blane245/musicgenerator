// The file menu handles creating new files, opening existing ones,
// saving current ones, and adding tracks to current ones
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import CMGFile from "../classes/cmgfile";
import { useCMGContext } from "../cmgcontext";
import { newFile, setDirty } from "../utils/cmfiletransactions";
import { loadXML, writeFile } from "./filehandlers";

export default function FileMenu() {
  const { fileContents, setFileContents, setStatus, setFileName, playing } =
    useCMGContext();
  const [open, setOpen] = useState<string>("");

  // a couple of hot keys are supported for faile saving and opening
  useHotkeys(
    "ctrl+s",
    () => {
      if (!playing.current) saveFileContents();
    },
    { preventDefault: true }
  );

  useHotkeys(
    "ctrl+o",
    () => {
      if (!playing.current) handleOpen();
    },
    { preventDefault: true }
  );

  // handle request to create a new file
  // If the curretn one is 'dirty' the user is
  // prompted to confirm overwrite
  function handleFileNew() {
    if (fileContents.dirty) setOpen("new");
    else {
      const contents: CMGFile = new CMGFile();
      newFile(contents, setFileContents);
      setFileName("");
      setStatus("New file started");
      setOpen("");
    }
  }

  function handleCancel() {
    setOpen("");
  }

  function handleOK() {
    if (open == "new") {
      const contents = new CMGFile();
      newFile(contents, setFileContents);
      setOpen("");
      setFileName("");
      setStatus("New file started");
    } else {
      setOpen("");
      readFileContents();
    }
  }

  // handle request to open a file.
  // if the current one is 'dirty' the user is asked to confirm over-write
  function handleOpen() {
    if (fileContents.dirty) setOpen("open");
    else {
      setOpen("");
      readFileContents();
    }
  }

  function handleFileSave() {
    saveFileContents();
  }

  function handleMenuSelect(action: string) {
    switch (action) {
      case "new":
        handleFileNew();
        break;
      case "open":
        handleOpen();
        break;
      case "save":
        handleFileSave();
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
            File
            <i className="fa fa-caret-down"></i>
          </div>
          <div className="dropdown-one">
            <a className="dItem" onClick={() => handleMenuSelect("new")}>New File... </a>
            <a className="dItem" onClick={() => handleMenuSelect("open")}>Open File...</a>
            <a className="dItem" onClick={() => handleMenuSelect("save")}>Save File...</a>
          </div>
        </div>
      </div>

      <div
        style={{ display: open == "" ? "none" : "block" }}
        className="modal-content"
      >
        <div className="modal-header">
          <span className="close">&times;</span>
          <h2>Confirm {open} file</h2>
        </div>
        <div className="modal-body">
          <p>
            The current file has not been saved. Do you wish to delete its
            contents without saving?
          </p>
        </div>
        <div className="modal-footer">
          <button id={"file-delete:" + fileContents.name} onClick={handleOK}>
            OK
          </button>
          <button onClick={handleCancel}>Cancel</button>
        </div>
      </div>
    </fieldset>
  );

  function saveFileContents() {
    try {
      const page: HTMLElement | null = document.getElementById("page");
      // save the xml data
      window
        .showSaveFilePicker({
          types: [
            {
              description: "Computer Music Generator File",
              accept: { "application/cmg": [".cmg"] },
            },
          ],
        })
        .then(async (handle) => {
          if (page) page.inert = true;
          // build the xml for the file contents
          setFileName(handle.name);

          try {
            await writeFile(fileContents, handle);
            setDirty(false, fileContents, setFileContents);
            setStatus(`File '${handle.name}' saved`);
            if (page) page.inert = false;
          } catch (err) {
            if (page) page.inert = false;
            const e = err as Error;
            setStatus(
              `Error saving cmg file, type: '${e.name}' message: '${e.message}'`
            );
          }
        });
    } catch (_) {}
  }
  async function readFileContents() {
    const page = document.getElementById("page");

    try {
      const handle: FileSystemFileHandle[] = await window.showOpenFilePicker({
        types: [
          {
            description: "Computer Music Generator File",
            accept: { "application/cmg": [".cmg"] },
          },
        ],
      });
      const file: File = await handle[0].getFile();

      // set the wait cursor on the page and make it inert
      if (page) page.inert = true;

      // read the XML from the .cmg file
      setFileName(file.name);
      const xmlString: string = await file.text();
      const parser = new DOMParser();
      const xmlDoc: XMLDocument = parser.parseFromString(xmlString, "text/xml");

      // load the file contents from the XML
      const fileContents = await loadXML(xmlDoc, file.name);
      fileContents.dirty = false;
      newFile(fileContents, setFileContents);
      setStatus(`File '${file.name}' loaded`);
      if (page) page.inert = false;
    } catch (err) {
      const e = err as Error;
      setStatus(
        `Error reading cmg file, type: '${e.name}' message: '${e.message}'`
      );
      if (page) page.inert = false;
    }
  }
}
