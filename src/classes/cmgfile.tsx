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
    compressor: Compressor;
    equalizer: Equalizer;
    volume: Volume;
    tracks: Track[];
    SFFileName: string; // the file name of the soundfont
    SoundFont: SoundFont2 | null; // the soundfont selected for this file

    constructor() {
        this.dirty = false;
        this.name = '';
        this.compressor = new Compressor('roomcompressor');
        this.equalizer = new Equalizer('roomequalizer');
        this.volume = new Volume('roomvolume');
        this.tracks = [];
        this.SFFileName = '';
        this.SoundFont = null;
    }

    copy(): CMGFile {
        const newFile: CMGFile = new CMGFile();
        newFile.name = this.name;
        newFile.dirty = this.dirty;
        const newTracks: Track[] = []
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
        return newFile;
    }

    appendXML(props:{elem: Element, doc: XMLDocument, name: string}): void {
        const {elem, doc, name} = props;
        props.elem.setAttribute('name', name);
        elem.setAttribute('SFFileName', this.SFFileName);
        this.compressor.appendXML({doc:doc, elem:elem});
        this.equalizer.appendXML({doc:doc, elem:elem});
        this.volume.appendXML({doc: doc, elem: elem});
    }

    async getXML(fcElem: Element, fileName: string) {
        this.name = fileName;
        this.SFFileName = getAttributeValue(fcElem, 'SFFileName', 'string') as string;
        if (this.SFFileName != '') {
            this.SoundFont = await loadSoundFont(this.SFFileName);
        }
        this.compressor.getXML(fcElem);
        this.equalizer.getXML(fcElem);
        this.volume.getXML(fcElem);
    }
}