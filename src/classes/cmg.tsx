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
}