import { Preset } from "../types/soundfonttypes";
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
export default class SFRG extends CMG {
    randomSeed: number;
    preset: Preset | null;
    midi: number; // midi number
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
        this.randomSeed = 55;
        this.preset = null;
        this.midi = 60;
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

    generate(context: AudioContext, startTime: number, endTime: number): AudioBufferSourceNode | null {
        return null;
    }
    toXML(): string {
        const xml: string = '';
        return xml;
    }
}