import { CMGeneratorType } from "../types/types";
export default class Track {
    name: string;
    mute: boolean; 
    solo: boolean;
    volume: number;
    pan: number;
    generators: CMGeneratorType[];
constructor(nextTrack: number) {
        this.name = 'T'.concat(nextTrack.toString());
        this.mute = false;
        this.solo = false;
        this.volume = 50;
        this.pan = 0;
        this.generators = [];
    }

    copy(): Track {
        const t = new Track(0);
        t.name = this.name;
        t.mute = this.mute;
        t.solo = this.solo;
        t.volume = this.volume;
        t.pan = this.pan;
        t.generators = [];
        this.generators.forEach((g) => {
            const ng = g.copy();
            t.generators.push(ng);
        });
        return t;
    }
    appendXML(doc: XMLDocument, elem: HTMLElement): void {
        elem.setAttribute('name', this.name);
        elem.setAttribute('mute', this.mute.toString());
        elem.setAttribute('solo', this.solo.toString());
        elem.setAttribute('volume', this.volume.toString());
        elem.setAttribute('pan', this.pan.toString());
    }

}