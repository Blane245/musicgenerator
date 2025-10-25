// // the classes in this file provide the ability to use different generator
// // types for each of the sound parameters - note, speed, volume, and pan

// import {
//   SEQUENCEATTRIBUTE,
//   SequenceType
// } from "types";
// import { loadSequenceItems } from "utils/loadsequenceitems";
// import { getAttributeValue } from "utils/xmlfunctions";
// import { SequenceItem } from "./sequenceitems";

// // const timeToBeat = (time: number, measureLength: number, beatCount: number) =>
// //   measureLength != 0 ? (beatCount * time) : 0;

// const beatsToIndex = (beat: number, items: SequenceItem[]) => {
//   if (items.length == 0) return 0;
//   let beatSum: number = 0;
//   let itemIndex: number = -1;
//   for (let i = 0; i < items.length && itemIndex < 0; i++) {
//     if (items[i].beats + beatSum > beat) itemIndex = i;
//     beatSum += items[i].beats;
//     if (i == items.length - 1) itemIndex = items.length - 1;
//   }
//   return itemIndex;
// };

// export default class SequenceValues {
//   values: SequenceType = {
//     sequenceAttribute: SEQUENCEATTRIBUTE.none,
//     name: "",
//     items: [],
//     transpose:  0,
//   };
//   constructor(sequenceAttribute: SEQUENCEATTRIBUTE) {
//     this.values.sequenceAttribute = sequenceAttribute;
//     this.values.transpose = 0;
//   }
//   copy(): SequenceValues {
//     const n: SequenceValues = new SequenceValues(this.values.sequenceAttribute);
//     n.values.name = this.values.name;
//     n.values.transpose = this.values.transpose;
//     n.values.items = [...this.values.items];
//     return n;
//   }
//   isEqual(newAlgorithm: SequenceValues): boolean {
//     if (!(newAlgorithm instanceof SequenceValues)) return false;
//     return (
//       this.values.sequenceAttribute != this.values.sequenceAttribute &&
//       this.values.name != this.values.name &&
//       this.values.transpose != this.values.transpose
//     );
//   }

//   async setAttribute(name: string, value: string) {
//     switch (name) {
//       case "sequenceType":
//         this.values.sequenceAttribute = SEQUENCEATTRIBUTE[value];
//         break;
//       case "name":
//         this.values.name = value;
//         this.values.items = await loadSequenceItems(
//           this.values.sequenceAttribute,
//           this.values.name
//         );
//         break;

//       // only used by the note sequence
//       case "transpose":
//         this.values.transpose = parseFloat(value);
//         break;
//       default:
//         break;
//     }
//     return;
//   }

//   getCurrentValue(
//     _time: number,
//     beat: number,
//   ): number {
//     const itemIndex: number = beatsToIndex(beat, this.values.items);
//     const value: number = (itemIndex < 0)? 0: this.values.items[itemIndex].value;
//     console.log('beat, itemindex, value', beat, itemIndex,value)
//     if (itemIndex < 0) return 0;
//     return this.values.items[itemIndex].value;
//   }
//   async appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
//     try {
//       const returnElem: Element = elem;
//       returnElem.setAttribute("name", this.values.name);
//       returnElem.setAttribute(
//         "sequenceattribute",
//         SEQUENCEATTRIBUTE[this.values.sequenceAttribute]
//       );
//       if (this.values.transpose != undefined) {
//         returnElem.setAttribute("transpose", this.values.transpose.toString());
//       }

//       return Promise.resolve(returnElem);
//     } catch (e: any) {
//       return Promise.reject(e);
//     }
//   }
//   static async getXML(
//     elem: Element,
//     _version: string
//   ): Promise<SequenceValues> {
//     const s: SequenceValues = new SequenceValues(SEQUENCEATTRIBUTE.none);
//     s.values.sequenceAttribute = getAttributeValue(
//       elem,
//       "sequenceattribute",
//       "string"
//     ) as SEQUENCEATTRIBUTE;
//     s.values.name = getAttributeValue(elem, "name", "string") as string;
//     s.values.items = await loadSequenceItems(
//       s.values.sequenceAttribute,
//       s.values.name
//     );
//     try {
//       s.values.transpose = getAttributeValue(
//         elem,
//         "transpose",
//         "float"
//       ) as number;
//     } catch (e) {
//       s.values.transpose = 0;
//     }
//     return Promise.resolve(s);
//   }

//   static validate(_algorithm: SequenceValues): string[] {
//     return [];
//   }
// }