import CMG from "./cmg";

// trying a markov chain for midi and BPM 
// the model has three states UP, DOWN, and SAME
// P(UP -> UP) 
// P(UP-> DOWN)
// P(UP-> SAME)
// P(DOWN -> UP)
// P(DOWN -> DOWN)
// P(DOWN -> SAME)
// P(SAME -> UP)
// P(SAME -> DOWN)
// P(SAME -> SAME)
//TODO include pan?
export default class SFRG extends CMG {
    randomSeed: number;
    midiUPUP: number;
    midiUPDOWN: number;
    midiUPSAME: number;
    midiDOWNUP: number;
    midiDOWNDOWN: number;
    midiDOWNSAME: number;
    midiSAMEUP: number;
    midiSAMEDOWN: number;
    midiSAMESAME: number;
    initialVolume: number; // %
    volumeUPUP: number;
    volumeUPDOWN: number;
    volumeUPSAME: number;
    volumeDOWNUP: number;
    volumeDOWNDOWN: number;
    volumeDOWNSAME: number;
    volumeSAMEUP: number;
    volumeSAMEDOWN: number;
    volumeSAMESAME: number;
    initialBPM: number; // BPM
    BPMUPUP: number;
    BPMUPDOWN: number;
    BPMUPSAME: number;
    BPMDOWNUP: number;
    BPMDOWNDOWN: number;
    BPMDOWNSAME: number;
    BPMSAMEUP: number;
    BPMSAMEDOWN: number;
    BPMSAMESAME: number;

    constructor(nextGenerator: number) {
        super(nextGenerator);
        this.type = 'SFRG';
        this.randomSeed = 55;
        this.midiUPUP = 0;
        this.midiUPDOWN = 0;
        this.midiUPSAME = 1;
        this.midiDOWNUP = 0;
        this.midiDOWNDOWN = 0;
        this.midiDOWNSAME = 1;
        this.midiSAMEUP = 0;
        this.midiSAMEDOWN = 0;
        this.midiSAMESAME = 1;
        this.initialVolume = 50;
        this.volumeUPUP = 0;
        this.volumeUPDOWN = 0;
        this.volumeUPSAME = 1;
        this.volumeDOWNUP = 0;
        this.volumeDOWNDOWN = 0;
        this.volumeDOWNSAME = 1;
        this.volumeSAMEUP = 0;
        this.volumeSAMEDOWN = 0;
        this.volumeSAMESAME = 1;
        this.initialBPM = 50;
        this.BPMUPUP = 0;
        this.BPMUPDOWN = 0;
        this.BPMUPSAME = 1;
        this.BPMDOWNUP = 0;
        this.BPMDOWNDOWN = 0;
        this.BPMDOWNSAME = 1;
        this.BPMSAMEUP = 0;
        this.BPMSAMEDOWN = 0;
        this.BPMSAMESAME = 1;
    }

    //TODO implement
    override copy(): SFRG {
        const newG = new SFRG(0);
        return newG;
    }

    //TODO implement
    override setAttribute(name: string, value: string): void {

    }  

    //TODO implement
    // getCurrentValue(time: number): { pitch: number, volume: number, pan: number } {
    //     let pitch: number = this.midi;
    //     let value: number = this.initialVolume;
    //     let pan: 
    // }
    
    //TODO implement
    override appendXML(doc: XMLDocument, elem: HTMLElement): void {
    }
}