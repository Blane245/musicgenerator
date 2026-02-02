// import { dBToGain } from "sfcomponents/util";
// import {
//   getAttributeValueWithDefault
// } from "utils/xmlfunctions";

// // room volume
// export default class Volume {
//   context: AudioContext | OfflineAudioContext | undefined;
//   volume: number;
//   effect: GainNode | undefined;

//   constructor() {
//     this.context = undefined;
//     this.volume = 0;
//   }

//   // set the context and build the equalizer
//   setContext(context: AudioContext | OfflineAudioContext) {
//     this.context = context;

//     // create all of the effects
//     this.effect = context.createGain();
//     this.effect.gain.value = dBToGain(this.volume);
//   }

//   // volume scale is -10 to 10
//   setVolume(value: number): void {
//     this.volume = value;
//     if (this.effect) this.effect.gain.value = dBToGain(value);
//   }

//   copy(): Volume {
//     const n = new Volume();
//     n.context = this.context;
//     n.volume = this.volume;
//     n.effect = this.effect;
//     return n;
//   }

//   getXML(fcElem: Element, _version: string): void {
//     this.volume = getAttributeValueWithDefault(
//       fcElem,
//       "volume",
//       "float",
//       0
//     ) as number;
//   }

//   appendXML(_: XMLDocument, elem: Element): void {
//     elem.setAttribute("volume", this.volume.toString());
//   }
// }
