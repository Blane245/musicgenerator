import Button from '@mui/material/Button';
import { useState } from "react";
import { ModalStyle } from '../../types/types';
import CMGFile from '../../classes/cmgfile';
import { Box, Modal, Typography } from '@mui/material';
import CMG from '../../classes/cmg';
import SFPG from '../../classes/sfpg';
import Track from '../../classes/track';
import { getAttributeValue, getDocElement, getElementElement } from '../../utils/xmlfunctions';
import { loadSoundFont } from '../../utils/loadsoundfont';
import { Preset } from '../../types/soundfonttypes';
import { useCMGContext } from '../../contexts/cmgcontext';

export default function FileMenu() {
  const { fileContents, setFileContents, setMessage, setStatus, setFileName } = useCMGContext();
  const [openFileNew, setOpenFileNew] = useState<boolean>(false);

  function handleFileNew() {
    if (fileContents.dirty)
      setOpenFileNew(true);
    else {
      const contents: CMGFile = new CMGFile();
      setFileContents(contents);
      setStatus('New file started');
    }
  }
  function handleFileNewCancel() {
    setOpenFileNew(false);
  }

  function handleFileNewOK() {
    const contents = new CMGFile();
    setFileContents(contents);
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
              // (g as SFRG).appendXML(doc, genElement);
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
          setStatus(`File '${handle.name} saved`)
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
                  fc.timeLineStyle = getAttributeValue(fcElem, 'timeLineStyle', 'int') as number;
                  fc.tempo = getAttributeValue(fcElem, 'tempo', 'int') as number;
                  const tracksElem: Element = getDocElement(xmlDoc, 'tracks');;
                  fc.timeSignature.beatsPerMeasure = getAttributeValue(fcElem, 'beatsPerMeasure', 'int') as number,
                    fc.timeSignature.measureUnit = getAttributeValue(fcElem, 'measureUnit', 'int') as number,
                    fc.snap = (getAttributeValue(fcElem, 'snap', 'string') == 'true')
                  fc.measureSnapUnit = getAttributeValue(fcElem, 'measureSnapUnit', 'int') as number;
                  fc.secondSnapUnit = getAttributeValue(fcElem, 'secondSnapUnit', 'int') as number;
                  fc.SFFileName = getAttributeValue(fcElem, 'SFFileName', 'string') as string;
                  fc.SoundFont = await loadSoundFont(fc.SFFileName);
                  const tracksChildren: HTMLCollection = tracksElem.children
                  fc.tracks = [];
                  for (let i = 0; i < tracksChildren.length; i++) {
                    const track = new Track(0)
                    const child = tracksChildren[i]
                    track.name = getAttributeValue(child, 'name', 'string') as string;
                    track.mute = (getAttributeValue(child, 'mute', 'string') == 'true')
                    track.solo = (getAttributeValue(child, 'solo', 'string') == 'true')
                    track.volume = getAttributeValue(child, 'volume', 'float') as number;
                    track.pan = getAttributeValue(child, 'pan', 'float') as number;
                    const gensElem = getElementElement(child, 'generators');
                    const gensChildren: HTMLCollection = gensElem.children;
                    for (let j = 0; j < gensChildren.length; j++) {
                      const gchild = gensChildren[j];
                      const type = getAttributeValue(gchild, 'type', 'string') as string;
                      let gen = null;
                      switch (type as string) {
                        case "CMG": {
                          gen = new CMG(0);
                          gen.name = getAttributeValue(gchild, 'name', 'string') as string;
                          gen.startTime = getAttributeValue(gchild, 'startTime', 'float') as number;
                          gen.stopTime = getAttributeValue(gchild, 'stopTime', 'float') as number;
                          gen.presetName = getAttributeValue(gchild, 'presetName', 'string') as string;
                          gen.midi = getAttributeValue(gchild, 'midi', 'int') as number;
                          gen.type = type;
                          gen.mute = (getAttributeValue(fcElem, 'mute', 'string') == 'true');
                          gen.position = getAttributeValue(gchild, 'position', 'int') as number;
                          // load the preset if soundfont file and preset is defined
                          const pn: string = gen.presetName;
                          if (pn != '' && fc.SoundFont) {
                            gen.preset = fc.SoundFont.presets.find((p) => (p.header.name == pn)) as Preset;
                            if (gen == undefined)
                              throw new Error(`Preset '${pn} not in soundfont file '${fc.SFFileName}'`);
                          }

                          track.generators.push(gen);
                          break;
                        }
                        case 'SFPG': {
                          gen = new SFPG(0);
                          gen.name = getAttributeValue(gchild, 'name', 'string') as string;
                          gen.startTime = getAttributeValue(gchild, 'startTime', 'float') as number;
                          gen.stopTime = getAttributeValue(gchild, 'stopTime', 'float') as number;
                          gen.type = type;
                          gen.presetName = getAttributeValue(gchild, 'presetName', 'string') as string;
                          gen.midi = getAttributeValue(gchild, 'midi', 'int') as number;
                          gen.mute = (getAttributeValue(fcElem, 'mute', 'string') == 'true');
                          gen.position = getAttributeValue(gchild, 'position', 'int') as number;
                          gen.FMType = getAttributeValue(gchild, 'FMType', 'string') as string;
                          gen.FMAmplitude = getAttributeValue(gchild, 'FMAmplitude', 'float') as number;
                          gen.FMFrequency = getAttributeValue(gchild, 'FMFrequency', 'float') as number;
                          gen.FMPhase = getAttributeValue(gchild, 'FMPhase', 'float') as number;
                          gen.VMCenter = getAttributeValue(gchild, 'VMCenter', 'float') as number;
                          gen.VMType = getAttributeValue(gchild, 'VMType', 'string') as string;
                          gen.VMAmplitude = getAttributeValue(gchild, 'VMAmplitude', 'float') as number;
                          gen.VMFrequency = getAttributeValue(gchild, 'VMFrequency', 'float') as number;
                          gen.VMPhase = getAttributeValue(gchild, 'VMPhase', 'float') as number;
                          gen.PMCenter = getAttributeValue(gchild, 'PMCenter', 'float') as number;
                          gen.PMType = getAttributeValue(gchild, 'PMType', 'string') as string;
                          gen.PMAmplitude = getAttributeValue(gchild, 'PMAmplitude', 'float') as number;
                          gen.PMFrequency = getAttributeValue(gchild, 'PMFrequency', 'float') as number;
                          gen.PMPhase = getAttributeValue(gchild, 'PMPhase', 'float') as number;

                          // load the preset if soundfont file and preset is defined
                          const pn: string = gen.presetName;
                          if (pn != '' && fc.SoundFont) {
                            gen.preset = fc.SoundFont.presets.find((p) => (p.header.name == pn)) as Preset;
                            if (gen == undefined)
                              throw new Error(`Preset '${pn} not in soundfont file '${fc.SFFileName}'`);
                          }
                          track.generators.push(gen);
                          break;
                        }
                        case 'SFRG':
                          break;
                        default:
                          break;
                      }
                    }
                    fc.tracks.push(track);
                  }

                  fc.dirty = false;
                  setFileContents(fc);
                });
            });
        });
    } catch (err) {
      const e = err as Error;
      setMessage({ error: true, text: `Error reading cmg file, type: '${e.name}' message: '${e.message}'` })
    }

  }
}
