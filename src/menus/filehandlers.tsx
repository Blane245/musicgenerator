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

import CMGFile from "../classes/cmgfile";
import Track from "../classes/track";
import { getDocElement } from "../utils/xmlfunctions";

//
export async function writeFile(
  fileContents: CMGFile,
  handle: FileSystemFileHandle
): Promise<boolean> {
  // create the XML document and file element
  const doc: XMLDocument = document.implementation.createDocument("", "", null);

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
    // build the file XML and added the track children
    const fileElem: Element = doc.createElement("fileContents");
    fileContents.appendXML(doc, fileElem, handle.name);
    const tracksElem: Element = doc.createElement("tracks");
    if (trackPromises.length > 0) {
      const trackXML: Element[] = await Promise.all(trackPromises);

      // add the track children
      trackXML.forEach((tElem: Element) => {
        tracksElem.appendChild(tElem);
      });
    }
    fileElem.append(tracksElem);
    doc.appendChild(fileElem);

    // write the file
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(doc);

    handle.createWritable().then(async (writeable) => {
      await writeable.write(xmlString);
      await writeable.close();
    });
    return Promise.resolve(true);
  } catch (e: any) {
    console.log("file writing error", e);
    return Promise.reject(false);
  }
}

export async function loadXML(
  xmlDoc: XMLDocument,
  fileName: string
): Promise<CMGFile> {
  try {
    const fileContents = new CMGFile();
    const fcElem: Element = getDocElement(xmlDoc, "fileContents");
    await fileContents.getXML(fcElem, fileName);
    const tracksElem: Element = getDocElement(xmlDoc, "tracks");
    const tracksChildren: HTMLCollection = tracksElem.children;
    const trackPromises: Promise<Track>[] = [];
    for (let child of tracksChildren) {
      const track: Track = new Track(0);
      const trackPromise: Promise<Track> = track.getXML(child, fileContents.SoundFont);
      trackPromises.push(trackPromise);
    }

    if (trackPromises.length > 0) {
      const tracks: Track[] = await Promise.all(trackPromises);
      fileContents.tracks = tracks;
    }
    return Promise.resolve(fileContents);
  } catch (e) {
    return Promise.reject(e);
  }
}
