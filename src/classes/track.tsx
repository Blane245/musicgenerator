import CMGenerator from "./cmg";
export default class Track {
    name: string;
    order: number;
    mute: boolean; 
    solo: boolean;
    volume: number;
    pan: number;
    generators: CMGenerator[];
    data: Blob | null;
constructor(nextTrack: number) {
        this.name = 'T'.concat(nextTrack.toString());
        this.order = nextTrack;
        this.mute = false;
        this.solo = false;
        this.volume = 50;
        this.pan = 0;
        this.generators = [];
        this.data = null
    }

    toXML(): string {

        const xml:string = '';
        return xml;
    }

}