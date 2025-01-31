import { SoundFont2 } from "soundfont2";
import { CMGeneratorType } from "../types";
import { loadSoundFont } from "../utils/loadsoundfont";
import { getAttributeValue } from "../utils/xmlfunctions";
import Track from "./track";
import Compressor from "./compressor";
import Equalizer from "./equalizer";
import Volume from "./volume";
export default class CMGFile {
  dirty: boolean; // if the contents of the file has been changed since loaded, it is marked dirty
  name: string; // the name of the file on the disk or null if not saved
  version: string; // version of the file
  compressor: Compressor;
  equalizer: Equalizer;
  volume: Volume;
  tracks: Track[];
  SFFileName: string; // the file name of the soundfont
  SoundFont: SoundFont2 | null; // the soundfont selected for this file
  comment: string;

  constructor() {
    this.dirty = false;
    this.name = "";
    this.version = import.meta.env.PACKAGE_VERSION;
    this.compressor = new Compressor("roomcompressor");
    this.equalizer = new Equalizer("roomequalizer");
    this.volume = new Volume("roomvolume");
    this.tracks = [];
    this.SFFileName = "";
    this.SoundFont = null;
    this.comment = "";
  }

  copy(): CMGFile {
    const newFile: CMGFile = new CMGFile();
    newFile.name = this.name;
    newFile.dirty = this.dirty;
    const newTracks: Track[] = [];
    newFile.compressor = this.compressor.copy();
    newFile.equalizer = this.equalizer.copy();
    this.tracks.forEach((t) => {
      const newTrack: Track = t.copy();
      const newGenerators: CMGeneratorType[] = [];
      t.generators.forEach((g: CMGeneratorType) => {
        const newGenerator: CMGeneratorType = g.copy();
        newGenerators.push(newGenerator);
      });
      newTracks.push(newTrack);
    });
    newFile.tracks = newTracks;
    newFile.SFFileName = this.SFFileName;
    newFile.SoundFont = this.SoundFont;
    newFile.comment = this.comment;
    return newFile;
  }

  appendXML(doc: XMLDocument, elem: Element, name: string): void {
    elem.setAttribute("name", name);
    elem.setAttribute("version", this.version);
    elem.setAttribute("SFFileName", this.SFFileName);
    elem.setAttribute("comment", this.comment);
    this.compressor.appendXML(doc, elem);
    this.equalizer.appendXML(doc, elem);
    this.volume.appendXML(doc, elem);
  }

  async getXML(fcElem: Element, fileName: string) {
    this.name = fileName;
    this.SFFileName = getAttributeValue(
      fcElem,
      "SFFileName",
      "string"
    ) as string;
    if (this.SFFileName != "") {
      this.SoundFont = await loadSoundFont(this.SFFileName);
    }
    try {
      this.comment = getAttributeValue(fcElem, "comment", "string") as string;
    } catch {
      this.comment = "";
    }
    try {
      this.version = getAttributeValue(fcElem, 'version', 'string') as string;
    } catch {
      this.version = '1';
    }
    this.compressor.getXML(fcElem, this.version);
    this.equalizer.getXML(fcElem, this.version);
    this.volume.getXML(fcElem, this.version);
  }
}
