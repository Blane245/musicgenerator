import { SoundFont2 } from "soundfont2";
import { Preset } from "../sfcomponents/types";
import {
  GENERATORTYPE,
  ModulationType,
  MODULATOR,
  ModulatorMap,
} from "../types";
import { euclideanRhythm } from "../utils/euclidean-rhythm";
import { getAttributeValue, getElementElement } from "../utils/xmlfunctions";
import CMG from "./cmg";

// implements the Euclidean algorithm for rhythm and
// scale
// provides for speed, volume, and pan variation
// by modulation methods
export default class Euclidean extends CMG {
  presetName: string;
  preset: Preset | undefined;
  isLooping: boolean;
  seed: string;
  measureLength: number; // the number of beats in a measure
  beatCount: number; // the number of strokes in a measure
  noteCount: number; // the number of notes in the octave
  noteM: ModulationType; // note modulation parameters
  speedM: ModulationType; // speed modulation parameters
  volumeM: ModulationType; // volume modulation parameters
  panM: ModulationType; // pan modulation parameters

  constructor(nextGenerator: number) {
    super(nextGenerator);
    this.type = GENERATORTYPE.Euclidean;
    this.presetName = "";
    this.preset = undefined;
    this.isLooping = true;
    this.seed = this.name;
    this.measureLength = 4;
    this.beatCount = 4;
    this.#currentRhythmEntry = 0;
    this.noteCount = 7;
    this.noteM = {
      Type: MODULATOR.SINE,
      Center: 60,
      Frequency: 1000,
      Amplitude: 0,
      Phase: 0,
    };
    this.speedM = {
      Type: MODULATOR.SINE,
      Center: 60,
      Frequency: 1000,
      Amplitude: 0,
      Phase: 0,
    };
    this.volumeM = {
      Type: MODULATOR.SINE,
      Center: 0,
      Frequency: 1000,
      Amplitude: 0,
      Phase: 0,
    };
    this.panM = {
      Type: MODULATOR.SINE,
      Center: 0,
      Frequency: 1000,
      Amplitude: 0,
      Phase: 0,
    };
  }

  override copy(): Euclidean {
    const n = new Euclidean(0);
    n.name = this.name;
    n.startTime = this.startTime;
    n.stopTime = this.stopTime;
    n.mute = this.mute;
    n.position = this.position;

    n.seed = this.seed;
    n.presetName = this.presetName;
    n.preset = this.preset;
    n.isLooping = this.isLooping;

    n.beatCount = this.beatCount;
    n.measureLength = this.measureLength;
    n.noteCount = this.noteCount;
    n.#currentRhythmEntry = this.#currentRhythmEntry;
    n.speedM = { ...this.speedM };
    n.noteM = { ...this.noteM };
    n.volumeM = { ...this.volumeM };
    n.panM = { ...this.panM };
    return n;
  }
  override setAttribute(name: string, value: string): void {
    super.setAttribute(name, value);
    switch (name) {
      case "Type":
        this.type = GENERATORTYPE.Euclidean;
        break;
      case "seed":
        this.seed = value;
        break;
      case "presetName":
        this.presetName = value;
        break;
      case "isLooping":
        this.isLooping = value == "true";
        break;
      case "measureLength":
        this.measureLength = parseInt(value);
        break;
      case "beatCount":
        this.beatCount = parseInt(value);
        break;
      case "noteCount":
        this.noteCount = parseInt(value);
        break;
      case "noteM.Type":
        this.noteM.Type = MODULATOR[value];
        break;
      case "noteM.Center":
        this.noteM.Center = parseFloat(value);
        break;
      case "noteM.Frequency":
        this.noteM.Frequency = parseFloat(value);
        break;
      case "noteM.Amplitude":
        this.noteM.Amplitude = parseFloat(value);
        break;
      case "noteM.Phase":
        this.noteM.Phase = parseFloat(value);
        break;
      case "speedM.Type":
        this.speedM.Type = MODULATOR[value];
        break;
      case "speedM.Center":
        this.speedM.Center = parseFloat(value);
        break;
      case "speedM.Frequency":
        this.speedM.Frequency = parseFloat(value);
        break;
      case "speedM.Amplitude":
        this.speedM.Amplitude = parseFloat(value);
        break;
      case "speedM.Phase":
        this.speedM.Phase = parseFloat(value);
        break;
      case "volumeM.Type":
        this.volumeM.Type = MODULATOR[value];
        break;
      case "volumeM.Center":
        this.volumeM.Center = parseFloat(value);
        break;
      case "volumeM.Frequency":
        this.volumeM.Frequency = parseFloat(value);
        break;
      case "volumeM.Amplitude":
        this.volumeM.Amplitude = parseFloat(value);
        break;
      case "volumeM.Phase":
        this.volumeM.Phase = parseFloat(value);
        break;
      case "panM.Type":
        this.panM.Type = MODULATOR[value];
        break;
      case "panM.Center":
        this.panM.Center = parseFloat(value);
        break;
      case "panM.Frequency":
        this.panM.Frequency = parseFloat(value);
        break;
      case "panM.Amplitude":
        this.panM.Amplitude = parseFloat(value);
        break;
      case "panM.Phase":
        this.panM.Phase = parseFloat(value);
        break;
    }
  }
#beatSequence: number[] = [];
#noteSequence: number[] = [];
#currentRhythmEntry: number = 0;
  initialSequences() {
this.#beatSequence = euclideanRhythm(this.beatCount, this.measureLength);
this.#noteSequence = euclideanRhythm(this.noteCount, 12);
this.#currentRhythmEntry = 0;
console.log ('sequences initialized', this.#beatSequence, this.#noteSequence);
  }
  getCurrentValues(time: number): {
    midi: number;
    speed: number;
    volume: number;
    pan: number;
  } {
    let volume: number = 0;
    let pan: number = 0;
    let midi: number = this.noteM.Center;
    let speed = this.speedM.Center;
    const noteFunction = ModulatorMap.get(this.noteM.Type);
    const speedFunction = ModulatorMap.get(this.speedM.Type);
    const volFunction = ModulatorMap.get(this.volumeM.Type);
    const panFunction = ModulatorMap.get(this.panM.Type);
    if (!noteFunction || !speedFunction || !volFunction || !panFunction)
      return { midi, speed, volume, pan };
    volume = volFunction(
      time,
      this.volumeM.Center,
      this.volumeM.Frequency,
      this.volumeM.Amplitude,
      this.volumeM.Phase
    );
    pan = panFunction(
      time,
      this.panM.Center,
      this.panM.Frequency,
      this.panM.Amplitude,
      this.panM.Phase
    );
    speed = speedFunction(
      time,
      this.speedM.Center,
      this.speedM.Frequency,
      this.speedM.Amplitude,
      this.speedM.Phase
    );
    console.log('current beat', this.#currentRhythmEntry);
    // if the current note is to be silent,
    // then don't modulate and set the volume to -96dB
    if (this.#beatSequence[this.#currentRhythmEntry] == 0) {
      volume = -96;
      this.#currentRhythmEntry =
        (this.#currentRhythmEntry + 1) % this.measureLength;
        console.log('note is silent at time', time);
      return { midi, speed, volume, pan };
    }

    // get the offset from the base note as a rounded integer
    let midiOffset: number = 0;
    midiOffset = Math.round(
      noteFunction(
        time,
        0,
        this.noteM.Frequency,
        this.noteM.Amplitude,
        this.noteM.Phase
      )
    );

    // get the octave and the offset within the octave
    const octaveOffset: number = midiOffset % 12;
    const normalizedOctaveOffset: number = (midiOffset + 12) % 12;
    const octave: number = Math.trunc(midiOffset / 12);
    // find the 'on' note closest to the octave offset
    const isNoteOn: boolean = this.#noteSequence[(octaveOffset+12) % 12] == 1;

    // note is 'on' return it
    if (isNoteOn) {
      midi = this.noteM.Center + octave * 12 + octaveOffset;
      console.log('note is on, time, midioffset, midi', time, midiOffset, midi)
    } else {
      // find the two 'on' notes surrounding this 'off' note
      // this assumes that the first note in the sequence is on
      let first: number = normalizedOctaveOffset;
      let last: number = normalizedOctaveOffset;
      while (first > 0 && this.#noteSequence[first] == 0) first--;
      while (last < 12 && this.#noteSequence[last] == 0) last++;
      const firstOffset: number = normalizedOctaveOffset - first;
      const lastOffset: number = last - normalizedOctaveOffset;
      // set the midi to the closest 'on' note, favoring the lower one
      if (firstOffset <= lastOffset)
        midi = this.noteM.Center + octave * 12 + first;
      else midi = this.noteM.Center + octave * 12 + last;
      console.log('note is off time, first, last, midioffset,  midi', time, first, last, midiOffset,midi);
    }

    // bump to the next rhythm entry
    this.#currentRhythmEntry = (this.#currentRhythmEntry + 1) % this.measureLength;
    return { midi, speed, volume, pan };
  }

  override async appendXML(doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      const returnElem: Element = await super.appendXML(doc, elem);
      returnElem.setAttribute("type", GENERATORTYPE.Euclidean);
      returnElem.setAttribute("seed", this.seed);
      returnElem.setAttribute("presetName", this.presetName);
      returnElem.setAttribute("isLooping", this.isLooping ? "true" : "false");
      returnElem.setAttribute("measureLength", this.measureLength.toString());
      returnElem.setAttribute("beatCount", this.beatCount.toString());
      returnElem.setAttribute("noteCount", this.noteCount.toString());
      returnElem.appendChild(addModulationAttributes("noteM", this.noteM));
      returnElem.appendChild(addModulationAttributes("speedM", this.speedM));
      returnElem.appendChild(addModulationAttributes("volumeM", this.volumeM));
      returnElem.appendChild(addModulationAttributes("panM", this.panM));
      return Promise.resolve(returnElem);
    } catch (e: any) {
      return Promise.reject(e);
    }

    function addModulationAttributes(
      name: string,
      attributes: ModulationType
    ): Element {
      const aElement: Element = doc.createElement(name);
      aElement.setAttribute("Type", attributes.Type);
      aElement.setAttribute("Center", attributes.Center.toString());
      aElement.setAttribute("Frequency", attributes.Frequency.toString());
      aElement.setAttribute("Amplitude", attributes.Amplitude.toString());
      aElement.setAttribute("Phase", attributes.Phase.toString());
      return aElement;
    }
  }

  static override async getXML(
    elem: Element,
    soundFont: SoundFont2 | null
  ): Promise<Euclidean> {
    try {
      const g: Euclidean = new Euclidean(0);
      g.name = getAttributeValue(elem, "name", "string") as string;
      g.startTime = getAttributeValue(elem, "startTime", "float") as number;
      g.stopTime = getAttributeValue(elem, "stopTime", "float") as number;
      g.type = getAttributeValue(elem, "type", "string") as GENERATORTYPE;
      g.mute = getAttributeValue(elem, "mute", "string") == "true";
      g.position = getAttributeValue(elem, "position", "int") as number;

      g.presetName = getAttributeValue(elem, "presetName", "string") as string;
      const pn: string = g.presetName.split(":")[2];
      g.preset = soundFont
        ? (soundFont.presets.find((p) => p.header.name == pn) as Preset)
        : undefined;
      g.isLooping =
        (getAttributeValue(elem, "isLooping", "string") as string) == "true";
      g.seed = getAttributeValue(elem, "seed", "string") as string;
      g.measureLength = getAttributeValue(
        elem,
        "measureLength",
        "int"
      ) as number;
      g.beatCount = getAttributeValue(elem, "beatCount", "int") as number;
      g.noteCount = getAttributeValue(elem, "noteCount", "int") as number;
      g.noteM = getModulationAttributes(elem, "noteM");
      g.speedM = getModulationAttributes(elem, "speedM");
      g.volumeM = getModulationAttributes(elem, "volumeM");
      g.panM = getModulationAttributes(elem, "panM");
      return Promise.resolve(g);
      function getModulationAttributes(
        elem: Element,
        name: string
      ): ModulationType {
        const attrElem: Element = getElementElement(elem, name);
        const result: ModulationType = {
          Type: MODULATOR.SINE,
          Center: 0,
          Frequency: 0,
          Amplitude: 0,
          Phase: 0,
        };
        result.Type = getAttributeValue(
          attrElem,
          "Type",
          "string"
        ) as MODULATOR;
        result.Center = getAttributeValue(
          attrElem,
          "Center",
          "float"
        ) as number;
        result.Frequency = getAttributeValue(
          attrElem,
          "Frequency",
          "float"
        ) as number;
        result.Amplitude = getAttributeValue(
          attrElem,
          "Amplitude",
          "float"
        ) as number;
        result.Phase = getAttributeValue(attrElem, "Phase", "float") as number;
        return result;
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
