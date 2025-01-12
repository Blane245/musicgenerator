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

// framework for XML builders. It adds its XML to the provided
// element adding chilren from teh document if necessary
async function appendXML(doc: Document, elem: Element): Promise<Element> {
  try {
    const thisElement: Element = elem;
    // build XML on thisElement
    // invoke asynchronous chidren appendXML builders
    // resolve all promises of children
    return Promise.resolve(thisElement);
  } catch (e: any) {
    return Promise.reject(e);
  }
}

import Track from "../classes/track";
import CMGFile from "../classes/cmgfile";

//
export async function writeFile(
  fileContents: CMGFile,
  handle: FileSystemFileHandle
): Promise<boolean> {
  // create the XML document and file element
  const doc: XMLDocument = document.implementation.createDocument("", "", null);
  const fileElem: Element = doc.createElement("fileContexts");

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
    if (trackPromises.length > 0) {
      const trackXML: Element[] = await Promise.all(trackPromises);

      // build the file XML and added the track children
      fileContents.appendXML(doc, fileElem, handle.name);
      // add the track children
      trackXML.forEach((tElem: Element) => {
        fileElem.appendChild(tElem);
      });
    }

    // write the file
    const serializer = new XMLSerializer();
    const xmlString = serializer.serializeToString(doc);

    handle.createWritable().then(async (writeable) => {
      await writeable.write(xmlString);
      await writeable.close();
    });
    return Promise.resolve(true);
  } catch (e: any) {
    console.log("file writing");
    return Promise.reject(false);
  }
}
