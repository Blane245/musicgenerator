import { MEASURESNAPUNIT, SECONDSNAPUNIT, TIMELINESTYLE, TimeSignature } from "../types/types";
import { SoundFont2 } from "soundfont2";
import Track from "./track";
import CMG from "./cmg";
import SFPG from "./sfpg";
import SFRG from "./sfrg";
import { getAttributeValue } from "../utils/xmlfunctions";
import { loadSoundFont } from "../utils/loadsoundfont";
export default class CMGFile {
    dirty: boolean; // if the contents of the file has been changed since loaded, it is marked dirty
    name: string; // the name of the file on the disk or null if not saved
    timeLineStyle: TIMELINESTYLE; // where type of timeline
    tempo: number; // the BPM (20-250)
    timeSignature: TimeSignature; // the beats per measure and note type
    snap: boolean; // whether generators snap to the time grid or not
    measureSnapUnit: MEASURESNAPUNIT; // how snaping is performed, depending on the time line style
    secondSnapUnit: SECONDSNAPUNIT;
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
        this.tracks.forEach((t) => {
            const newTrack: Track = t.copy();
            const newGenerators: (CMG | SFPG | SFRG)[] = [];
            t.generators.forEach((g: CMG | SFPG | SFRG) => {
                const newGenerator: CMG | SFPG | SFRG = g.copy();
                newGenerators.push(newGenerator);
            });
            newTracks.push(newTrack);
        })
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
    }
}