import CMGenerator from "./cmg";
export default class Track {
    name: string;
    order: number;
    mute: boolean; 
    solo: boolean;
    volume: number;
    pan: number;
    generators: CMGenerator[];
constructor(nextTrack: number) {
        this.name = 'T'.concat(nextTrack.toString());
        this.order = nextTrack;
        this.mute = false;
        this.solo = false;
        this.volume = 50;
        this.pan = 0;
        this.generators = [];
    }

    appendXML(doc: XMLDocument, elem: HTMLElement): void {
        elem.setAttribute('name', this.name);
        elem.setAttribute('order', this.order.toString());
        elem.setAttribute('mute', this.mute.toString());
        elem.setAttribute('solo', this.solo.toString());
        elem.setAttribute('volume', this.volume.toString());
        elem.setAttribute('pan', this.pan.toString());
    }

}