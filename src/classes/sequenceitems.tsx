export class SequenceItem {
  value: number;
  beats: number;
  constructor() {
    this.value = 0;
    this.beats = 0;
  }

  // appendXML (doc: XMLDocument) {
  //   const itemElement: Element = doc.createElement('item');
  //   itemElement.setAttribute('value', this.value.toString());
  //   itemElement.setAttribute('beats', this.beats.toString());
  //   return itemElement;
  // }
}
// export class NoteItem extends SequenceItem{
//     override value: string;
//     override beats: number
//   constructor (value:string, beats: number) {
//     super()
//     this.value = value;
//     this.beats = beats;
//   }
// }
// export class AttackItem extends SequenceItem{
//     override value: number;
//     override beats: number
//   constructor (value:number, beats: number) {
//     super()
//     this.value = value;
//     this.beats = beats;
//   }
// }
// export class SpeedItem extends SequenceItem{
//     override value: number;
//     override beats: number
//   constructor (value:number, beats: number) {
//     super()
//     this.value = value;
//     this.beats = beats;
//   }
// }
// export class DurationItem extends SequenceItem{
//     override value: number;
//     override beats: number
//   constructor (value:number, beats: number) {
//     super()
//     this.value = value;
//     this.beats = beats;
//   }
// }
// export class VolumeItem extends SequenceItem{
//     override value: number;
//     override beats: number
//   constructor (value:number, beats: number) {
//     super()
//     this.value = value;
//     this.beats = beats;
//   }
// }
// export class PanItem extends SequenceItem{
//     override value: number;
//     override beats: number
//   constructor (value:number, beats: number) {
//     super()
//     this.value = value;
//     this.beats = beats;
//   }
// }
