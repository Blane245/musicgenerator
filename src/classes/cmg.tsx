import { Preset } from "types/soundfonttypes";

export default class CMG {
    name: string;
    startTime: number;
    stopTime: number;
    type: string;
    presetName: string;
    preset: Preset | undefined;
    midi: number;

    constructor(nextGenerator: number) {
        this.name = "G".concat(nextGenerator.toString());
        this.startTime = 0;
        this.stopTime = 0;
        this.presetName = '';
        this.preset = undefined;
        this.midi = -1;
        this.type = 'CMG';
    }

    appendXML(doc: XMLDocument, elem: HTMLElement): void {
        elem.setAttribute('name', this.name);
        elem.setAttribute('startTime', this.startTime.toString());
        elem.setAttribute('stopTime', this.stopTime.toString());
        elem.setAttribute('presetName', this.presetName);
        elem.setAttribute('midi', this.midi.toString());
        elem.setAttribute('type', this.type);
    }

    copy(): CMG {
        const newCMG = new CMG(0);
        newCMG.name = this.name;
        newCMG.startTime = this.startTime;
        newCMG.stopTime = this.stopTime;
        newCMG.type = this.type;
        newCMG.presetName = this.presetName;
        newCMG.preset = this.preset;
        newCMG.midi = this.midi;
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
            case 'presetName':
                this.presetName = value;
                break;
            case 'midi':
                this.midi = parseInt(value);
                break;
            case 'type':
                this.type = value;
                break;
            default:
                break;
        }
    }
}