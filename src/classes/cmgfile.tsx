import { GeneratorType } from "types";
import { getAttributeValue } from "utils/xmlfunctions";
import Compressor from "./compressor";
import Equalizer from "./equalizer";
import Reverb from "./reverb";
import Track from "./track";
import Volume from "./volume";
export default class CMGFile {
  dirty: boolean; // if the contents of the file has been changed since loaded, it is marked dirty
  name: string; // the name of the file on the disk or null if not saved
  version: string; // version of the file
  compressor: Compressor;
  equalizer: Equalizer;
  volume: Volume;
  reverb: Reverb;
  tracks: Track[];
  comment: string;

  constructor() {
    this.dirty = false;
    this.name = "";
    // @ts-ignore
    this.version = import.meta.env.VERSION;
    this.compressor = new Compressor();
    this.equalizer = new Equalizer();
    this.volume = new Volume();
    this.reverb = new Reverb();
    this.tracks = [];
    this.comment = "";
  }

  copy(): CMGFile {
    const newFile: CMGFile = new CMGFile();
    newFile.name = this.name;
    newFile.dirty = this.dirty;
    const newTracks: Track[] = [];
    newFile.compressor = this.compressor.copy();
    newFile.equalizer = this.equalizer.copy();
    newFile.reverb = this.reverb.copy();
    newFile.volume = this.volume.copy();
    this.tracks.forEach((t) => {
      const newTrack: Track = t.copy();
      const newGenerators: GeneratorType[] = [];
      t.generators.forEach((g: GeneratorType) => {
        const newGenerator: GeneratorType = g.copy();
        newGenerators.push(newGenerator);
      });
      newTracks.push(newTrack);
    });
    newFile.tracks = newTracks;
    newFile.comment = this.comment;
    return newFile;
  }

  appendXML(doc: XMLDocument, elem: Element, fileName: string): void {
    const nameParts:string[] = fileName.split('/');
    elem.setAttribute("name", nameParts[nameParts.length-1]);
    elem.setAttribute("version", this.version);
    elem.setAttribute("comment", this.comment);
    this.compressor.appendXML(doc, elem);
    this.equalizer.appendXML(doc, elem);
    this.volume.appendXML(doc, elem);
    this.reverb.appendXML(doc, elem);
  }

  async getXML(fcElem: Element, fileName: string) {
    this.name = fileName;
    try {
      this.comment = getAttributeValue(fcElem, "comment", "string") as string;
    } catch {
      this.comment = "";
    }
    try {
      this.version = getAttributeValue(fcElem, "version", "string") as string;
    } catch {
      this.version = "1";
    }
    this.compressor.getXML(fcElem, this.version);
    this.equalizer.getXML(fcElem, this.version);
    this.volume.getXML(fcElem, this.version);
    this.reverb.getXML(fcElem, this.version);
  }
}
