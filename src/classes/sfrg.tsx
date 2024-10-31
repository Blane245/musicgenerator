import { Preset } from "../types/soundfonttypes";
import { AttributeRange, EPS, GENERATORTYPE, MarkovProbabilities, MARKOVSTATE, RandomSFTransitons, REPEATOPTION } from "../types/types";
import CMG from "./cmg";
import { getAttributeValue, getElementElement } from "../utils/xmlfunctions";
import { rand } from "../utils/seededrandom";

export default class SFRG extends CMG {
    presetName: string;
    preset: Preset | undefined;
    repeat: REPEATOPTION;
    midi: number;
    seed: string;
    midiT: RandomSFTransitons; // midi
    speedT: RandomSFTransitons; // BPM
    volumeT: RandomSFTransitons; // %
    panT: RandomSFTransitons; // -1 +1

    constructor(nextGenerator: number) {
        super(nextGenerator);
        this.type = GENERATORTYPE.SFRG;
        this.presetName = '';
        this.preset = undefined;
        this.repeat = REPEATOPTION.Sample;
        this.midi = 0;
        this.seed = this.name;
        this.midiT = {
            currentState: MARKOVSTATE.same,
            currentValue: 0,
            startValue: 0,
            range: { lo: 0, hi: 127, step: 1 },
            same: { same: 1.0, up: 0.0, down: 0.0 },
            up: { same: 1.0, up: 0.0, down: 0.0 },
            down: { same: 1.0, up: 0.0, down: 0.0 },
        }
        this.speedT = {
            currentState: MARKOVSTATE.same,
            currentValue: 60,
            startValue: 60,
            range: { lo: 20, hi: 500, step: 1 },
            same: { same: 1.0, up: 0.0, down: 0.0 },
            up: { same: 1.0, up: 0.0, down: 0.0 },
            down: { same: 1.0, up: 0.0, down: 0.0 },
        }
        this.volumeT = {
            currentState: MARKOVSTATE.same,
            currentValue: 50,
            startValue: 50,
            range: { lo: 0, hi: 100, step: 1 },
            same: { same: 1.0, up: 0.0, down: 0.0 },
            up: { same: 1.0, up: 0.0, down: 0.0 },
            down: { same: 1.0, up: 0.0, down: 0.0 },
        }
        this.panT = {
            currentState: MARKOVSTATE.same,
            currentValue: 0,
            startValue: 0,
            range: { lo: -1, hi: 1, step: 0.1 },
            same: { same: 1.0, up: 0.0, down: 0.0 },
            up: { same: 1.0, up: 0.0, down: 0.0 },
            down: { same: 1.0, up: 0.0, down: 0.0 },
        }
    }

    override copy(): SFRG {
        const newG = new SFRG(0);
        newG.name = this.name;
        newG.startTime = this.startTime;
        newG.stopTime = this.stopTime;
        newG.type = this.type;
        newG.seed = this.seed;
        newG.presetName = this.presetName;
        newG.preset = this.preset;
        newG.repeat = this.repeat;
        newG.midi = this.midi;
        newG.mute = this.mute;
        newG.position = this.position;
        newG.midiT = copyTransitions(this.midiT);
        newG.speedT = copyTransitions(this.speedT);
        newG.volumeT = copyTransitions(this.volumeT);
        newG.panT = copyTransitions(this.panT);
        return newG;

        function copyTransitions(transition: RandomSFTransitons): RandomSFTransitons {
            const { lo, hi, step } = transition.range;
            const t: RandomSFTransitons = {
                currentState: transition.currentState,
                currentValue: transition.currentValue,
                startValue: transition.startValue,
                range: { lo, hi, step },
                same: copyProbabilities(transition.same),
                up: copyProbabilities(transition.up),
                down: copyProbabilities(transition.down),
            }
            return t;
        }

        function copyProbabilities(probabilities: MarkovProbabilities): MarkovProbabilities {
            const { same, up, down } = probabilities;
            return ({ same, up, down });
        }
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
            case 'type':
                this.type = GENERATORTYPE.SFRG;
                break;
            case 'seed':
                this.seed = value;
                break;
            case 'presetName':
                this.presetName = value;
                break;
            case 'repeat':
                this.repeat = value as REPEATOPTION;
                break;
            case 'midi':
                this.midi = parseFloat(value);
                this.midiT.startValue = this.midi;
                break;
            case 'midiT.range.lo':
                this.midiT.range.lo = parseFloat(value); break;
            case 'midiT.range.hi':
                this.midiT.range.hi = parseFloat(value); break;
            case 'midiT.range.step':
                this.midiT.range.step = parseFloat(value); break;
            case 'midiT.same.same':
                this.midiT.same.same = parseFloat(value); break;
            case 'midiT.same.up':
                this.midiT.same.up = parseFloat(value); break;
            case 'midiT.same.down':
                this.midiT.same.down = parseFloat(value); break;
            case 'midiT.up.same':
                this.midiT.up.same = parseFloat(value); break;
            case 'midiT.up.up':
                this.midiT.up.up = parseFloat(value); break;
            case 'midiT.up.down':
                this.midiT.up.down = parseFloat(value); break;
            case 'midiT.down.same':
                this.midiT.down.same = parseFloat(value); break;
            case 'midiT.down.up':
                this.midiT.down.up = parseFloat(value); break;
            case 'midiT.down.down':
                this.midiT.down.down = parseFloat(value); break;

            case 'speedT.startValue':
                this.speedT.startValue = parseFloat(value); break;
            case 'speedT.range.lo':
                this.speedT.range.lo = parseFloat(value); break;
            case 'speedT.range.hi':
                this.speedT.range.hi = parseFloat(value); break;
            case 'speedT.range.step':
                this.speedT.range.step = parseFloat(value); break;
            case 'speedT.same.same':
                this.speedT.same.same = parseFloat(value); break;
            case 'speedT.same.up':
                this.speedT.same.up = parseFloat(value); break;
            case 'speedT.same.down':
                this.speedT.same.down = parseFloat(value); break;
            case 'speedT.up.same':
                this.speedT.up.same = parseFloat(value); break;
            case 'speedT.up.up':
                this.speedT.up.up = parseFloat(value); break;
            case 'speedT.up.down':
                this.speedT.up.down = parseFloat(value); break;
            case 'speedT.down.same':
                this.speedT.down.same = parseFloat(value); break;
            case 'speedT.down.up':
                this.speedT.down.up = parseFloat(value); break;
            case 'speedT.down.down':
                this.speedT.down.down = parseFloat(value); break;

            case 'volumeT.startValue':
                this.volumeT.startValue = parseFloat(value); break;
            case 'volumeT.range.lo':
                this.volumeT.range.lo = parseFloat(value); break;
            case 'volumeT.range.hi':
                this.volumeT.range.hi = parseFloat(value); break;
            case 'volumeT.range.step':
                this.volumeT.range.step = parseFloat(value); break;
            case 'volumeT.same.same':
                this.volumeT.same.same = parseFloat(value); break;
            case 'volumeT.same.up':
                this.volumeT.same.up = parseFloat(value); break;
            case 'volumeT.same.down':
                this.volumeT.same.down = parseFloat(value); break;
            case 'volumeT.up.same':
                this.volumeT.up.same = parseFloat(value); break;
            case 'volumeT.up.up':
                this.volumeT.up.up = parseFloat(value); break;
            case 'volumeT.up.down':
                this.volumeT.up.down = parseFloat(value); break;
            case 'volumeT.down.same':
                this.volumeT.down.same = parseFloat(value); break;
            case 'volumeT.down.up':
                this.volumeT.down.up = parseFloat(value); break;
            case 'volumeT.down.down':
                this.volumeT.down.down = parseFloat(value); break;

            case 'panT.startValue':
                this.panT.startValue = parseFloat(value); break;
            case 'panT.range.lo':
                this.panT.range.lo = parseFloat(value); break;
            case 'panT.range.hi':
                this.panT.range.hi = parseFloat(value); break;
            case 'panT.range.step':
                this.panT.range.step = parseFloat(value); break;
            case 'panT.same.same':
                this.panT.same.same = parseFloat(value); break;
            case 'panT.same.up':
                this.panT.same.up = parseFloat(value); break;
            case 'panT.same.down':
                this.panT.same.down = parseFloat(value); break;
            case 'panT.up.same':
                this.panT.up.same = parseFloat(value); break;
            case 'panT.up.up':
                this.panT.up.up = parseFloat(value); break;
            case 'panT.up.down':
                this.panT.up.down = parseFloat(value); break;
            case 'panT.down.same':
                this.panT.down.same = parseFloat(value); break;
            case 'panT.down.up':
                this.panT.down.up = parseFloat(value); break;
            case 'panT.down.down':
                this.panT.down.down = parseFloat(value); break;
        }

    }

    getCurrentValue(): { midi: number, speed: number, volume: number, pan: number } {

        function changeState(attribute: RandomSFTransitons): MARKOVSTATE {
            const x: number = rand();
            // console.log(x);
            let newState: MARKOVSTATE = MARKOVSTATE.same;
            switch (attribute.currentState) {
                case MARKOVSTATE.same:
                    if (x <= attribute.same.same)
                        newState = MARKOVSTATE.same;
                    else if (x <= attribute.same.same + attribute.same.up)
                        newState = MARKOVSTATE.up;
                    else
                        newState = MARKOVSTATE.down;
                    break;
                case MARKOVSTATE.up:
                    if (x <= attribute.up.same)
                        newState = MARKOVSTATE.same;
                    else if (x <= attribute.up.same + attribute.up.up)
                        newState = MARKOVSTATE.up;
                    else
                        newState = MARKOVSTATE.down;
                    break;
                case MARKOVSTATE.down:
                    if (x <= attribute.down.same)
                        newState = MARKOVSTATE.same;
                    else if (x <= attribute.down.same + attribute.down.up)
                        newState = MARKOVSTATE.up;
                    else
                        newState = MARKOVSTATE.down;
                    break;
                default:
                    break;
            }
            return newState;

        }
        function getNewValue(currentValue: number, limits: AttributeRange, state: MARKOVSTATE): number {
            let newValue = currentValue;
            switch (state) {
                case MARKOVSTATE.same:
                    break;
                case MARKOVSTATE.up:
                    newValue += limits.step;
                    newValue = Math.min(newValue, limits.hi);
                    if (Math.abs(newValue - currentValue) < EPS)
                        newValue -= limits.step
                    break;
                case MARKOVSTATE.down:
                    newValue -= limits.step;
                    newValue = Math.max(newValue, limits.lo);
                    if (Math.abs(newValue - currentValue) < EPS)
                        newValue += limits.step
                    break;
                default:
                    break;
            }
            return newValue;
        }

        this.midiT.currentState = changeState(this.midiT);
        this.midiT.currentValue = getNewValue(this.midiT.currentValue, this.midiT.range, this.midiT.currentState);
        this.speedT.currentState = changeState(this.speedT);
        this.speedT.currentValue = getNewValue(this.speedT.currentValue, this.speedT.range, this.speedT.currentState);
        this.volumeT.currentState = changeState(this.volumeT);
        this.volumeT.currentValue = getNewValue(this.volumeT.currentValue, this.volumeT.range, this.volumeT.currentState);
        this.panT.currentState = changeState(this.panT);
        this.panT.currentValue = getNewValue(this.panT.currentValue, this.panT.range, this.panT.currentState);
        return {
            midi: this.midiT.currentValue,
            speed: this.speedT.currentValue,
            volume: this.volumeT.currentValue,
            pan: this.panT.currentValue,
        }
    }

    override appendXML(doc: XMLDocument, elem: HTMLElement): void {
        elem.setAttribute('name', this.name);
        elem.setAttribute('startTime', this.startTime.toString());
        elem.setAttribute('stopTime', this.stopTime.toString());
        elem.setAttribute('type', this.type);
        elem.setAttribute('solo', this.solo.toString());
        elem.setAttribute('mute', this.mute.toString());
        elem.setAttribute('position', this.position.toString());
        elem.setAttribute('type', GENERATORTYPE.SFRG);
        elem.setAttribute('seed', this.seed);
        elem.setAttribute('presetName', this.presetName);
        elem.setAttribute('repeat', this.repeat);
        elem.setAttribute('midi', this.midi.toString());
        elem.appendChild(addTransitionAttributes('midiT', this.midiT));
        elem.appendChild(addTransitionAttributes('speedT', this.speedT));
        elem.appendChild(addTransitionAttributes('volumeT', this.volumeT));
        elem.appendChild(addTransitionAttributes('panT', this.panT));

        function addTransitionAttributes(name: string, transition: RandomSFTransitons): HTMLElement {
            const tElement: HTMLElement = doc.createElement(name);
            tElement.setAttribute('startValue', transition.startValue.toString())
            const range: HTMLElement = doc.createElement('range');
            range.setAttribute('lo', transition.range.lo.toString());
            range.setAttribute('hi', transition.range.hi.toString());
            range.setAttribute('step', transition.range.step.toString());
            const same: HTMLElement = doc.createElement('same');
            same.setAttribute('same', transition.same.same.toString());
            same.setAttribute('up', transition.same.up.toString());
            same.setAttribute('down', transition.same.down.toString());
            const up: HTMLElement = doc.createElement('up');
            up.setAttribute('same', transition.up.same.toString());
            up.setAttribute('up', transition.up.up.toString());
            up.setAttribute('down', transition.up.down.toString());
            const down: HTMLElement = doc.createElement('down');
            down.setAttribute('same', transition.down.same.toString());
            down.setAttribute('up', transition.down.up.toString());
            down.setAttribute('down', transition.down.down.toString());
            tElement.appendChild(range);
            tElement.appendChild(same);
            tElement.appendChild(up);
            tElement.appendChild(down);
            return tElement;
        }
    }

    override getXML(doc: XMLDocument, elem: Element): void {
        this.name = getAttributeValue(elem, 'name', 'string') as string;
        this.startTime = getAttributeValue(elem, 'startTime', 'float') as number;
        this.stopTime = getAttributeValue(elem, 'stopTime', 'float') as number;
        this.mute = (getAttributeValue(elem, 'mute', 'string') == 'true');
        this.solo = (getAttributeValue(elem, 'solo', 'string') == 'true');
        this.position = getAttributeValue(elem, 'position', 'int') as number;
        this.type = GENERATORTYPE.SFRG;
        this.presetName = getAttributeValue(elem, 'presetName', 'string') as string;
        this.repeat = getAttributeValue(elem, 'repeat', 'string') as REPEATOPTION;
        this.seed = getAttributeValue(elem, 'seed', 'string') as string;
        this.midi = getAttributeValue(elem, 'midi', 'int') as number;
        const midiTElem: Element = getElementElement(elem, 'midiT');
        const midiTChildren: HTMLCollection = midiTElem.children;
        const speedTElem: Element = getElementElement(elem, 'speedT');
        const speedTChildren: HTMLCollection = speedTElem.children;
        const volumeTElem: Element = getElementElement(elem, 'volumeT');
        const volumeTChildren: HTMLCollection = volumeTElem.children;
        const panTElem: Element = getElementElement(elem, 'panT');
        const panTChildren: HTMLCollection = panTElem.children;

        const { midiT, speedT, volumeT, panT } = getTransitions(midiTChildren, speedTChildren, volumeTChildren, panTChildren);
        this.midiT = midiT
        this.midiT.startValue = getAttributeValue(midiTElem, 'startValue', 'float') as number;
        this.speedT = speedT;
        this.speedT.startValue = getAttributeValue(speedTElem, 'startValue', 'float') as number;
        this.volumeT = volumeT;
        this.volumeT.startValue = getAttributeValue(volumeTElem, 'startValue', 'float') as number;
        this.panT = panT;
        this.panT.startValue = getAttributeValue(panTElem, 'startValue', 'float') as number;


        function getTransitions(
            midiTChildren: HTMLCollection, speedTChildren: HTMLCollection, volumeTChildren: HTMLCollection, panTChildren: HTMLCollection
        ): { midiT: RandomSFTransitons, speedT: RandomSFTransitons, volumeT: RandomSFTransitons, panT: RandomSFTransitons } {
            const midiT: RandomSFTransitons = {
                currentState: MARKOVSTATE.same,
                currentValue: 0,
                startValue: 0,
                range: { lo: 0, hi: 0, step: 0 },
                same: { same: 1.0, up: 0.0, down: 0.0 },
                up: { same: 1.0, up: 0.0, down: 0.0 },
                down: { same: 1.0, up: 0.0, down: 0.0 },
            }
            const speedT: RandomSFTransitons = {
                currentState: MARKOVSTATE.same,
                currentValue: 0,
                startValue: 0,
                range: { lo: 0, hi: 0, step: 0 },
                same: { same: 1.0, up: 0.0, down: 0.0 },
                up: { same: 1.0, up: 0.0, down: 0.0 },
                down: { same: 1.0, up: 0.0, down: 0.0 },
            }
            const volumeT: RandomSFTransitons = {
                currentState: MARKOVSTATE.same,
                currentValue: 0,
                startValue: 0,
                range: { lo: 0, hi: 0, step: 0 },
                same: { same: 1.0, up: 0.0, down: 0.0 },
                up: { same: 1.0, up: 0.0, down: 0.0 },
                down: { same: 1.0, up: 0.0, down: 0.0 },
            }
            const panT: RandomSFTransitons = {
                currentState: MARKOVSTATE.same,
                currentValue: 0,
                startValue: 0,
                range: { lo: 0, hi: 0, step: 0 },
                same: { same: 1.0, up: 0.0, down: 0.0 },
                up: { same: 1.0, up: 0.0, down: 0.0 },
                down: { same: 1.0, up: 0.0, down: 0.0 },
            }
            function getRangeValues(child: Element): AttributeRange {
                const lo: number = getAttributeValue(child, 'lo', 'float') as number;
                const hi: number = getAttributeValue(child, 'hi', 'float') as number;
                const step: number = getAttributeValue(child, 'step', 'float') as number;
                return ({ lo, hi, step });
            }
            function getTransitionValues(child: Element): MarkovProbabilities {
                const same: number = getAttributeValue(child, 'same', 'float') as number;
                const up: number = getAttributeValue(child, 'up', 'float') as number;
                const down: number = getAttributeValue(child, 'down', 'float') as number;
                return ({ same, up, down });
            }
            for (let i = 0; i < midiTChildren.length; i++) {
                const child = midiTChildren[i];
                switch (child.tagName) {
                    case 'range':
                        const { lo, hi, step } = getRangeValues(child)
                        midiT.range.lo = lo;
                        midiT.range.hi = hi;
                        midiT.range.step = step;
                        break;
                    case 'same': {
                        const { same, up, down } = getTransitionValues(child)
                        midiT.same.same = same;
                        midiT.same.up = up;
                        midiT.same.down = down;
                    }
                        break;
                    case 'up': {
                        const { same, up, down } = getTransitionValues(child)
                        midiT.up.same = same;
                        midiT.up.up = up;
                        midiT.up.down = down;
                    }
                        break;
                    case 'down': {
                        const { same, up, down } = getTransitionValues(child)
                        midiT.down.same = same;
                        midiT.down.up = up;
                        midiT.down.down = down;
                        break;
                    }
                }
            }
            for (let i = 0; i < speedTChildren.length; i++) {
                const child = speedTChildren[i];
                switch (child.tagName) {
                    case 'range':
                        const { lo, hi, step } = getRangeValues(child)
                        speedT.range.lo = lo;
                        speedT.range.hi = hi;
                        speedT.range.step = step;
                        break;
                    case 'same': {
                        const { same, up, down } = getTransitionValues(child)
                        speedT.same.same = same;
                        speedT.same.up = up;
                        speedT.same.down = down;
                    }
                        break;
                    case 'up': {
                        const { same, up, down } = getTransitionValues(child)
                        speedT.up.same = same;
                        speedT.up.up = up;
                        speedT.up.down = down;
                    }
                        break;
                    case 'down': {
                        const { same, up, down } = getTransitionValues(child)
                        speedT.down.same = same;
                        speedT.down.up = up;
                        speedT.down.down = down;
                        break;
                    }
                }
            }
            for (let i = 0; i < volumeTChildren.length; i++) {
                const child = volumeTChildren[i];
                switch (child.tagName) {
                    case 'range':
                        const { lo, hi, step } = getRangeValues(child)
                        volumeT.range.lo = lo;
                        volumeT.range.hi = hi;
                        volumeT.range.step = step;
                        break;
                    case 'same': {
                        const { same, up, down } = getTransitionValues(child)
                        volumeT.same.same = same;
                        volumeT.same.up = up;
                        volumeT.same.down = down;
                    }
                        break;
                    case 'up': {
                        const { same, up, down } = getTransitionValues(child)
                        volumeT.up.same = same;
                        volumeT.up.up = up;
                        volumeT.up.down = down;
                    }
                        break;
                    case 'down': {
                        const { same, up, down } = getTransitionValues(child)
                        volumeT.down.same = same;
                        volumeT.down.up = up;
                        volumeT.down.down = down;
                        break;
                    }
                }
            }
            for (let i = 0; i < panTChildren.length; i++) {
                const child = panTChildren[i];
                switch (child.tagName) {
                    case 'range':
                        const { lo, hi, step } = getRangeValues(child)
                        panT.range.lo = lo;
                        panT.range.hi = hi;
                        panT.range.step = step;
                        break;
                    case 'same': {
                        const { same, up, down } = getTransitionValues(child)
                        panT.same.same = same;
                        panT.same.up = up;
                        panT.same.down = down;
                    }
                        break;
                    case 'up': {
                        const { same, up, down } = getTransitionValues(child)
                        panT.up.same = same;
                        panT.up.up = up;
                        panT.up.down = down;
                    }
                        break;
                    case 'down': {
                        const { same, up, down } = getTransitionValues(child)
                        panT.down.same = same;
                        panT.down.up = up;
                        panT.down.down = down;
                        break;
                    }
                }
            }
            return ({ midiT, speedT, volumeT, panT })

        }
    }
}