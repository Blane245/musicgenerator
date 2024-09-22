import { Preset } from "../types/soundfonttypes";
import { MODULATOR } from "../types/types";
import CMG from "./cmg";
export default class SFPG extends CMG {
    preset: Preset | null;
    midi: number;
    FMType: MODULATOR;
    FMAmplitude: number; // cents
    FMFrequency: number; // hz
    FMPhase: number; // degrees
    VMType: MODULATOR;
    VMCenter: number; // %
    VMFrequency: number; // hz
    VMAmplitude: number; // %
    VMPhase: number; // degrees
    PMType: MODULATOR;
    PMCenter: number; // -1, 1
    PMFrequency: number; // hz
    PMAmplitude: number; // -1, 1 (center applied, center +- amplitude cannot be outside -1, 1)
    PMPhase: number; // degrees
    constructor(nextGenerator: number) {
        super(nextGenerator);
        this.preset = null;
        this.midi = 60;
        this.FMType = MODULATOR.SINE;
        this.FMAmplitude = 0;
        this.FMFrequency = 0;
        this.FMPhase = 0;
        this.VMType = MODULATOR.SINE;
        this.VMCenter = 50;
        this.VMFrequency = 0;
        this.VMAmplitude = 0;
        this.VMPhase = 0;
        this.PMType = MODULATOR.SINE;
        this.PMFrequency = 0;
        this.PMAmplitude = 0;
        this.PMCenter = 0;
        this.PMPhase = 0;
    }

    generate(context: AudioContext, startTime: number, endTime: number): AudioBufferSourceNode | null {
        return null;
    }
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
    toXML(): string {
        const xml: string = '';
        return xml;
    }
}