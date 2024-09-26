import { Preset } from "../types/soundfonttypes";
import { MODULATOR } from "../types/types";
import CMG from "./cmg";
export default class SFPG extends CMG {
    presetName: string;
    preset: Preset | undefined;
    midi: number;
    FMType: string;
    FMAmplitude: number; // cents
    FMFrequency: number; // hz
    FMPhase: number; // degrees
    VMType: string;
    VMCenter: number; // %
    VMFrequency: number; // hz
    VMAmplitude: number; // %
    VMPhase: number; // degrees
    PMType: string;
    PMCenter: number; // -1, 1
    PMFrequency: number; // hz
    PMAmplitude: number; // -1, 1 (center applied, center +- amplitude cannot be outside -1, 1)
    PMPhase: number; // degrees
    constructor(nextGenerator: number) {
        super(nextGenerator);
        this.type = 'SFPG';
        this.presetName = '';
        this.preset = undefined;
        this.midi = 60;
        this.FMType = "SINE";
        this.FMAmplitude = 0;
        this.FMFrequency = 0;
        this.FMPhase = 0;
        this.VMType = "SINE";
        this.VMCenter = 50;
        this.VMFrequency = 0;
        this.VMAmplitude = 0;
        this.VMPhase = 0;
        this.PMType = "SINE";
        this.PMFrequency = 0;
        this.PMAmplitude = 0;
        this.PMCenter = 0;
        this.PMPhase = 0;
    }
    override appendXML(doc: XMLDocument, elem: HTMLElement ):void {
        elem.setAttribute('name', this.name);
        elem.setAttribute('startTime', this.startTime.toString());
        elem.setAttribute('stopTime', this.stopTime.toString());
        elem.setAttribute('type', 'SFPG');
        elem.setAttribute('presetName', this.presetName);
        elem.setAttribute('midi', this.midi.toString());
        elem.setAttribute('FMType', this.FMType.toString());
        elem.setAttribute('FMAmplitude', this.FMAmplitude.toString());
        elem.setAttribute('FMFrequency', this.FMFrequency.toString());
        elem.setAttribute('VMType', this.VMType.toString());
        elem.setAttribute('VMCenter', this.VMCenter.toString());
        elem.setAttribute('VMFrequency', this.VMFrequency.toString());
        elem.setAttribute('VMAmplitude', this.VMAmplitude.toString());
        elem.setAttribute('VMPhase', this.VMPhase.toString());
        elem.setAttribute('PMType', this.PMType.toString());
        elem.setAttribute('PMFrequency', this.PMFrequency.toString());
        elem.setAttribute('PMAmplitude', this.PMAmplitude.toString());
        elem.setAttribute('PMPhase', this.PMPhase.toString());
    }

    override copy(): SFPG {
        const newG = new SFPG(0);
        newG.name = this.name;
        newG.startTime = this.startTime;
        newG.stopTime = this.stopTime;
        newG.type = this.type;
        newG.presetName = this.presetName;
        newG.preset = this.preset;
        newG.midi = this.midi;
        newG.FMType = this.FMType;
        newG.FMAmplitude = this.FMAmplitude;
        newG.FMFrequency = this.FMFrequency;
        newG.FMPhase = this.FMPhase;
        newG.VMCenter = this.VMCenter;
        newG.VMType = this.VMType;
        newG.VMAmplitude = this.VMAmplitude;
        newG.VMFrequency = this.VMFrequency;
        newG.VMPhase = this.VMPhase;
        newG.PMCenter = this.PMCenter;
        newG.PMType = this.PMType;
        newG.PMAmplitude = this.PMAmplitude;
        newG.PMFrequency = this.PMFrequency;
        newG.PMPhase = this.PMPhase;
        return newG;
 
    }

    override setAttribute( name: string, value: string): void {
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
            case 'presetName':
                this.presetName = value;
                break;
            case 'midi':
                this.midi = parseInt(value);
                break;
            case 'FMType':
                this.FMType = value;
                break;
            case 'FMAmplitude':
                this.FMAmplitude = parseFloat(value);
                break;
            case 'FMFrequency':
                this.FMFrequency = parseFloat(value);
                break;
            case 'FMPhase':
                this.FMPhase = parseFloat(value);
                break;
            case 'VMCenter':
                this.VMCenter = parseFloat(value);
                break;
            case 'VMType':
                this.VMType = value;
                break;
            case 'VMAmplitude':
                this.VMAmplitude = parseFloat(value);
                break;
            case 'VMFrequency':
                this.VMFrequency = parseFloat(value);
                break;
            case 'VMPhase':
                this.VMPhase = parseFloat(value);
                break;
            case 'PMCenter':
                this.PMCenter = parseFloat(value);
                break;
            case 'PMType':
                this.PMType = value;
                break;
            case 'PMAmplitude':
                this.PMAmplitude = parseFloat(value);
                break;
            case 'PMFrequency':
                this.PMFrequency = parseFloat(value);
                break;
            case 'PMPhase':
                this.PMPhase = parseFloat(value);
                break;
            default:
                break;  
        }

    }
}

    // generate(context: AudioContext, startTime: number, endTime: number): AudioBufferSourceNode | null {
    //     return null;
    // }
    //     let result: number = 0;

    //     // use the appropriate modulator for 
    //     const modulate =
    //         (type: MODULATOR, modulationClass: MODULATORCLASS, time: number, startTime: number): number => {
    //             let center: number = 0;
    //             let frequency: number = 0;
    //             let amplitude: number = 0;
    //             let phase: number = 0;
    //             if (modulationClass == MODULATORCLASS.Frequency) {
    //                 center = this.centerPitch;
    //                 frequency = this.FMFrequency;
    //                 amplitude = this.FMAmplitude;
    //                 phase = this.FMPhase;
    //             } else if (modulationClass == MODULATORCLASS.Volume) {
    //                 center = this.VMCenter;
    //                 frequency = this.VMFrequency;
    //                 amplitude = this.VMAmplitude;
    //                 phase = this.VMPhase;

    //             } else if (modulationClass == MODULATORCLASS.Pan) {
    //                 center = this.PMCenter;
    //                 frequency = this.PMFrequency;
    //                 amplitude = this.PMAmplitude;
    //                 phase = this.PMPhase;
    //             }
    //             switch (type) {
    //                 case MODULATOR.SINE:
    //                     result = sineModulator(
    //                         time, startTime, center, frequency, amplitude, phase);
    //                     break;
    //                 case MODULATOR.SAWTOOTH:
    //                     result = sawtoothModulator(
    //                         time, startTime, center, frequency, amplitude, phase);
    //                     break;
    //                 case MODULATOR.SQUARE:
    //                     result = squareModulator(
    //                         time, startTime, center, frequency, amplitude, phase);
    //                     break;
    //                 case MODULATOR.TRIANGLE:
    //                     result = triangleModulator(
    //                         time, startTime, center, frequency, amplitude, phase);
    //                     break;
    //                 default: break;
    //             }
    //             return result;
    //         }


    //     // get the sample buffer
    //     const { source } = getBufferSourceNodeFromSample(context, this.preset as Preset, this.midi);

    //     // get the modulation values for each time 

        
    //     const FMValue = modulate(this.FMType, MODULATORCLASS.Frequency, time, startTime);
    //     const VMValue = modulate(this.VMType, MODULATORCLASS.Volume, time, startTime);
    //     const PMValue = modulate(this.PMType, MODULATORCLASS.Pan, time, startTime);


    // }