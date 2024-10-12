import { getAttributeValue } from "../utils/xmlfunctions";

export default class CMG {
    name: string;
    startTime: number;
    stopTime: number;
    type: string;
    mute: boolean;
    solo: boolean;
    position: number; // the vertical location of the generator icon

    constructor(nextGenerator: number) {
        this.name = "G".concat(nextGenerator.toString());
        this.startTime = 0;
        this.stopTime = 0;
        this.type = 'CMG';
        this.mute = false;
        this.solo = false;
        this.position = 0;
    }

    appendXML(doc: XMLDocument, elem: HTMLElement): void {
        elem.setAttribute('name', this.name);
        elem.setAttribute('startTime', this.startTime.toString());
        elem.setAttribute('stopTime', this.stopTime.toString());
        elem.setAttribute('type', this.type);
        elem.setAttribute('solo', this.solo.toString());
        elem.setAttribute('mute', this.mute.toString());
        elem.setAttribute('position', this.position.toString());
    }

    copy(): CMG {
        const newCMG = new CMG(0);
        newCMG.name = this.name;
        newCMG.startTime = this.startTime;
        newCMG.stopTime = this.stopTime;
        newCMG.type = this.type;
        newCMG.mute = this.mute;
        newCMG.solo = this.solo;
        newCMG.position = this.position;
        return newCMG;
    }

    setAttribute(name: string, value: string): void {
        switch (name) {
            case 'name':
                this.name = value;
                break;
            case 'startTime':
                this.startTime = parseFloat(value);
                break;
            case 'stopTime':
                this.stopTime = parseFloat(value);
                break;
            case 'mute':
                this.mute = value == 'true';
                break;
            case 'solo':
                this.solo = value == 'true';
                break;
            case 'type':
                this.type = value;
                break;
            default:
                break;
        }
    }

    getXML(doc: XMLDocument, elem: Element) {
        this.name = getAttributeValue(elem, 'name', 'string') as string;
        this.startTime = getAttributeValue(elem, 'startTime', 'float') as number;
        this.stopTime = getAttributeValue(elem, 'stopTime', 'float') as number;
        this.type = 'CMG';
        this.mute = (getAttributeValue(elem, 'mute', 'string') == 'true');
        this.solo = (getAttributeValue(elem, 'solo', 'string') == 'true');
        this.position = getAttributeValue(elem, 'position', 'int') as number;
    }
}