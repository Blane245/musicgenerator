import { getAttributeValue } from "../utils/xmlfunctions";
import { CMGeneratorType } from "../types/types";
export default class Track {
    name: string;
    mute: boolean; 
    solo: boolean;
    generators: CMGeneratorType[];
constructor(nextTrack: number) {
        this.name = 'T'.concat(nextTrack.toString());
        this.mute = false;
        this.solo = false;
        this.generators = [];
    }

    copy(): Track {
        const t = new Track(0);
        t.name = this.name;
        t.mute = this.mute;
        t.solo = this.solo;
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
    }

    getXML(doc: XMLDocument, elem: Element) {
        this.name = getAttributeValue(elem, 'name', 'string') as string;
        this.mute = (getAttributeValue(elem, 'mute', 'string') == 'true')
        this.solo = (getAttributeValue(elem, 'solo', 'string') == 'true')

    }
}