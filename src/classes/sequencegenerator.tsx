// // the algorithmic generator - uses oscillator, markovian, wiener algorithms to
// // provide note, speed, volume, and pan values
// // uses the euclidean beats from the parent class

// import { Preset } from "sfcomponents/types";
// import { presetNameToPreset } from "sfcomponents/util";
// import { SoundFont2 } from "soundfont2";
// import {
//     Algorithm,
//     AlgorithmType,
//     ALGORITHMTYPE,
//     GENERATORTYPE,
//     SEQUENCEATTRIBUTE,
//     SoundFontGenerators,
//     SoundFontGeneratorsType,
// } from "types";
// import { loadSequenceItems } from "utils/loadsequenceitems";
// import { getAttributeValue, getElementElement } from "utils/xmlfunctions";
// import {
//     AlgorithmValues,
//     AutoregressiveValues,
//     ConstantValues,
//     MarkovianValues,
//     OscillatorValues,
//     WienerValues,
// } from "./algorithmvalues";
// import CMGFile from "./cmgfile";
// import { Silent } from "./generators";
// import RandomNumber from "./randomnumber";
// import SequenceValues from "./sequencevalues";

// async function getAttributeXML(
//   elem: Element,
//   name: string,
//   version: string): Promise<Algorithm | SequenceValues> {
//   const attributeElem: Element = getElementElement(elem, name);
//   let isAlgorithm: boolean = false;
//   let attributeType: ALGORITHMTYPE | string = "";
//   try {
//     attributeType = getAttributeValue(
//       attributeElem,
//       "algorithmType",
//       "string"
//     ) as ALGORITHMTYPE;
//     isAlgorithm = true;
//   } catch (e) {
//     attributeType = getAttributeValue(
//       attributeElem,
//       "sequenceType",
//       "string"
//     ) as string;
//     isAlgorithm = false;
//   }
//   if (isAlgorithm) {
//     switch (attributeType) {
//       case ALGORITHMTYPE.Constant:
//         return await ConstantValues.getXML(attributeElem, version);
//       case ALGORITHMTYPE.Autoregressive:
//         return await AutoregressiveValues.getXML(attributeElem, version);
//       case ALGORITHMTYPE.Oscillator:
//         return await OscillatorValues.getXML(attributeElem, version);
//       case ALGORITHMTYPE.Markovian:
//         return await MarkovianValues.getXML(attributeElem, version);
//       case ALGORITHMTYPE.Wiener:
//         return await WienerValues.getXML(attributeElem, version);
//     default: return new ConstantValues(0);
//     }
//   } else {
//     return await SequenceValues.getXML(attributeElem, version);
//   }
// }

// function validateAttributeValues(
//   attribute: AlgorithmType | SequenceValues
// ): string[] {
//   const result: string[] = [];
//   if (attribute instanceof AlgorithmValues) {
//     switch (attribute.algorithmType) {
//       case ALGORITHMTYPE.Constant:
//         result.push(...ConstantValues.validate(attribute as ConstantValues));
//         return result;

//       case ALGORITHMTYPE.Autoregressive:
//         result.push(
//           ...AutoregressiveValues.validate(attribute as AutoregressiveValues)
//         );
//         return result;
//       case ALGORITHMTYPE.Oscillator:
//         result.push(
//           ...OscillatorValues.validate(attribute as OscillatorValues)
//         );
//         return result;
//       case ALGORITHMTYPE.Markovian:
//         result.push(...MarkovianValues.validate(attribute as MarkovianValues));
//         return result;
//       case ALGORITHMTYPE.Wiener:
//         result.push(...WienerValues.validate(attribute as WienerValues));
//         return result;
//       default:
//         return [`invalid algorithm type '${attribute.algorithmType}'`];
//     }
//   } else {
//     result.push(...SequenceValues.validate(attribute as SequenceValues));
//     return result;
//   }
// }

// function setAttributeValue (value: string): Algorithm | SequenceValues {
//     switch (value) {
//                   case "Constant":
//             return new ConstantValues();
//           case "Autoregressive":
//             return new AutoregressiveValues();
//           case "Oscillator":
//             return new OscillatorValues();
//           case "Markovian":
//             return new MarkovianValues();
//           case "Wiener":
//             return new WienerValues();
//           case "Sequence":
//             return new SequenceValues(SEQUENCEATTRIBUTE.attack);
//         default: return new ConstantValues();

//     }

// }
// export default class Sequencer extends Silent {
//   soundFontFile: string;
//   soundFont: SoundFont2 | undefined;
//   presets: Preset[]; // the soundfont preset list (not needed for AudioFile or Noise)
//   presetName: string; // the soundfont preset name (not needed for AudioFile or Noise)
//   preset: Preset | undefined; // the soundfont preset object (derived from the presetName and the soundFont file)
//   isLooping: boolean; // should the sample loop?
//   note: SequenceValues;
//   noiseSeed: string;
//   rn: RandomNumber;
//   noiseFrequency: number; // frequency of the modulation moise
//   noiseAmplitude: number; // noise gain
//   reverb: ConvolverNode | undefined;
//   context: AudioContext | OfflineAudioContext | undefined;
//   reverbDuration: number;
//   reverbDecay: number;
//   attackP: Algorithm | SequenceValues;
//   speedP: Algorithm | SequenceValues;
//   durationP: Algorithm | SequenceValues;
//   volumeP: Algorithm | SequenceValues;
//   panP: Algorithm | SequenceValues;

//   constructor(nextGenerator: number) {
//     super(nextGenerator);
//     this.type = GENERATORTYPE.Sequencer;
//     this.soundFontFile = "";
//     this.soundFont = undefined;
//     this.presetName = "";
//     this.preset = undefined;
//     this.presets = [];
//     this.isLooping = true;
//     this.note = new SequenceValues(SEQUENCEATTRIBUTE.note);
//     this.noiseSeed = "seed";
//     this.rn = new RandomNumber(this.noiseSeed);
//     this.noiseFrequency = 0;
//     this.noiseAmplitude = 0;
//     this.reverb = undefined;
//     this.context = undefined;
//     this.reverbDecay = 0;
//     this.reverbDuration = 0;
//     this.attackP = new ConstantValues(63);
//     this.speedP = new ConstantValues(60);
//     this.durationP = new ConstantValues(100);
//     this.volumeP = new ConstantValues(0);
//     this.panP = new ConstantValues(0);
//   }

//   setContext(context: AudioContext | OfflineAudioContext) {
//     this.context = context;
//     const impulse: AudioBuffer | undefined = this.#impulseResponse(
//       this.reverbDuration,
//       this.reverbDecay
//     );
//     if (impulse) {
//       this.reverb = this.context.createConvolver();
//       this.reverb.buffer = impulse;
//     }
//   }
//   #impulseResponse(duration: number, decay: number): AudioBuffer | undefined {
//     if (this.context && duration > 0 && decay > 0) {
//       const length = this.context.sampleRate * duration;
//       const impulse = this.context.createBuffer(
//         1,
//         length,
//         this.context.sampleRate
//       );
//       const IR = impulse?.getChannelData(0);
//       for (let i = 0; i < length; i++) {
//         IR[i] = (1 * Math.random() - 1) * Math.pow(1 - 1 / length, decay);
//       }
//       return impulse;
//     } else {
//       return undefined;
//     }
//   }

//   connect(source: AudioNode, destination: AudioNode) {
//     if (
//       this.reverb &&
//       this.context &&
//       this.reverbDuration > 0 &&
//       this.reverbDecay > 0
//     ) {
//       const gain: GainNode = this.context.createGain();
//       gain.gain.value = 1.0;
//       source.connect(gain).connect(this.reverb).connect(destination);
//     }
//   }

//   override copy(): Sequencer {
//     const n = new Sequencer(0);
//     n.name = this.name;
//     n.type = GENERATORTYPE.Sequencer;
//     n.startTime = this.startTime;
//     n.stopTime = this.stopTime;
//     n.mute = this.mute;
//     n.position = this.position;
//     n.soundFontFile = this.soundFontFile;
//     n.soundFont = this.soundFont;
//     n.presetName = this.presetName;
//     n.preset = this.preset;
//     n.presets = this.presets;
//     n.isLooping = this.isLooping;
//     n.note = this.note.copy();
//     n.noiseSeed = this.noiseSeed;
//     n.rn = this.rn;
//     n.noiseAmplitude = this.noiseAmplitude;
//     n.noiseFrequency = this.noiseFrequency;
//     n.reverb = this.reverb;
//     n.context = this.context;
//     n.reverbDuration = this.reverbDuration;
//     n.reverbDecay = this.reverbDecay;
//     n.attackP = this.attackP.copy();
//     n.speedP = this.speedP.copy();
//     n.durationP = this.durationP.copy();
//     n.volumeP = this.volumeP.copy();
//     n.panP = this.panP.copy();
//     return n;
//   }

//   override async setAttribute(name: string, value: string) {
//     // handle a change of the algorithm type
//     super.setAttribute(name, value);
//     switch (name) {
//       case "soundfontfile": {
//         if (value != "select a file") {
//           this.soundFontFile = value;
//           // this will trigger the soundfont to be loaded and the presets to be set
//           // by the calling dialog
//         }
//         return;
//       }
//       case "presetName":
//         this.presetName = value;
//         const { preset } = presetNameToPreset(this.presetName, this.presets);
//         this.preset = preset;
//         return;
//       case "isLooping":
//         this.isLooping = value == "true";
//         return;
//       case "note":
//         this.note.values.name = value;
//         this.note.values.items = await loadSequenceItems(
//           SEQUENCEATTRIBUTE.note,
//           value
//         );
//         return;
//       case "transpose":
//         this.note.values.transpose = parseFloat(value);
//         return;
//       case "noiseSeed":
//         this.noiseSeed = value;
//         this.rn = new RandomNumber(this.noiseSeed);
//         return;
//       case "noiseAmplitude":
//         this.noiseAmplitude = parseFloat(value);
//         return;
//       case "noiseFrequency":
//         this.noiseFrequency = parseFloat(value);
//         return;
//       case "reverbDuration":
//         this.reverbDuration = parseFloat(value);
//         return;
//       case "reverbDecay":
//         this.reverbDecay = parseFloat(value);
//         return;
//       case "attackP.algorithmType":
//         this.attackP = setAttributeValue(value);
//         return;
//       case "speedP.algorithmType":
//         this.speedP = setAttributeValue(value);
//         return;
//       case "durationP.algorithmType":
//         this.durationP = setAttributeValue(value);
//         return;
//       case "volumeP.algorithmType":
//         this.volumeP = setAttributeValue(value);
//         return;
//       case "panP.algorithmType":
//         this.attackP = setAttributeValue(value);
//         return;
//     }

//     // handle all other algorithm property values
//     const nameParts: string[] = name.split("."); // should be four, the third being 'values'
//     const parameterName: string = nameParts[0];
//     const valueName: string = nameParts[3];
//     switch (parameterName) {
//       case "attackP":
//         if (this.attackP instanceof AlgorithmValues)
//           (this.attackP as AlgorithmValues).setAttribute(valueName, value);
//         else (this.attackP as SequenceValues).setAttribute(valueName, value);
//         break;
//       case "speedP":
//         if (this.speedP instanceof AlgorithmValues)
//           (this.speedP as AlgorithmValues).setAttribute(valueName, value);
//         else (this.speedP as SequenceValues).setAttribute(valueName, value);
//         break;
//       case "durationP":
//         if (this.durationP instanceof AlgorithmValues)
//           (this.durationP as AlgorithmValues).setAttribute(valueName, value);
//         else (this.durationP as SequenceValues).setAttribute(valueName, value);
//         break;
//       case "volumeP":
//         if (this.volumeP instanceof AlgorithmValues)
//           (this.volumeP as AlgorithmValues).setAttribute(valueName, value);
//         else (this.volumeP as SequenceValues).setAttribute(valueName, value);
//         break;
//       case "panP":
//         if (this.panP instanceof AlgorithmValues)
//           (this.panP as AlgorithmValues).setAttribute(valueName, value);
//         else (this.panP as SequenceValues).setAttribute(valueName, value);
//         break;
//     }
//   }

//   getCurrentValues(
//     time: number,
//     beat: number
//   ): {
//     attack: number;
//     speed: number;
//     duration: number;
//     volume: number;
//     pan: number;
//   } {
//     let attack: number = this.attackP.getCurrentValue(time, beat);
//     attack = Math.min(127, Math.max(0, attack));

//     let speed: number = this.speedP.getCurrentValue(time, beat);
//     speed = Math.min(10000, Math.max(0.001, speed));

//     let duration: number = this.durationP.getCurrentValue(time, beat);
//     duration = Math.min(100, Math.max(0, duration));

//     let volume: number = this.volumeP.getCurrentValue(time, beat);
//     volume = Math.min(10, Math.max(-10, volume));

//     let pan: number = this.panP.getCurrentValue(time, beat);
//     pan = Math.min(1, Math.max(-1, pan));

//     return { attack, speed, duration, volume, pan };
//   }

//   override async appendXML(doc: XMLDocument, elem: Element): Promise<Element> {
//     try {
//       const returnElem: Element = elem;
//       await super.appendXML(doc, returnElem);
//       // strip the path from the file name
//       const nameParts: string[] = this.soundFontFile.split("/");
//       if (nameParts.length == 0)
//         returnElem.setAttribute("soundFontFile", this.soundFontFile);
//       else
//         returnElem.setAttribute(
//           "soundFontFile",
//           nameParts[nameParts.length - 1]
//         );
//       returnElem.setAttribute("presetName", this.presetName);
//       returnElem.setAttribute("isLooping", this.isLooping ? "true" : "false");
//       returnElem.setAttribute("noiseSeed", this.noiseSeed);
//       returnElem.setAttribute("note", this.note.values.name);
//       returnElem.setAttribute(
//         "transpose",
//         this.note.values.transpose ? this.note.values.transpose.toString() : "0"
//       );
//       returnElem.setAttribute("noiseAmplitude", this.noiseAmplitude.toString());
//       returnElem.setAttribute("noiseFrequency", this.noiseFrequency.toString());
//       returnElem.setAttribute("reverbDuration", this.reverbDuration.toString());
//       returnElem.setAttribute("reverbDecay", this.reverbDecay.toString());

//       const attackPElem: Element = doc.createElement("attackP");
//       const speedPElem: Element = doc.createElement("speedP");
//       const durationPElem: Element = doc.createElement("durationP");
//       const volumePElem: Element = doc.createElement("volumeP");
//       const panPElem: Element = doc.createElement("panP");
//       returnElem.appendChild(attackPElem);
//       returnElem.appendChild(speedPElem);
//       returnElem.appendChild(durationPElem);
//       returnElem.appendChild(volumePElem);
//       returnElem.appendChild(panPElem);
//       if (this.attackP instanceof AlgorithmValues)
//         (this.attackP as AlgorithmValues).appendXML(doc, attackPElem);
//       else (this.attackP as SequenceValues).appendXML(doc, attackPElem);

//       if (this.speedP instanceof AlgorithmValues)
//         (this.speedP as AlgorithmValues).appendXML(doc, speedPElem);
//       else (this.speedP as SequenceValues).appendXML(doc,speedPElem);

//       if (this.durationP instanceof AlgorithmValues)
//         (this.durationP as AlgorithmValues).appendXML(doc, durationPElem);
//       else (this.durationP as SequenceValues).appendXML(doc,durationPElem);

//       if (this.volumeP instanceof AlgorithmValues)
//         (this.volumeP as AlgorithmValues).appendXML(doc, volumePElem);
//       else (this.volumeP as SequenceValues).appendXML(doc,volumePElem);

//       if (this.panP instanceof AlgorithmValues)
//         (this.panP as AlgorithmValues).appendXML(doc, panPElem);
//       else (this.panP as SequenceValues).appendXML(doc,panPElem);

//       return Promise.resolve(returnElem);
//     } catch (e: any) {
//       return Promise.reject(e);
//     }
//   }
//   static override async getXML(
//     elem: Element,
//     version: string
//   ): Promise<Sequencer> {
//     try {
//       const CMGgen: Silent = await Silent.getXML(elem, version);
//       const g: Sequencer = new Sequencer(0);
//       g.name = CMGgen.name;
//       g.startTime = CMGgen.startTime;
//       g.stopTime = CMGgen.stopTime;
//       g.mute = CMGgen.mute;
//       g.position = CMGgen.position;

//       g.presetName = getAttributeValue(elem, "presetName", "string") as string;
//       g.soundFontFile = getAttributeValue(
//         elem,
//         "soundFontFile",
//         "string"
//       ) as string;
//       // need to load the list of unique soundfont files
//       // and when they are all assembled retrieve files to the pool and
//       // and update the generators that are using them with the
//       // correct soundFont, presets, and preset
//       // the latter is done in the file handler afer all tracks have been read
//       const foundSoundFont: SoundFontGeneratorsType | undefined =
//         SoundFontGenerators.find((s) => s.name == g.soundFontFile);
//       if (foundSoundFont == undefined) {
//         SoundFontGenerators.push({
//           name: g.soundFontFile,
//           generators: [g],
//         });
//       } else {
//         foundSoundFont.generators.push(g);
//       }
//       g.isLooping =
//         (getAttributeValue(elem, "isLooping", "string") as string) == "true";
//       g.note.values.name = getAttributeValue(elem, "note", "string") as string;
//       g.note.values.items = await loadSequenceItems(
//         SEQUENCEATTRIBUTE.note,
//         g.note.values.name
//       );
//       g.noiseSeed = getAttributeValue(elem, "noiseSeed", "string") as string;
//       g.noiseAmplitude = getAttributeValue(
//         elem,
//         "noiseAmplitude",
//         "float"
//       ) as number;
//       try {
//         g.noiseFrequency = getAttributeValue(
//           elem,
//           "noiseFrequency",
//           "float"
//         ) as number;
//       } catch (e) {
//         g.noiseFrequency = 0;
//       }
//       try {
//         g.reverbDuration = getAttributeValue(
//           elem,
//           "reverbDuration",
//           "float"
//         ) as number;
//         g.reverbDecay = getAttributeValue(
//           elem,
//           "reverbDecay",
//           "float"
//         ) as number;
//       } catch (e) {
//         g.reverbDecay = 0;
//         g.reverbDuration = 0;
//       }
//       g.attackP = await getAttributeXML(elem, "attackP", version);
//       g.speedP = await getAttributeXML(elem, "speedP", version);
//       g.durationP = await getAttributeXML(elem, "durationP", version);
//       g.volumeP = await getAttributeXML(elem, "volumeP", version);
//       g.panP = await getAttributeXML(elem, "panP", version);

//       return Promise.resolve(g);
//     } catch (e) {
//       return Promise.reject(e);
//     }
//   }
//   static override validate(
//     values: Sequencer,
//     fileContents: CMGFile,
//     oldName: string
//   ): string[] {
//     const result: string[] = Silent.validate(values, fileContents, oldName);
//     if (!values.presetName) result.push("Preset must be specified");
//     if (values.noiseSeed == "") result.push("Seed must not be blank");
//     if (values.note.values.name == "")
//       result.push("Note sequence name must be specified");
//     if (values.note.values.items.length == 0)
//       result.push("Note sequence has no beats defined");
//     result.push(...validateAttributeValues(values.attackP));
//     result.push(...validateAttributeValues(values.speedP));
//     result.push(...validateAttributeValues(values.durationP));
//     result.push(...validateAttributeValues(values.volumeP));
//     result.push(...validateAttributeValues(values.panP));
//     return result;
//   }
// }
