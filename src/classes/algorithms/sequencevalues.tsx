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

export default class SequenceValues extends AlgorithmValues {
  override values: SequenceType;
  reverseSequence: boolean;
  reflectSequence: boolean;
  reflectPitch: number;
  constructor(sequenceAttribute: SEQUENCEATTRIBUTE) {
    super(ALGORITHMTYPE.Sequencer);
    this.values = {
      sequenceAttribute: sequenceAttribute,
      transpose: 0,
      name: "",
      items: [],
    };
    this.reverseSequence = false;
    this.reflectSequence = false;
    this.reflectPitch = 0;
  }
  override copy(): SequenceValues {
    const n: SequenceValues = new SequenceValues(this.values.sequenceAttribute);
    n.values.name = this.values.name;
    n.values.transpose = this.values.transpose;
    n.values.items = [...this.values.items];
    n.reverseSequence = this.reverseSequence;
    n.reflectPitch = this.reflectPitch;
    n.reflectSequence = this.reflectSequence;
    return n;
  }

  override isEqual(newAlgorithm: SequenceValues): boolean {
    if (!(newAlgorithm instanceof SequenceValues)) return false;
    return (
      newAlgorithm.values.sequenceAttribute == this.values.sequenceAttribute &&
      newAlgorithm.values.name == this.values.name &&
      newAlgorithm.values.transpose == this.values.transpose
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

      case "name":
        this.values.name = value;
        const loadItems = async (
          sequenceAttribute: SEQUENCEATTRIBUTE,
          name: string
        ) => {
          this.values.items = await loadSequenceItems(sequenceAttribute, name);
        };
        loadItems(this.values.sequenceAttribute, this.values.name);
        return true;

      case "transpose":
        this.values.transpose = parseFloat(value);
        return true;
      default:
        return true;
    }
  }


  // these methods are used by generator controls to reverse and reflect
  // the note sequence. They only apply to note sequences
  setReverse (reverse: boolean) {
    this.reverseSequence = reverse;
    if (reverse) {
      this.values.items.reverse();
    }
  }
  setReflect (reflect: boolean) {
    this.reflectSequence = reflect;
  }

  setReflectPitch (pitch: number) {
    this.reflectPitch = pitch;
    if (this.reflectSequence) {
      this.values.items = this.values.items.map((item: SequenceItem) => {
        return {beats: item.beats, value: this.reflectPitch-(item.value - this.reflectPitch)}
      })
    }
  }

  override getCurrentValue(_time: number, beat: number): number {
    const itemIndex: number = beatsToIndex(beat, this.values.items);
    const value: number =
      itemIndex < 0 ? 0 : this.values.items[itemIndex].value;
    // console.log("beat, itemindex, value", beat, itemIndex, value);
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

      return Promise.resolve(returnElem);
    } catch (e: any) {
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
    return Promise.resolve(s);
  }
  static override validate(_algorithm: SequenceValues): string[] {
    return [];
  }
}
