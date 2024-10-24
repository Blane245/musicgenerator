import { sineModulator } from '../components/modulators/sinemodulator';
import CMG from "./cmg";
import { sawtoothModulator } from "../components/modulators/sawtoothmodulator";
import { squareModulator } from "../components/modulators/squaremodulator";
import { triangleModulator } from "../components/modulators/trianglemodulator";
import { Preset } from '../types/soundfonttypes';
import { getAttributeValue } from '../utils/xmlfunctions';
import { GENERATORTYPES } from '../types/types';
export default class SFPG extends CMG {
    presetName: string;
    preset: Preset | undefined;
    midi: number;
    FMType: string;
    FMAmplitude: number; // cents
    FMFrequency: number; // hz
    FMPhase: number; // degrees
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
    constructor(nextGenerator: number) {
        super(nextGenerator);
        this.presetName = '';
        this.preset = undefined;
        this.midi = 0;
        this.type = GENERATORTYPES.SFPG;
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

    override copy(): SFPG {
        const newG = new SFPG(0);
        newG.name = this.name;
        newG.startTime = this.startTime;
        newG.stopTime = this.stopTime;
        newG.mute = this.mute;
        newG.solo = this.solo;
        newG.type = this.type;
        newG.position = this.position;
        newG.presetName = this.presetName;
        newG.preset = this.preset;
        newG.midi = this.midi;
        newG.mute = this.mute;
        newG.position = this.position;
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
                this.type = value as GENERATORTYPES;
                break;
            case 'presetName':
                this.presetName = value;
                break;
            case 'midi':
                this.midi = parseFloat(value);
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

    getCurrentValues(time: number): { pitch: number, volume: number, pan: number } {
        let pitch: number = this.midi;
        switch (this.FMType) {
            case 'SINE':
                pitch = sineModulator(time, this.startTime, this.midi,
                    this.FMFrequency, this.FMAmplitude, this.FMPhase);
                break;
            case 'SAWTOOTH':
                pitch = sawtoothModulator(time, this.startTime, this.midi,
                    this.FMFrequency, this.FMAmplitude, this.FMPhase);
                break;
            case 'SQUARE':
                pitch = squareModulator(time, this.startTime, this.midi,
                    this.FMFrequency, this.FMAmplitude, this.FMPhase);
                break;
            case 'TRIANGLE':
                pitch = triangleModulator(time, this.startTime, this.midi,
                    this.FMFrequency, this.FMAmplitude, this.FMPhase);
                break;
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
        return ({ pitch: pitch, volume: volume, pan: pan });
    }
    override appendXML(doc: XMLDocument, elem: HTMLElement): void {
        elem.setAttribute('name', this.name);
        elem.setAttribute('startTime', this.startTime.toString());
        elem.setAttribute('stopTime', this.stopTime.toString());
        elem.setAttribute('solo', this.solo.toString());
        elem.setAttribute('mute', this.mute.toString());
        elem.setAttribute('position', this.position.toString());
        elem.setAttribute('type', GENERATORTYPES.SFPG);
        elem.setAttribute('presetName', this.presetName);
        elem.setAttribute('midi', this.midi.toString());
        elem.setAttribute('FMType', this.FMType.toString());
        elem.setAttribute('FMAmplitude', this.FMAmplitude.toString());
        elem.setAttribute('FMFrequency', this.FMFrequency.toString());
        elem.setAttribute('FMPhase', this.FMPhase.toString());
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
        this.type = GENERATORTYPES.SFPG;

        this.presetName = getAttributeValue(elem, 'presetName', 'string') as string;
        this.midi = getAttributeValue(elem, 'midi', 'int') as number;
        this.mute = (getAttributeValue(elem, 'mute', 'string') == 'true');
        this.position = getAttributeValue(elem, 'position', 'int') as number;
        this.FMType = getAttributeValue(elem, 'FMType', 'string') as string;
        this.FMAmplitude = getAttributeValue(elem, 'FMAmplitude', 'float') as number;
        this.FMFrequency = getAttributeValue(elem, 'FMFrequency', 'float') as number;
        this.FMPhase = getAttributeValue(elem, 'FMPhase', 'float') as number;
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