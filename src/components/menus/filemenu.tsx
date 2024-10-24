import { useState } from "react";
import CMG from '../../classes/cmg';
import CMGFile from '../../classes/cmgfile';
import Noise from '../../classes/noise';
import SFPG from '../../classes/sfpg';
import SFRG from '../../classes/sfrg';
import Track from '../../classes/track';
import { useCMGContext } from '../../contexts/cmgcontext';
import { Preset } from '../../types/soundfonttypes';
import { newFile, setDirty } from '../../utils/cmfiletransactions';
import { getAttributeValue, getDocElement, getElementElement } from '../../utils/xmlfunctions';
import { GENERATORTYPES } from "../../types/types";

export default function FileMenu() {
  const { fileContents, setFileContents, setMessage, setStatus, setFileName, playing } = useCMGContext();
  const [open, setOpen] = useState<string>('');

  function handleFileNew() {
    if (fileContents.dirty)
      setOpen('new');
    else {
      const contents: CMGFile = new CMGFile();
      newFile(contents, setFileContents);
      setFileName('');
      setStatus('New file started');
      setOpen('');
    }
  }
  function handleCancel() {
    setOpen('');
  }

  function handleOK() {
    if (open == 'new') {
      const contents = new CMGFile();
      newFile(contents, setFileContents);
      setOpen('');
      setFileName('');
      setStatus('New file started');
    } else {
      readFileContents();
      setOpen('');
    }
  }

  function handleOpenClick() {
    if (fileContents.dirty)
      setOpen('open');
    else {
      readFileContents();
      setOpen('');
    }
  }
  function handleFileSave() {
    saveFileContents();
  }

  return (
    <fieldset disabled={playing.current?.on} style={{width:'25em'}}>
      <button onClick={handleFileNew}>New File ...</button>
      <button onClick={handleOpenClick}>Open File ...</button>
      <button onClick={handleFileSave}>Save File ...</button>

      <div
        style={{ display: open == '' ? 'none' : 'block' }}
        className='modal-content'
      >
        <div className='modal-header'>
          <span className='close'>&times;</span>
          <h2>Confirm {open} file</h2>
        </div>
        <div className="modal-body">
          <p>
            The current file has not been saved.
            Do you wish to delete its contents without saving?
          </p>
        </div>
        <div className='modal-footer'>
          <button
            id={"file-delete:" + fileContents.name}
            onClick={handleOK}
          >OK</button>
          <button
            onClick={handleCancel}
          >Cancel</button>
        </div>
      </div>
    </fieldset>
  );
  function saveFileContents() {
    try {

      // build the xml for the file contents
      const doc: XMLDocument = document.implementation.createDocument('', '', null);
      const fileElem: HTMLElement = doc.createElement('fileContents');
      fileContents.appendXML(doc, fileElem);
      const tracksElem: HTMLElement = doc.createElement('tracks');
      fileContents.tracks.forEach((t: Track) => {
        const trackElem: HTMLElement = doc.createElement('track');
        t.appendXML(doc, trackElem);
        tracksElem.appendChild(trackElem);
        const gensElement: HTMLElement = doc.createElement('generators');
        t.generators.forEach(g => {
          const genElement: HTMLElement = doc.createElement('generator');
          switch (g.type) {
            case GENERATORTYPES.CMG:
              (g as CMG).appendXML(doc, genElement);
              break;
            case GENERATORTYPES.SFPG:
              (g as SFPG).appendXML(doc, genElement);

              break;
            case GENERATORTYPES.SFRG:
              (g as SFRG).appendXML(doc, genElement);
              // (g as SFRG).appendXML(doc, genElement);
              break;
            case GENERATORTYPES.Noise:
              (g as Noise).appendXML(doc, genElement);
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

      // save the xml data
      window.showSaveFilePicker(
        {types: [
          {
              description: "Computer Music Generator File",
              accept: { "application/cmg": [".cmg"]}
          }
      ]}

      )
        .then((handle) => {
          handle.createWritable()
            .then(async (writeable) => {
              await writeable.write(xmlString)
              await writeable.close();
            });
          setFileName(handle.name);
          setDirty(false, fileContents, setFileContents);
          setStatus(`File '${handle.name}' saved`)
        });

      //TODO delete the XML document when finished

    } catch (err) {
      const e = err as Error;
      setMessage({ error: true, text: `Error saving cmg file, type: '${e.name}' message: '${e.message}'` })
    }
  }

  function readFileContents() {
    try {
      window.showOpenFilePicker(
        {types: [
          {
              description: "Computer Music Generator File",
              accept: { "application/cmg": [".cmg"]}
          }
      ]}

      )
        .then((handle) => {
          handle[0].getFile()
            .then((file) => {
              setFileName(file.name)
              file.text()
                .then(async (xmlString) => {
                  const parser = new DOMParser();
                  const xmlDoc: XMLDocument = parser.parseFromString(xmlString, 'text/xml');
                  const fc = new CMGFile();
                  const fcElem: Element = getDocElement(xmlDoc, 'fileContents');
                  fc.name = file.name;
                  await fc.getXML(xmlDoc, fcElem, file.name);
                  const tracksElem: Element = getDocElement(xmlDoc, 'tracks');;
                  const tracksChildren: HTMLCollection = tracksElem.children
                  fc.tracks = [];
                  for (let i = 0; i < tracksChildren.length; i++) {
                    const track = new Track(0);
                    const child = tracksChildren[i];
                    track.getXML(xmlDoc, child);
                    const gensElem = getElementElement(child, 'generators');
                    const gensChildren: HTMLCollection = gensElem.children;
                    for (let j = 0; j < gensChildren.length; j++) {
                      const gchild = gensChildren[j];
                      const type = getAttributeValue(gchild, 'type', 'string') as string;
                      let gen = null;
                      switch (type as string) {
                        case GENERATORTYPES.CMG: {
                          gen = new CMG(0);
                          gen.getXML(xmlDoc, gchild);
                          track.generators.push(gen);
                          break;
                        }
                        case GENERATORTYPES.SFPG: {
                          gen = new SFPG(0);
                          gen.getXML(xmlDoc, gchild);
                          // load the preset if soundfont file and presetname is defined
                          const pn: string = gen.presetName.split(":")[2];
                          if (pn != '' && fc.SoundFont) {
                            gen.preset = fc.SoundFont.presets.find((p) => (p.header.name == pn)) as Preset;
                            if (gen.preset == undefined)
                              throw new Error(`Preset '${pn} not in soundfont file '${fc.SFFileName}'`);
                          }
                          track.generators.push(gen);
                          break;
                        }
                        case GENERATORTYPES.SFRG:
                          gen = new SFRG(0);
                          gen.getXML(xmlDoc, gchild);
                          // load the preset if soundfont file and presetname is defined
                          const pn: string = gen.presetName.split(":")[2];
                          if (pn != '' && fc.SoundFont) {
                            gen.preset = fc.SoundFont.presets.find((p) => (p.header.name == pn)) as Preset;
                            if (gen.preset == undefined)
                              throw new Error(`Preset '${pn} not in soundfont file '${fc.SFFileName}'`);
                          }
                          track.generators.push(gen);
                          break;
                        case GENERATORTYPES.Noise:
                          gen = new Noise(0);
                          gen.getXML(xmlDoc, gchild);
                          track.generators.push(gen);
                          break;
                        default:
                          break;
                      }
                    }
                    fc.tracks.push(track);
                  }

                  fc.dirty = false;
                  newFile(fc, setFileContents);
                });
            });
        });
    } catch (err) {
      const e = err as Error;
      setMessage({ error: true, text: `Error reading cmg file, type: '${e.name}' message: '${e.message}'` })
    }

  }
}
