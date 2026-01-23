import {
  ALGORITHMTYPE,
  SEQUENCEATTRIBUTE,
  SequenceItem,
  SequenceType,
} from "types";
import { beatsToIndex } from "utils/beatstoindex";
import { loadSequenceItems } from "utils/loadsequenceitems";
import { getAttributeValueWithDefault } from "utils/xmlfunctions";
import { AlgorithmValues } from "./algorithmvalues";
import { debug } from "utils/debug";

export default class SequenceValues extends AlgorithmValues {
  override values: SequenceType;
  constructor(sequenceAttribute: SEQUENCEATTRIBUTE) {
    super(ALGORITHMTYPE.Sequencer);
    this.values = {
      sequenceAttribute: sequenceAttribute,
      transpose: 0,
      name: "",
      items: [],
      reverseSequence: false,
      reflectSequence: false,
      reflectPitch: 0,
    };
  }
  override copy(): SequenceValues {
    const n: SequenceValues = new SequenceValues(this.values.sequenceAttribute);
    n.values.name = this.values.name;
    n.values.transpose = this.values.transpose;
    n.values.items = [...this.values.items];
    n.values.reverseSequence = this.values.reverseSequence;
    n.values.reflectPitch = this.values.reflectPitch;
    n.values.reflectSequence = this.values.reflectSequence;
    return n;
  }

  override isEqual(newAlgorithm: SequenceValues): boolean {
    if (!(newAlgorithm instanceof SequenceValues)) return false;
    return (
      newAlgorithm.values.sequenceAttribute == this.values.sequenceAttribute &&
      newAlgorithm.values.name == this.values.name &&
      newAlgorithm.values.transpose == this.values.transpose &&
      newAlgorithm.values.reflectSequence == this.values.reflectSequence &&
      newAlgorithm.values.reverseSequence == this.values.reverseSequence &&
      newAlgorithm.values.reflectPitch == this.values.reflectPitch
    );
  }

  override setAttribute(name: string, value: string): boolean {
    switch (name) {
      case "algorithmType":
        this.algorithmType = ALGORITHMTYPE[value];
        return true;
      case "sequenceattribute":
        this.values.sequenceAttribute = SEQUENCEATTRIBUTE[value];
        return true;

      case "name": {
        this.values.name = value;
        const loadItems = async (
          sequenceAttribute: SEQUENCEATTRIBUTE,
          name: string
        ) => {
          this.values.items = await loadSequenceItems(sequenceAttribute, name);
        };
        loadItems(this.values.sequenceAttribute, this.values.name);
        return true;
      }

      case "transpose":
        this.values.transpose = parseFloat(value);
        return true;
      case "reverseSequence":
        this.values.reverseSequence = value == "true";
        return true;
      case "reflectSequence":
        this.values.reflectSequence = value == "true";
        return true;
      case "reflectPitch":
        this.values.reflectPitch = parseFloat(value);
        return true;
      default:
        return false;
    }
  }

  // these methods are used by generator controls to reverse and reflect
  // the note sequence. They only apply to note sequences
  setReverse() {
    if (this.values.reverseSequence) {
      this.values.items.reverse();
    }
  }
  setReflect() {
    if (this.values.reflectSequence) {
      debug.info(
        "Sequencer: reflect ",
        this.values.reflectPitch,
        this.values.items
      );
      this.values.items = this.values.items.map((item: SequenceItem) => {
        return {
          id: item.id,
          beats: item.beats,
          value: 2 * this.values.reflectPitch - item.value,
        };
      });
      debug.info("new sequence", this.values.items);
    }
  }

  override getCurrentValue(_time: number, beat: number): number {
    const itemIndex: number = beatsToIndex(beat, this.values.items);
    const value: number =
      itemIndex < 0 ? 0 : this.values.items[itemIndex].value;
    debug.info("sequenceer beat, itemindex, value", beat, itemIndex, value);
    if (itemIndex < 0) return 0;
    return value;
  }
  override async appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      const returnElem: Element = elem;
      returnElem.setAttribute("algorithmType", ALGORITHMTYPE.Sequencer);
      returnElem.setAttribute("name", this.values.name);
      returnElem.setAttribute(
        "sequenceattribute",
        SEQUENCEATTRIBUTE[this.values.sequenceAttribute]
      );
      if (this.values.transpose != undefined) {
        returnElem.setAttribute("transpose", this.values.transpose.toString());
      }
      returnElem.setAttribute(
        "reverseSequence",
        this.values.reverseSequence ? "true" : "false"
      );
      returnElem.setAttribute(
        "reflectSequence",
        this.values.reflectSequence ? "true" : "false"
      );
      returnElem.setAttribute(
        "reflectPitch",
        this.values.reflectPitch.toString()
      );

      return Promise.resolve(returnElem);
    } catch (e) {
      return Promise.reject(e);
    }
  }
  static override async getXML(
    elem: Element,
    _version: string
  ): Promise<SequenceValues> {
    const sequenceAttribute: SEQUENCEATTRIBUTE = getAttributeValueWithDefault(
      elem,
      "sequenceattribute",
      "string",
      ""
    ) as SEQUENCEATTRIBUTE;

    const s: SequenceValues = new SequenceValues(sequenceAttribute);
    s.values.name = getAttributeValueWithDefault(
      elem,
      "name",
      "string",
      ""
    ) as string;
    const sequencePromise: Promise<SequenceItem[]> = loadSequenceItems(
      s.values.sequenceAttribute,
      s.values.name
    );
    const items: SequenceItem[][] = await Promise.all([sequencePromise]);
    s.values.items = items[0];
    s.values.transpose = getAttributeValueWithDefault(
      elem,
      "transpose",
      "float",
      0
    ) as number;
    s.values.reverseSequence = getAttributeValueWithDefault(
      elem,
      "reverseSequence",
      "boolean",
      false,
    ) as boolean;
    s.values.reflectSequence = getAttributeValueWithDefault(
      elem,
      "reflectSequence",
      "boolean",
      false,
    ) as boolean;
    s.values.reflectPitch = getAttributeValueWithDefault(
      elem,
      "reflectPitch",
      "float",
      0,
    ) as number;
    return Promise.resolve(s);
  }
  static override validate(algorithm: SequenceValues): string[] {
    // if reflecting, not pitch should reflect outside of the
    // range [0-127]
    if (!algorithm.values.reflectSequence) return [];
    const errors: string[] = [];
    algorithm.values.items.forEach((item: SequenceItem) => {
      const newPitch: number = algorithm.values.reflectPitch * 2 - item.value;
      if (newPitch < 0 || newPitch > 127)
        errors.push(
          `The pitch ${item.value} is reflected by the pitch ${algorithm.values.reflectPitch} outside of the range [0-127].`
        );
    });
    return errors;
  }
}
