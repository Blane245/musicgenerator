import { SoundFont2 } from "soundfont2";
import { Preset } from "../sfcomponents/types";
import {
  GENERATORTYPE,
  ModulationType,
  MODULATOR,
  ModulatorMap,
} from "../types";
import { euclideanRhythm } from "../utils/euclidean-rhythm";
import { addModulationAttributes, getAttributeValue, getModulationAttributes } from "../utils/xmlfunctions";
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
      type: MODULATOR.SINE,
      center: 60,
      frequency: 1000,
      amplitude: 0,
      phase: 0,
    };
    this.speedM = {
      type: MODULATOR.SINE,
      center: 60,
      frequency: 1000,
      amplitude: 0,
      phase: 0,
    };
    this.volumeM = {
      type: MODULATOR.SINE,
      center: 0,
      frequency: 1000,
      amplitude: 0,
      phase: 0,
    };
    this.panM = {
      type: MODULATOR.SINE,
      center: 0,
      frequency: 1000,
      amplitude: 0,
      phase: 0,
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
      case "type":
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
      case "noteM.type":
        this.noteM.type = MODULATOR[value];
        break;
      case "noteM.center":
        this.noteM.center = parseFloat(value);
        break;
      case "noteM.frequency":
        this.noteM.frequency = parseFloat(value);
        break;
      case "noteM.amplitude":
        this.noteM.amplitude = parseFloat(value);
        break;
      case "noteM.phase":
        this.noteM.phase = parseFloat(value);
        break;
      case "speedM.type":
        this.speedM.type = MODULATOR[value];
        break;
      case "speedM.center":
        this.speedM.center = parseFloat(value);
        break;
      case "speedM.frequency":
        this.speedM.frequency = parseFloat(value);
        break;
      case "speedM.amplitude":
        this.speedM.amplitude = parseFloat(value);
        break;
      case "speedM.phase":
        this.speedM.phase = parseFloat(value);
        break;
      case "volumeM.type":
        this.volumeM.type = MODULATOR[value];
        break;
      case "volumeM.center":
        this.volumeM.center = parseFloat(value);
        break;
      case "volumeM.frequency":
        this.volumeM.frequency = parseFloat(value);
        break;
      case "volumeM.amplitude":
        this.volumeM.amplitude = parseFloat(value);
        break;
      case "volumeM.phase":
        this.volumeM.phase = parseFloat(value);
        break;
      case "panM.type":
        this.panM.type = MODULATOR[value];
        break;
      case "panM.center":
        this.panM.center = parseFloat(value);
        break;
      case "panM.frequency":
        this.panM.frequency = parseFloat(value);
        break;
      case "panM.amplitude":
        this.panM.amplitude = parseFloat(value);
        break;
      case "panM.phase":
        this.panM.phase = parseFloat(value);
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
    let volume: number = this.volumeM.center;
    let pan: number = this.volumeM.center;
    let midi: number = this.noteM.center;
    let speed = this.speedM.center;
    const noteFunction = ModulatorMap.get(this.noteM.type);
    const speedFunction = ModulatorMap.get(this.speedM.type);
    const volFunction = ModulatorMap.get(this.volumeM.type);
    const panFunction = ModulatorMap.get(this.panM.type);
    if (!noteFunction || !speedFunction || !volFunction || !panFunction)
      return { midi, speed, volume, pan };
    volume = volFunction(
      time,
      this.volumeM.center,
      this.volumeM.frequency,
      this.volumeM.amplitude,
      this.volumeM.phase
    );
    pan = panFunction(
      time,
      this.panM.center,
      this.panM.frequency,
      this.panM.amplitude,
      this.panM.phase
    );
    speed = speedFunction(
      time,
      this.speedM.center,
      this.speedM.frequency,
      this.speedM.amplitude,
      this.speedM.phase
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
        this.noteM.frequency,
        this.noteM.amplitude,
        this.noteM.phase
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
      midi = this.noteM.center + octave * 12 + octaveOffset;
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
        midi = this.noteM.center + octave * 12 + first;
      else midi = this.noteM.center + octave * 12 + last;
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
      returnElem.appendChild(addModulationAttributes(doc, "noteM", this.noteM));
      returnElem.appendChild(addModulationAttributes(doc, "speedM", this.speedM));
      returnElem.appendChild(addModulationAttributes(doc,"volumeM", this.volumeM));
      returnElem.appendChild(addModulationAttributes(doc, "panM", this.panM));
      return Promise.resolve(returnElem);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }

  static override async getXML(
    elem: Element,
    _version: string,
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
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
