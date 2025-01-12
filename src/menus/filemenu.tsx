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
        .then((handle) => {
          // build the xml for the file contents
          setFileName(handle.name);
          const doc: XMLDocument = document.implementation.createDocument(
            "",
            "",
            null
          );
          const fileElem: Element = doc.createElement("fileContents");
          fileContents.appendXML({
            doc: doc,
            elem: fileElem,
            name: handle.name,
          });
          const tracksElem: Element = doc.createElement("tracks");
          fileContents.tracks.forEach((t: Track) => {
            const trackElem: Element = doc.createElement("track");
            t.appendXML({ elem: trackElem });
            tracksElem.appendChild(trackElem);
            const gensElement: Element = doc.createElement("generators");
            t.generators.forEach((g) => {
              const genElement: Element = doc.createElement("generator");
              switch (g.type) {
                case GENERATORTYPE.CMG:
                  (g as CMG).appendXML({ elem: genElement });
                  break;
                case GENERATORTYPE.SFPG:
                  (g as SFPG).appendXML({ doc: doc, elem: genElement });

                  break;
                case GENERATORTYPE.SFRG:
                  (g as SFRG).appendXML({ doc: doc, elem: genElement });
                  break;
                case GENERATORTYPE.Noise:
                  (g as Noise).appendXML({ doc: doc, elem: genElement });
                  break;
                case GENERATORTYPE.AudioFile:
                  {
                    async function asyncAppend() {
                      await (g as AudioFile).appendXML({ elem: genElement });
                      console.log("audiofile appended ", genElement);
                    }
                    asyncAppend();
                  }
                  break;
                default:
                  break;
              }
              gensElement.appendChild(genElement);
            });
            trackElem.appendChild(gensElement);
          });
          fileElem.appendChild(tracksElem);
          doc.appendChild(fileElem);

          // serialize the HTML to XML
          const serializer = new XMLSerializer();
          const xmlString = serializer.serializeToString(doc);

          handle.createWritable().then(async (writeable) => {
            await writeable.write(xmlString);
            await writeable.close();
          });
          setDirty(false, fileContents, setFileContents);
          setStatus(`File '${handle.name}' saved`);
        });
    } catch (err) {
      const e = err as Error;
      setStatus(
        `Error saving cmg file, type: '${e.name}' message: '${e.message}'`
      );
    }
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
      setCursor("wait");

      setFileName(file.name);
      const xmlString: string = await file.text();
      const parser = new DOMParser();
      const xmlDoc: XMLDocument = parser.parseFromString(xmlString, "text/xml");
      const fc = new CMGFile();
      const fcElem: Element = getDocElement(xmlDoc, "fileContents");
      fc.name = file.name;
      await fc.getXML(fcElem, file.name);
      const tracksElem: Element = getDocElement(xmlDoc, "tracks");
      const tracksChildren: HTMLCollection = tracksElem.children;
      fc.tracks = [];
      for (let i = 0; i < tracksChildren.length; i++) {
        const track = new Track(0);
        const child = tracksChildren[i];
        track.getXML(child);
        const gensElem = getElementElement(child, "generators");
        const gensChildren: HTMLCollection = gensElem.children;
        for (let j = 0; j < gensChildren.length; j++) {
          const gchild = gensChildren[j];
          const type = getAttributeValue(gchild, "type", "string") as string;
          switch (type as string) {
            case GENERATORTYPE.CMG: {
              const gen = new CMG(0);
              gen.getXML(gchild);
              track.generators.push(gen);
              break;
            }
            case GENERATORTYPE.SFPG: {
              const gen = new SFPG(0);
              gen.getXML(gchild);
              // load the preset if soundfont file and presetname is defined
              const pn: string = gen.presetName.split(":")[2];
              if (pn != "" && fc.SoundFont) {
                gen.preset = fc.SoundFont.presets.find(
                  (p) => p.header.name == pn
                ) as Preset;
                if (gen.preset == undefined)
                  throw new Error(
                    `Preset '${pn} not in soundfont file '${fc.SFFileName}'`
                  );
              }
              track.generators.push(gen);
              break;
            }
            case GENERATORTYPE.SFRG: {
              const gen = new SFRG(0);
              gen.getXML(gchild);
              // load the preset if soundfont file and presetname is defined
              const pn: string = gen.presetName.split(":")[2];
              if (pn != "" && fc.SoundFont) {
                gen.preset = fc.SoundFont.presets.find(
                  (p) => p.header.name == pn
                ) as Preset;
                if (gen.preset == undefined)
                  throw new Error(
                    `Preset '${pn} not in soundfont file '${fc.SFFileName}'`
                  );
              }
              track.generators.push(gen);
              break;
            }
            case GENERATORTYPE.Noise: {
              const gen = new Noise(0);
              gen.getXML(gchild);
              track.generators.push(gen);
              break;
            }
            default:
              break;
          }
        }
        fc.tracks.push(track);
      }

      fc.dirty = false;
      newFile(fc, setFileContents);
      setStatus(`File '${file.name}' loaded`);
      if (page) {
        page.style.cursor = "default";
        page.inert = false;
      }
    } catch (err) {
      const e = err as Error;
      setStatus(
        `Error reading cmg file, type: '${e.name}' message: '${e.message}'`
      );
      if (page) {
        page.style.cursor = "default";
        page.inert = false;
      }
    }
  }
}
