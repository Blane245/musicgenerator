import SFPG from "./sfpg";

export default class CMG {
    name: string;
    startTime: number;
    stopTime: number;
    type: string;
    constructor(nextGenerator: number) {
        this.name = "G".concat(nextGenerator.toString());
        this.startTime = 0;
        this.stopTime = 0;
        this.type = 'CMG';
    }

    appendXML(doc: XMLDocument, elem: HTMLElement): void {
        elem.setAttribute('name', this.name);
        elem.setAttribute('startTime', this.startTime.toString());
        elem.setAttribute('stopTime', this.stopTime.toString());
        elem.setAttribute('type', this.type);
    }

    copy(): CMG {
        const newCMG = new CMG(0);
        newCMG.name = this.name;
        newCMG.startTime = this.startTime;
        newCMG.stopTime = this.stopTime;
        newCMG.type = this.type;
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
            case 'type':
                this.type = value;
                break;
            default:
                break;
        }
    }
}