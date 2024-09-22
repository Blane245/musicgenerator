import { MEASURESNAPUNIT, SECONDSNAPUNIT, TIMELINESTYLE, TimeSignature } from "../types/types";
import { SoundFont2 } from "soundfont2";
import Track from "./track";
export default class CGMFile {
    dirty: boolean; // if the contents of the file has been changed since loaded, it is marked dirty
    name: string | null; // the name of the file on the disk or null if not saved
    timeLineStyle: TIMELINESTYLE | null; // where type of timeline
    tempo: number; // the BPM (20-250)
    timeSignature: TimeSignature; // the beats per measure and note type
    snap: boolean; // whether generators snap to the time grid or not
    measureSnapUnit: MEASURESNAPUNIT | null; // how snaping is performed, depending on the time line style
    secondSnapUnit: SECONDSNAPUNIT | null;
    tracks: Track[];
    SFFileName: string; // the file name of the soundfont
    SoundFont: SoundFont2 | null; // the soundfont selected for this file

    constructor() {
        this.dirty =  false;
        this.name =  null;
        this.timeLineStyle = TIMELINESTYLE.SECONDS_MINUTES;
        this.tempo = 120;
        this.timeSignature = {beatsPerMeasure: 4, measureUnit: 4};
        this.snap = false,
        this.measureSnapUnit = MEASURESNAPUNIT["1/8"];
        this.secondSnapUnit = SECONDSNAPUNIT.Seconds;
        this.tracks = [];
        this.SFFileName = '';
        this.SoundFont = null;
        }

    copy(): CGMFile {
        const newFile = new CGMFile();
        newFile.name = this.name;
        newFile.timeLineStyle = this.timeLineStyle;
        newFile.dirty = this.dirty;
        newFile.tracks = this.tracks;
        newFile.snap = this.snap;
        newFile.measureSnapUnit = this.measureSnapUnit;
        newFile.tempo = this.tempo;
        newFile.timeSignature = this.timeSignature;
        newFile.SFFileName = this.SFFileName;
        newFile.SoundFont = this.SoundFont;
        return newFile;
    }

    toXML(): string {

        const xml:string = '';
        return xml;
    }
}