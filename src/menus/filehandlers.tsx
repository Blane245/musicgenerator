// These are the handlers for writing and reading CMG configuration files.
// The files are in XML format and represent all of the attributes of
// a composition, including file, tracks, and generators.
// The processes are done asynchronously and in parallel with respect to the
// tracks and their generators.
// The writer and reader receive the fileContents context attribute and the
// file handle for the file to be written or read.
//
// In the case of writing a file, each class object builds
// the XML for the object and returns a promise of its delivery when
// finished.
// The tracks driver collects the promises of its own attributes and
// generators and returns a promise of its delivery when finished.
// When all track promises are complete, the file driver collects their
// promises and builds the file level XML.
// The XML is then written to the provided file.
//
// reading decomposes the file's XML into its various
// components. First, the file contents, and then the
// tracks and thie generators asynchornously and in paralle

import { Buffer } from "buffer";
import TimeLine from "classes/timeline";
import { fetchFSData } from "utils/fetchdata";
import CMGFile from "../classes/cmgfile";
import Track from "../classes/track";
import { SFPool } from "../sfcomponents/sfpool";
import { Preset } from "../sfcomponents/types";
import { presetNameToPreset } from "../sfcomponents/util";
import { SoundFont2 } from "../soundfont2";
import {
  FSResponse,
  SFPromiseType,
  SoundFontGenerators,
  SoundFontGeneratorsType,
} from "../types";
import { getDocElement, getElementElement } from "../utils/xmlfunctions";

//
export async function writeCMGFile(
  fileName: string,
  overWrite: boolean,
  fileContents: CMGFile,
  timeLine: TimeLine | null,
): Promise<string | undefined> {
  // create the XML document and file element
  const doc: XMLDocument = document.implementation.createDocument("", "", null);
  const cmgElem: Element = doc.createElement("CMG");
  // request a promise from each of the tracks in the file
  const trackPromises: Promise<Element>[] = [];
  const trackElements: Element[] = [];
  // each track is given a child element to build upon.
  fileContents.tracks.forEach((track: Track) => {
    const trackElement = doc.createElement("track");
    trackElements.push(trackElement);
    const trackPromise: Promise<Element> = track.appendXML(doc, trackElement);
    trackPromises.push(trackPromise);
  });

  // wait for all of the track promises to resolve, if there are any
  try {

    // add the timeline
    if (timeLine) {
      const timeLineElem: Element = doc.createElement("timeLine");
      timeLine.appendXML(doc, timeLineElem, fileName);
      cmgElem.appendChild(timeLineElem);
    }

    // add the file contents
    const fileElem: Element = doc.createElement("fileContents");
    fileContents.appendXML(doc, fileElem, fileName);

    // add the tracks
    const tracksElem: Element = doc.createElement("tracks");
    if (trackPromises.length > 0) {
      const trackXML: Element[] = await Promise.all(trackPromises);

      // add the track children
      trackXML.forEach((tElem: Element) => {
        tracksElem.appendChild(tElem);
      });
    }
    fileElem.append(tracksElem);
    cmgElem.appendChild(fileElem);

    // write the file
    const uri: string = `/file/write?name=${fileName}&overwrite=${overWrite}`;

    const docString: string = new XMLSerializer().serializeToString(cmgElem);
    const response: FSResponse = await fetchFSData(uri, "POST", docString);
    if (response)
      if (response.error) return response.status;
      else return "";
    else
      return Promise.reject(`Unknown server error while writing ${fileName} `);
  } catch (e: any) {
    console.log("file writing error", e);
    return Promise.reject(e.toString());
  }
}

export async function readCMGFile(
  fileName: string,
  width: number,
  height: number,
): Promise<{ fileContents: CMGFile | null; timeLine: TimeLine | null }> {
  try {
    const uri: string = `/file/read?name=${fileName}`;
    const response: FSResponse = await fetchFSData(uri, "GET");
    if (!response || !response.file || response.error) {
      return Promise.reject(response?.error);
    }
    // const data: number[] = response.file.data;
    const array: Uint8Array = new Uint8Array(response.file.data);
    const xmlString: string = Buffer.from(array).toString("utf8");
    const xmlDoc = new DOMParser().parseFromString(xmlString, "text/xml");

    // read the optional timeLine element
    // the xml is either structured
    // <fileContents>...</fileContents>
    // or
    // <CMG><timeLine>...</timeLine><fileContents>...</fileContents></CMG>
    let timeLineElem: Element | null = null;
    let fcElem: Element | null = null;
    try {
      const CMGElem: Element = getDocElement(xmlDoc, "CMG");
      timeLineElem = getElementElement(CMGElem, "timeLine");
      fcElem = getElementElement(CMGElem, "fileContents");
    } catch (e) {
      fcElem = getDocElement(xmlDoc, "fileContents");
    }
    let timeLine: TimeLine = new TimeLine(width, height);
    if (timeLineElem) timeLine.getXML(timeLineElem, fileName);

    const fileContents = new CMGFile();
    if (fcElem) {
      await fileContents.getXML(fcElem, fileName);

      const tracksElem: Element = getDocElement(xmlDoc, "tracks");
      const tracksChildren: HTMLCollection = tracksElem.children;
      const trackPromises: Promise<Track>[] = [];
      for (let child of tracksChildren) {
        const track: Track = new Track(0);
        const trackPromise: Promise<Track> = track.getXML(
          child,
          fileContents.version
        );
        trackPromises.push(trackPromise);
      }

      if (trackPromises.length > 0) {
        const tracks: Track[] = await Promise.all(trackPromises);
        fileContents.tracks = tracks;
      }
      // retrieve all of the soundfont files that are needed by the composition

      const soundFontPromises: Promise<SFPromiseType>[] = [];
      SoundFontGenerators.forEach(async (sff) => {
        try {
          const soundFontPromise: Promise<SFPromiseType> = SFPool(
            sff.name
          );
          soundFontPromises.push(soundFontPromise);
        } catch (e: any) {
          throw new Error(e);
        }
      });

      // wait for the all of the soundfont files to load, then update the
      // generators with the soundfont file and preset
      const data: { name: string; soundFont: SoundFont2 }[] = await Promise.all(
        soundFontPromises
      );

      data.forEach((d) => {
        const thisOne: SoundFontGeneratorsType | undefined =
          SoundFontGenerators.find((sff) => sff.name == d.name);
        if (thisOne != undefined) {
          thisOne.generators.forEach((g) => {
            g.soundFont = d.soundFont;
            g.presets = (d.soundFont.presets as Preset[]).sort((a, b) => {
              if (a.header.bank < b.header.bank) return -1;
              if (a.header.bank > b.header.bank) return 1;
              return a.header.preset - b.header.preset;
            });
            const { preset } = presetNameToPreset(g.presetName, g.presets);
            g.preset = preset;
          });
        }
      });
      return Promise.resolve({ fileContents, timeLine });
    } else {
      return Promise.resolve({ fileContents: null, timeLine: null });
    }
  } catch (e) {
    return Promise.reject(e);
  }
}
