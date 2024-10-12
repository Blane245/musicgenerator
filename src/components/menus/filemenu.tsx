import { Box, Modal, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import { useState } from "react";
import CMG from '../../classes/cmg';
import CMGFile from '../../classes/cmgfile';
import SFPG from '../../classes/sfpg';
import SFRG from '../../classes/sfrg';
import Track from '../../classes/track';
import { useCMGContext } from '../../contexts/cmgcontext';
import { Preset } from '../../types/soundfonttypes';
import { ModalStyle } from '../../types/types';
import { newFile, setDirty } from '../../utils/cmfiletransactions';
import { getAttributeValue, getDocElement, getElementElement } from '../../utils/xmlfunctions';
import Noise from '../../classes/noise';

export default function FileMenu() {
  const { fileContents, setFileContents, setMessage, setStatus, setFileName } = useCMGContext();
  const [openFileNew, setOpenFileNew] = useState<boolean>(false);
  
  function handleFileNew() {
    if (fileContents.dirty)
      setOpenFileNew(true);
    else {
      const contents: CMGFile = new CMGFile();
      newFile (contents, setFileContents);
      setStatus('New file started');
    }
  }
  function handleFileNewCancel() {
    setOpenFileNew(false);
  }

  function handleFileNewOK() {
    const contents = new CMGFile();
    newFile(contents, setFileContents);
    setOpenFileNew(false);
    setStatus('New file started');
  }

  function handleOpenClick() {
    readFileContents();
  }
  function handleFileSave() {
    saveFileContents();
  }

  return (
    <>
      <button onClick={handleFileNew}>New File ...</button>
      <button onClick={handleOpenClick}>Open File ...</button>
      <button onClick={handleFileSave}>Save File ...</button>

      <Modal
        id='filenew'
        open={openFileNew}
        onClose={handleFileNewCancel}
      >
        <Box sx={ModalStyle}>
          <Typography>
            The current file has not been saved.
            Do you wish to delete its contents withut saving?
          </Typography>
          <Button
            variant='outlined'
            onClick={handleFileNewOK}
          >
            OK
          </Button>
          <Button
            variant='outlined'
            onClick={handleFileNewCancel}
          >
            Cancel
          </Button>

        </Box>
      </Modal>

    </>
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
            case 'CMG':
              (g as CMG).appendXML(doc, genElement);
              break;
            case 'SFPG':
              (g as SFPG).appendXML(doc, genElement);

              break;
            case 'SFRG':
              (g as SFRG).appendXML(doc,genElement);
              // (g as SFRG).appendXML(doc, genElement);
              break;
              case 'Noise':
                (g as Noise).appendXML(doc,genElement);
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

      // write the file
      const options = {
        types: [
          {
            description: 'CMG files',
            accept: {
              'cmg': ['.cmg']
            }
          }
        ]
      }

      // save the xml data
      window.showSaveFilePicker(/*options*/)
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
    const options = {
      types: [{ description: 'CMG files', accept: { 'cmg': ['.cmg'] } }]
    };
    try {
      window.showOpenFilePicker(/*options*/)
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
                        case "CMG": {
                          gen = new CMG(0);
                          gen.getXML(xmlDoc, gchild);
                          track.generators.push(gen);
                          break;
                        }
                        case 'SFPG': {
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
                        case 'SFRG':
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
                          case 'Noise':
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
