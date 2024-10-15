

// a noise generator with different types of noise
// starting off with white and gaussian
//  the white noise generator uses a standard sample 
//  rate and a nominal power level
// 
// the daussian noise generator has a centeral frequency
// with a standard deviation

import { sineModulator } from "../components/modulators/sinemodulator";
import { NOISETYPE } from "../types/types";
import CMG from "./cmg";
import { sawtoothModulator } from "../components/modulators/sawtoothmodulator";
import { squareModulator } from "../components/modulators/squaremodulator";
import { triangleModulator } from "../components/modulators/trianglemodulator";
import { gaussianRandom } from "../utils/gaussianrandom";
import { getAttributeValue } from "../utils/xmlfunctions";

const SAMPLERATE: number = 20000;
export default class Noise extends CMG {
    noiseType: string;
    mean: number; // center frequency for gaussian noise (Hz)
    std: number; // gaussian signal level noise standard devision (amplitude)
    sampleRate: number;
    VMType: string;
    VMCenter: number; // 0 100
    VMFrequency: number; // hz
    VMAmplitude: number; // 0 - 100
    VMPhase: number; // degrees
    PMType: string;
    PMCenter: number; // -50, 50
    PMFrequency: number; // hz
    PMAmplitude: number; // -50 50 (center applied, center +- amplitude cannot be outside -1, 1)
    PMPhase: number; // degrees

    constructor(next: number) {
        super(next);
        this.type = 'Noise';
        this.noiseType = NOISETYPE.white;
        this.mean = 440;
        this.std = 0;
        this.sampleRate = SAMPLERATE;
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

    override copy(): Noise {
        const n = new Noise(0);
        n.name = this.name;
        n.startTime = this.startTime;
        n.stopTime = this.stopTime;
        n.mute = this.mute;
        n.solo = this.solo;
        n.type = this.type;
        n.position = this.position;
        n.noiseType = this.noiseType;
        n.mean = this.mean;
        n.std = this.std;
        n.sampleRate = this.sampleRate;
        n.VMCenter = this.VMCenter;
        n.VMType = this.VMType;
        n.VMAmplitude = this.VMAmplitude;
        n.VMFrequency = this.VMFrequency;
        n.VMPhase = this.VMPhase;
        n.PMCenter = this.PMCenter;
        n.PMType = this.PMType;
        n.PMAmplitude = this.PMAmplitude;
        n.PMFrequency = this.PMFrequency;
        n.PMPhase = this.PMPhase;
        return n;
    }

    override setAttribute(name: string, value: string): void {
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
            case 'noiseType':
                this.noiseType = value;
                break;
            case 'mean':
                this.mean = parseFloat(value)
                break;
            case 'std':
                this.std = parseFloat(value)
                break;
            case 'sampleRate':
                this.sampleRate = parseFloat(value)
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

        }
    }

    // return noise for length of time specified 
    getCurrentValue(time: number, timeInterval: number): { sample: Float32Array, volume: number, pan: number } {
        const sampleCount = timeInterval * this.sampleRate;
        const timeStep: number = 1 / this.sampleRate;
        const sample: Float32Array = new Float32Array(sampleCount);
        if (this.noiseType == NOISETYPE.white) {
            // white noise generator
            for (let i = 0; i < sampleCount; i++) {
                sample[i] = (Math.random() - 0.5);
            }
        } else if (this.noiseType == NOISETYPE.gaussian) {
            // gaussian noise generator
            for (let i = 0; i < sampleCount; i++) {
                const noise: number = gaussianRandom(0.0, this.std);
                const freq = this.mean;
                const deltaT: number = i * timeStep + time;
                sample[i] = Math.cos(2.0 * Math.PI * freq * deltaT) + noise;
                if (i == 0) {
                // console.log(
                //     'freq', freq,
                //     'i', i,
                //     'deltaT', deltaT,
                //     'sample[i]', sample[i]
                // )
            }
            }
        }

        let volume: number = this.VMCenter;
        switch (this.VMType) {
            case 'SINE':
                volume = sineModulator(time, this.startTime, this.VMCenter,
                    this.VMFrequency, this.VMAmplitude, this.VMPhase);
                break;
            case 'SAWTOOTH':
                volume = sawtoothModulator(time, this.startTime, this.VMCenter,
                    this.VMFrequency, this.VMAmplitude, this.VMPhase);
                break;
            case 'SQUARE':
                volume = squareModulator(time, this.startTime, this.VMCenter,
                    this.VMFrequency, this.VMAmplitude, this.VMPhase);
                break;
            case 'TRIANGLE':
                volume = triangleModulator(time, this.startTime, this.VMCenter,
                    this.VMFrequency, this.VMAmplitude, this.VMPhase);
                break;
        }
        let pan: number = this.VMCenter;
        switch (this.VMType) {
            case 'SINE':
                pan = sineModulator(time, this.startTime, this.PMCenter,
                    this.PMFrequency, this.PMAmplitude, this.PMPhase);
                break;
            case 'SAWTOOTH':
                pan = sawtoothModulator(time, this.startTime, this.PMCenter,
                    this.PMFrequency, this.PMAmplitude, this.PMPhase);
                break;
            case 'SQUARE':
                pan = squareModulator(time, this.startTime, this.PMCenter,
                    this.PMFrequency, this.PMAmplitude, this.PMPhase);
                break;
            case 'TRIANGLE':
                pan = triangleModulator(time, this.startTime, this.PMCenter,
                    this.PMFrequency, this.PMAmplitude, this.PMPhase);
                break;
        }
        return ({ sample: sample, volume: volume, pan: pan });

    }

    override appendXML(doc: XMLDocument, elem: HTMLElement): void {
        elem.setAttribute('name', this.name);
        elem.setAttribute('startTime', this.startTime.toString());
        elem.setAttribute('stopTime', this.stopTime.toString());
        elem.setAttribute('solo', this.solo.toString());
        elem.setAttribute('mute', this.mute.toString());
        elem.setAttribute('position', this.position.toString());
        elem.setAttribute('type', 'Noise');
        elem.setAttribute('noiseType', this.noiseType);
        elem.setAttribute('mean', this.mean.toString());
        elem.setAttribute('std', this.std.toString());
        elem.setAttribute('sampleRate', this.sampleRate.toString());
        elem.setAttribute('VMType', this.VMType.toString());
        elem.setAttribute('VMCenter', this.VMCenter.toString());
        elem.setAttribute('VMFrequency', this.VMFrequency.toString());
        elem.setAttribute('VMAmplitude', this.VMAmplitude.toString());
        elem.setAttribute('VMPhase', this.VMPhase.toString());
        elem.setAttribute('PMType', this.PMType.toString());
        elem.setAttribute('PMCenter', this.PMCenter.toString());
        elem.setAttribute('PMFrequency', this.PMFrequency.toString());
        elem.setAttribute('PMAmplitude', this.PMAmplitude.toString());
        elem.setAttribute('PMPhase', this.PMPhase.toString());
    }

    override getXML(doc: XMLDocument, elem: Element): void {
        this.name = getAttributeValue(elem, 'name', 'string') as string;
        this.startTime = getAttributeValue(elem, 'startTime', 'float') as number;
        this.stopTime = getAttributeValue(elem, 'stopTime', 'float') as number;
        this.mute = (getAttributeValue(elem, 'mute', 'string') == 'true');
        this.solo = (getAttributeValue(elem, 'solo', 'string') == 'true');
        this.position = getAttributeValue(elem, 'position', 'int') as number;
        this.type = 'Noise';
        this.noiseType = getAttributeValue(elem, 'noiseType', 'string') as string;
        this.mean = getAttributeValue(elem, 'mean', 'float') as number;
        this.std = getAttributeValue(elem, 'std', 'float') as number;
        this.sampleRate = getAttributeValue(elem, 'sampleRate', 'float') as number;
        this.VMCenter = getAttributeValue(elem, 'VMCenter', 'float') as number;
        this.VMType = getAttributeValue(elem, 'VMType', 'string') as string;
        this.VMAmplitude = getAttributeValue(elem, 'VMAmplitude', 'float') as number;
        this.VMFrequency = getAttributeValue(elem, 'VMFrequency', 'float') as number;
        this.VMPhase = getAttributeValue(elem, 'VMPhase', 'float') as number;
        this.PMCenter = getAttributeValue(elem, 'PMCenter', 'float') as number;
        this.PMType = getAttributeValue(elem, 'PMType', 'string') as string;
        this.PMAmplitude = getAttributeValue(elem, 'PMAmplitude', 'float') as number;
        this.PMFrequency = getAttributeValue(elem, 'PMFrequency', 'float') as number;
        this.PMPhase = getAttributeValue(elem, 'PMPhase', 'float') as number;
    }
}