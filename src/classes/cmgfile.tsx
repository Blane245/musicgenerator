import { SoundFont2 } from "soundfont2";
import { CMGeneratorType, MEASURESNAPUNIT, SECONDSNAPUNIT, TIMELINESTYLE, TimeSignature } from "../types/types";
import { loadSoundFont } from "../utils/loadsoundfont";
import { getAttributeValue } from "../utils/xmlfunctions";
import Track from "./track";
import Compressor from "./compressor";
import Equalizer from "./equalizer";
export default class CMGFile {
    dirty: boolean; // if the contents of the file has been changed since loaded, it is marked dirty
    name: string; // the name of the file on the disk or null if not saved
    timeLineStyle: TIMELINESTYLE; // where type of timeline
    tempo: number; // the BPM (20-250)
    timeSignature: TimeSignature; // the beats per measure and note type
    snap: boolean; // whether generators snap to the time grid or not
    measureSnapUnit: MEASURESNAPUNIT; // how snaping is performed, depending on the time line style
    secondSnapUnit: SECONDSNAPUNIT;
    compressor: Compressor;
    equalizer: Equalizer;
    tracks: Track[];
    SFFileName: string; // the file name of the soundfont
    SoundFont: SoundFont2 | null; // the soundfont selected for this file

    constructor() {
        this.dirty = false;
        this.name = '';
        this.timeLineStyle = TIMELINESTYLE.SECONDS_MINUTES;
        this.tempo = 120;
        this.timeSignature = { beatsPerMeasure: 4, measureUnit: 4 };
        this.snap = false,
            this.measureSnapUnit = MEASURESNAPUNIT["1/8"];
        this.secondSnapUnit = SECONDSNAPUNIT.Seconds;
        this.compressor = new Compressor();
        this.equalizer = new Equalizer();
        this.tracks = [];
        this.SFFileName = '';
        this.SoundFont = null;
    }

    copy(): CMGFile {
        const newFile: CMGFile = new CMGFile();
        newFile.name = this.name;
        newFile.timeLineStyle = this.timeLineStyle;
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
        newFile.snap = this.snap;
        newFile.measureSnapUnit = this.measureSnapUnit;
        newFile.tempo = this.tempo;
        newFile.timeSignature = this.timeSignature;
        newFile.SFFileName = this.SFFileName;
        newFile.SoundFont = this.SoundFont;
        return newFile;
    }

    appendXML(doc: XMLDocument, elem: HTMLElement): void {
        elem.setAttribute('name', this.name);
        elem.setAttribute('timeLineStyle', this.timeLineStyle.toString());
        elem.setAttribute('tempo', this.tempo.toString());
        elem.setAttribute('beatsPerMeasure', this.timeSignature.beatsPerMeasure.toString());
        elem.setAttribute('measureUnit', this.timeSignature.measureUnit.toString());
        elem.setAttribute('snap', this.snap.toString());
        elem.setAttribute('measureSnapUnit', this.measureSnapUnit.toString());
        elem.setAttribute('secondSnapUnit', this.secondSnapUnit.toString());
        elem.setAttribute('SFFileName', this.SFFileName);
        this.compressor.appendXML(elem);
        this.equalizer.appendXML(elem);
    }

    async getXML(doc: XMLDocument, fcElem: Element, fileName: string) {
        this.name = fileName;
        this.timeLineStyle = getAttributeValue(fcElem, 'timeLineStyle', 'int') as number;
        this.tempo = getAttributeValue(fcElem, 'tempo', 'int') as number;
        this.timeSignature.beatsPerMeasure = getAttributeValue(fcElem, 'beatsPerMeasure', 'int') as number,
        this.timeSignature.measureUnit = getAttributeValue(fcElem, 'measureUnit', 'int') as number,
        this.snap = (getAttributeValue(fcElem, 'snap', 'string') == 'true')
        this.measureSnapUnit = getAttributeValue(fcElem, 'measureSnapUnit', 'int') as number;
        this.secondSnapUnit = getAttributeValue(fcElem, 'secondSnapUnit', 'int') as number;
        this.SFFileName = getAttributeValue(fcElem, 'SFFileName', 'string') as string;
        if (this.SFFileName != '') {
            this.SoundFont = await loadSoundFont(this.SFFileName);
        }
        this.compressor.getXML(fcElem);
        this.equalizer.getXML(fcElem);
    }
}