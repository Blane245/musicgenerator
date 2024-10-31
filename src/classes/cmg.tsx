import { GENERATORTYPE } from "../types/types";
import { getAttributeValue } from "../utils/xmlfunctions";

/**
 * Parent class of all computer music generators
 *
 * @export
 * @class CMG
 * @type {CMG}
 */
export default class CMG {
    /**
     * The name of the generator
     *
     * @type {string}
     */
    name: string;
    /**
     * The start time of the generator (seconds)
     *
     * @type {number}
     */
    startTime: number;
    /**
     * The stop time of the generator (seconds)
     *
     * @type {number}
     */
    stopTime: number;
    /**
     * The type of the generator
     *
     * @type {GENERATORTYPE}
     */
    type: GENERATORTYPE;
    /**
     * Mute status of the generator
     *
     * @type {boolean}
     */
    mute: boolean;
    /**
     * Solo status of the generator
     *
     * @type {boolean}
     */
    solo: boolean;
    /**
     * The veritical position of hte generator icon on the track time line
     *
     * @type {number}
     */
    position: number; // the vertical location of the generator icon on the track timeline

    /**
     * Creates an instance of CMG with default values
     *
     * @constructor
     * @param {number} nextGenerator - The suffix number of the generator name
     */
    constructor(nextGenerator: number) {
        this.name = "G".concat(nextGenerator.toString());
        this.startTime = 0;
        this.stopTime = 0;
        this.type = GENERATORTYPE.CMG;
        this.mute = false;
        this.solo = false;
        this.position = 0;
    }

    /**
     * Add the XML description of this generator to an XML element.
     * Overridden by extending classes.
     * 
     * @param {XMLDocument} doc - the XML document being appended
     * @param {HTMLElement} elem - the element to receive the attributes or children
     */
    appendXML(doc: XMLDocument, elem: HTMLElement): void {
        elem.setAttribute('name', this.name);
        elem.setAttribute('startTime', this.startTime.toString());
        elem.setAttribute('stopTime', this.stopTime.toString());
        elem.setAttribute('type', this.type);
        elem.setAttribute('solo', this.solo.toString());
        elem.setAttribute('mute', this.mute.toString());
        elem.setAttribute('position', this.position.toString());
    }

    /**
     * makes a copy of this object 
     * overridden by the extending classes
     * @returns {CMG} - the copy of the object
     */
    copy(): CMG {
        const newCMG = new CMG(0);
        newCMG.name = this.name;
        newCMG.startTime = this.startTime;
        newCMG.stopTime = this.stopTime;
        newCMG.type = this.type;
        newCMG.mute = this.mute;
        newCMG.solo = this.solo;
        newCMG.position = this.position;
        return newCMG;
    }

    /**
     * Sets the attributes of the class object
     * overriden by the extending classes
     *
     * @param {string} name - the name of the attribute
     * @param {string} value - the string containing the value of the attribute, converted to appropraite datatype
     */
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
            case 'mute':
                this.mute = value == 'true';
                break;
            case 'solo':
                this.solo = value == 'true';
                break;
            case 'type':
                this.type = GENERATORTYPE.CMG;
                break;
            default:
                break;
        }
    }

    /**
     * Loads the contents of XML into the class object.
     * Overriden by the extended classes
     *
     * @param {XMLDocument} doc - the XML document
     * @param {Element} elem - the element of the XML document containing the object attributes
     */
    getXML(doc: XMLDocument, elem: Element) {
        this.name = getAttributeValue(elem, 'name', 'string') as string;
        this.startTime = getAttributeValue(elem, 'startTime', 'float') as number;
        this.stopTime = getAttributeValue(elem, 'stopTime', 'float') as number;
        this.type = GENERATORTYPE.CMG;
        this.mute = (getAttributeValue(elem, 'mute', 'string') == 'true');
        this.solo = (getAttributeValue(elem, 'solo', 'string') == 'true');
        this.position = getAttributeValue(elem, 'position', 'int') as number;
    }
}