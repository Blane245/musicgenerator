import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import AudioFile from "../classes/audiofile";
import CMG from "../classes/cmg";
import CMGFile from "../classes/cmgfile";
import Noise from "../classes/noise";
import SFPG from "../classes/sfpg";
import SFRG from "../classes/sfrg";
import Track from "../classes/track";
import { useCMGContext } from "../cmgcontext";
import { Preset } from "../sfcomponents/types";
import { GENERATORTYPE } from "../types";
import { addTrack, newFile, setDirty } from "../utils/cmfiletransactions";
import { getTrackUID } from "../utils/gettrackuid";
import setCursor from "../utils/setcursor";
import {
  getAttributeValue,
  getDocElement,
  getElementElement,
} from "../utils/xmlfunctions";
import { loadXML, writeFile } from "./filehandlers";

export default function FileMenu() {
  const { fileContents, setFileContents, setStatus, setFileName, playing } =
    useCMGContext();
  const [open, setOpen] = useState<string>("");

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
  function handleNewTrack() {
    // find a track number that is unique, start wiith the next number
    const next = getTrackUID(fileContents.tracks);

    // create a track with this UID;
    const newTrack = new Track(next);
    // and added to the file
    addTrack(newTrack, setFileContents);
    setStatus(`Track ${newTrack.name}' Added`);
  }

  return (
    <fieldset disabled={playing.current} /* style={{ width: "30em" }} */>
      <button onClick={() => handleFileNew()}>New File</button>
      <span>&nbsp;</span>
      <button onClick={() => handleOpen()}>Open File...</button>
      <span>&nbsp;</span>
      <button onClick={() => handleFileSave()}>Save File...</button>
      <span>&nbsp;</span>
      <button onClick={() => handleNewTrack()}>New Track</button>

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
      if (page) {
        page.inert = false;
      }
    }
  }
}
