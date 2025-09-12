import { SoundFont2 } from "soundfont2";
import { Preset } from "sfcomponents/types";
import { presetNameToPreset } from "sfcomponents/util";
import {
  Algorithm,
  ALGORITHMTYPE,
  GENERATORTYPE,
  SoundFontGenerators,
  SoundFontGeneratorsType,
} from "types";
import { euclideanRhythm } from "utils/euclidean-rhythm";
import {
  compressAndConvertToString,
  convertFromJsonAndDecompress,
} from "utils/gzip";
import { getAttributeValue, getElementElement } from "utils/xmlfunctions";
import {
  AutoregressiveValues,
  ConstantValues,
  MarkovianValues,
  OscillatorValues,
  WienerValues,
} from "./algorithmvalues";
import CMGFile from "./cmgfile";
import RandomNumber from "./randomnumber";

// base class for all generator types
// contains properties used almost all generators
export class Silent {
  name: string; // the unique name of the generator
  startTime: number; // time (seconds) that the generator starts
  stopTime: number; // time (seconds) that the generator stops
  type: GENERATORTYPE;
  mute: boolean;
  position: number; // the vertical location of the generator icon on the track timeline

  constructor(nextGenerator: number) {
    this.name = "G".concat(nextGenerator.toString());
    this.startTime = 0;
    this.stopTime = 0;
    this.type = GENERATORTYPE.Silent;
    this.mute = false;
    this.position = 0;
  }

  copy(): Silent {
    const newCMG = new Silent(0);
    newCMG.name = this.name;
    newCMG.startTime = this.startTime;
    newCMG.stopTime = this.stopTime;
    newCMG.mute = this.mute;
    newCMG.position = this.position;

    return newCMG;
  }

  setAttribute(name: string, value: string): void {
    switch (name) {
      case "name":
        this.name = value;
        break;
      case "type":
        this.type = GENERATORTYPE.Silent;
        break;
      case "startTime":
        const interval: number = this.stopTime - this.startTime;
        this.startTime = parseFloat(value);
        this.stopTime = this.startTime + interval;
        break;
      case "stopTime":
        this.stopTime = parseFloat(value);
        break;
      case "mute":
        this.mute = value == "true";
        break;

      default:
        break;
    }
  }

  async appendXML(_: XMLDocument, elem: Element): Promise<Element> {
    try {
      const returnElem: Element = elem;
      returnElem.setAttribute("name", this.name);
      returnElem.setAttribute("type", this.type);
      returnElem.setAttribute("startTime", this.startTime.toString());
      returnElem.setAttribute("stopTime", this.stopTime.toString());
      returnElem.setAttribute("type", this.type);
      returnElem.setAttribute("mute", this.mute.toString());
      returnElem.setAttribute("position", this.position.toString());
      return Promise.resolve(returnElem);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }

  static async getXML(elem: Element, _version: string): Promise<Silent> {
    try {
      const g: Silent = new Silent(0);
      g.name = getAttributeValue(elem, "name", "string") as string;
      g.startTime = getAttributeValue(elem, "startTime", "float") as number;
      g.stopTime = getAttributeValue(elem, "stopTime", "float") as number;
      g.type = getAttributeValue(elem, "type", "string") as GENERATORTYPE;
      g.mute = getAttributeValue(elem, "mute", "string") == "true";
      g.position = getAttributeValue(elem, "position", "float") as number;
      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // validate the user-supplied values of the generator
  static validate(
    values: Silent,
    fileContents: CMGFile,
    oldName: string
  ): string[] {
    const errors: string[] = [];
    if (values.name == "") errors.push("Name must not be blank");
    if (values.name != oldName) {
      for (let i = 0; i < fileContents.tracks.length; i++) {
        const t = fileContents.tracks[i];
        for (let j = 0; j < t.generators.length; j++) {
          if (t.generators[j].name == values.name) {
            errors.push("A generator with that name already exists");
          }
        }
      }
    }
    if (values.startTime < 0 || values.stopTime <= values.startTime)
      errors.push(
        "All times must be greater than zero and stop must be greater than start"
      );

    return errors;
  }
}

// the algorithmic generator - uses oscillator, markovian, wiener algorithms to
// provide note, speed, volume, and pan values
// uses the euclidean beats from the parent class

export class Algorithmic extends Silent {
  soundFontFile: string;
  soundFont: SoundFont2 | undefined;
  presets: Preset[]; // the soundfont preset list (not needed for AudioFile or Noise)
  presetName: string; // the soundfont preset name (not needed for AudioFile or Noise)
  preset: Preset | undefined; // the soundfont preset object (derived from the presetName and the soundFont file)
  isLooping: boolean; // should the sample loop?
  measureLength: number; // the number of beats in a measure
  beatCount: number; // the number of strokes in a measure
  noteCount: number; // the number of active notes in an active
  #activeNotes: number[]; // the active notes of the octave
  noiseSeed: string;
  rn: RandomNumber;
  noiseAmplitude: number; // dB of Gaussian noise to apply
  reverb: ConvolverNode | undefined;
  context: AudioContext | OfflineAudioContext | undefined;
  reverbDuration: number;
  reverbDecay: number;
  noteP: Algorithm;
  attackP: Algorithm;
  speedP: Algorithm;
  durationP: Algorithm;
  volumeP: Algorithm;
  panP: Algorithm;

  constructor(nextGenerator: number) {
    super(nextGenerator);
    this.type = GENERATORTYPE.Algorithmic;
    this.soundFontFile = "";
    this.soundFont = undefined;
    this.presetName = "";
    this.preset = undefined;
    this.presets = [];
    this.isLooping = true;
    this.measureLength = 4;
    this.beatCount = 4;
    this.noteCount = 12;
    this.#activeNotes = euclideanRhythm(this.noteCount, 12);
    this.noiseSeed = "seed";
    this.rn = new RandomNumber(this.noiseSeed);
    this.noiseAmplitude = 0;
    this.reverb = undefined;
    this.context = undefined;
    this.reverbDecay = 0;
    this.reverbDuration = 0;
    this.noteP = new ConstantValues();
    this.attackP = new ConstantValues(63);
    this.speedP = new ConstantValues();
    this.durationP = new ConstantValues(100);
    this.volumeP = new ConstantValues();
    this.panP = new ConstantValues();
  }

  setContext(context: AudioContext | OfflineAudioContext) {
    this.context = context;
    const impulse: AudioBuffer | undefined = this.#impulseResponse(
      this.reverbDuration,
      this.reverbDecay
    );
    if (impulse) {
      this.reverb = this.context.createConvolver();
      this.reverb.buffer = impulse;
    }
  }
  #impulseResponse(duration: number, decay: number): AudioBuffer | undefined {
    if (this.context && duration > 0 && decay > 0) {
      const length = this.context.sampleRate * duration;
      const impulse = this.context.createBuffer(
        1,
        length,
        this.context.sampleRate
      );
      const IR = impulse?.getChannelData(0);
      for (let i = 0; i < length; i++) {
        IR[i] = (1 * Math.random() - 1) * Math.pow(1 - 1 / length, decay);
      }
      return impulse;
    } else {
      return undefined;
    }
  }

  connect(source: AudioNode, destination: AudioNode) {
    if (
      this.reverb &&
      this.context &&
      this.reverbDuration > 0 &&
      this.reverbDecay > 0
    ) {
      const gain: GainNode = this.context.createGain();
      gain.gain.value = 1.0;
      source.connect(gain).connect(this.reverb).connect(destination);
    }
  }

  override copy(): Algorithmic {
    const n = new Algorithmic(0);
    n.name = this.name;
    n.startTime = this.startTime;
    n.stopTime = this.stopTime;
    n.mute = this.mute;
    n.position = this.position;
    n.soundFontFile = this.soundFontFile;
    n.soundFont = this.soundFont;
    n.presetName = this.presetName;
    n.preset = this.preset;
    n.presets = this.presets;
    n.isLooping = this.isLooping;
    n.measureLength = this.measureLength;
    n.beatCount = this.beatCount;
    n.noteCount = this.noteCount;
    n.#activeNotes = this.#activeNotes;
    n.noiseSeed = this.noiseSeed;
    n.rn = this.rn;
    n.noiseAmplitude = this.noiseAmplitude;
    n.reverb = this.reverb;
    n.context = this.context;
    n.reverbDuration = this.reverbDuration;
    n.reverbDecay = this.reverbDecay;
    n.noteP = this.noteP ? this.noteP.copy() : undefined;
    n.attackP = this.attackP ? this.attackP.copy() : undefined;
    n.speedP = this.speedP ? this.speedP.copy() : undefined;
    n.durationP = this.durationP ? this.durationP.copy() : undefined;
    n.volumeP = this.volumeP ? this.volumeP.copy() : undefined;
    n.panP = this.panP ? this.panP.copy() : undefined;
    return n;
  }

  override async setAttribute(name: string, value: string) {
    // handle a change of the algorithm type
    super.setAttribute(name, value);
    switch (name) {
      case "soundfontfile": {
        if (value != "select a file") {
          this.soundFontFile = value;
          // this will trigger the soundfont to be loaded and the presets to be set
          // by the calling dialog
        }
        return;
      }
      case "presetName":
        this.presetName = value;
        const { preset } = presetNameToPreset(this.presetName, this.presets);
        this.preset = preset;
        return;
      case "isLooping":
        this.isLooping = value == "true";
        return;
      case "measureLength":
        this.measureLength = parseInt(value);
        return;
      case "beatCount":
        this.beatCount = parseInt(value);
        return;
      case "noteCount":
        this.noteCount = parseInt(value);
        this.#activeNotes = euclideanRhythm(this.noteCount, 12);
        return;
      case "noiseSeed":
        this.noiseSeed = value;
        this.rn = new RandomNumber(this.noiseSeed);
        return;
      case "noiseAmplitude":
        this.noiseAmplitude = parseFloat(value);
        return;
      case "reverbDuration":
        this.reverbDuration = parseFloat(value);
        return;
      case "reverbDecay":
        this.reverbDecay = parseFloat(value);
        return;
      case "noteP.algorithmType":
        switch (value) {
          case "Constant":
            this.noteP = new ConstantValues();
            return;
          case "Autoregressive":
            this.noteP = new AutoregressiveValues();
            return;
          case "Oscillator":
            this.noteP = new OscillatorValues();
            return;
          case "Markovian":
            this.noteP = new MarkovianValues();
            return;
          case "Wiener":
            this.noteP = new WienerValues();
            return;
        }
        break;
      case "attackP.algorithmType":
        switch (value) {
          case "Constant":
            this.attackP = new ConstantValues();
            return;
          case "Autoregressive":
            this.attackP = new AutoregressiveValues();
            return;
          case "Oscillator":
            this.attackP = new OscillatorValues();
            return;
          case "Markovian":
            this.attackP = new MarkovianValues();
            return;
          case "Wiener":
            this.attackP = new WienerValues();
            return;
        }
        break;
      case "speedP.algorithmType":
        switch (value) {
          case "Constant":
            this.speedP = new ConstantValues();
            return;
          case "Autoregressive":
            this.speedP = new AutoregressiveValues();
            return;
          case "Oscillator":
            this.speedP = new OscillatorValues();
            return;
          case "Markovian":
            this.speedP = new MarkovianValues();
            return;
          case "Wiener":
            this.speedP = new WienerValues();
            return;
        }
        break;
      case "durationP.algorithmType":
        switch (value) {
          case "Constant":
            this.durationP = new ConstantValues(100);
            return;
          case "Autoregressive":
            this.durationP = new AutoregressiveValues();
            return;
          case "Oscillator":
            this.durationP = new OscillatorValues();
            return;
          case "Markovian":
            this.durationP = new MarkovianValues();
            return;
          case "Wiener":
            this.durationP = new WienerValues();
            return;
        }
        break;
      case "volumeP.algorithmType":
        switch (value) {
          case "Constant":
            this.volumeP = new ConstantValues();
            return;
          case "Autoregressive":
            this.volumeP = new AutoregressiveValues();
            return;
          case "Oscillator":
            this.volumeP = new OscillatorValues();
            return;
          case "Markovian":
            this.volumeP = new MarkovianValues();
            return;
          case "Wiener":
            this.volumeP = new WienerValues();
            return;
        }
        break;
      case "panP.algorithmType":
        switch (value) {
          case "Constant":
            this.panP = new ConstantValues();
            return;
          case "Autoregressive":
            this.panP = new AutoregressiveValues();
            return;
          case "Oscillator":
            this.panP = new OscillatorValues();
            return;
          case "Markovian":
            this.panP = new MarkovianValues();
            return;
          case "Wiener":
            this.panP = new WienerValues();
            return;
        }
        break;
    }

    // handle all other algorithm property values
    const nameParts: string[] = name.split("."); // should be four, the third being 'values'
    const parameterName: string = nameParts[0];
    const valueName: string = nameParts[3];
    switch (parameterName) {
      case "noteP":
        if (this.noteP) this.noteP.setAttribute(valueName, value);
        break;
      case "attackP":
        if (this.attackP) this.attackP.setAttribute(valueName, value);
        break;
      case "speedP":
        if (this.speedP) this.speedP.setAttribute(valueName, value);
        break;
      case "durationP":
        if (this.durationP) this.durationP.setAttribute(valueName, value);
        break;
      case "volumeP":
        if (this.volumeP) this.volumeP.setAttribute(valueName, value);
        break;
      case "panP":
        if (this.panP) this.panP.setAttribute(valueName, value);
        break;
    }
  }

  // beat counting
  #beatSequence: number[] = [];
  #currentRhythmEntry: number = 0;
  initialSequence() {
    this.#beatSequence = euclideanRhythm(this.beatCount, this.measureLength);
    this.#currentRhythmEntry = 0;
  }

  getCurrentValues(time: number): {
    beat: boolean;
    attack: number;
    note: number;
    speed: number;
    duration: number;
    volume: number;
    pan: number;
  } {
    const entry: number = this.#currentRhythmEntry;
    this.#currentRhythmEntry =
      (this.#currentRhythmEntry + 1) % this.measureLength;
    const beat: boolean = this.#beatSequence[entry] != 0;

    let note: number = this.noteP ? this.noteP.getCurrentValue(time) : 0;
    note = Math.min(127, Math.max(0, note));

    let attack: number = this.attackP
      ? this.attackP.getCurrentValue(time)
      : 0;
    attack = Math.min(127, Math.max(0, attack));

    let speed: number = this.speedP ? this.speedP.getCurrentValue(time) : 0;
    speed = Math.min(10000, Math.max(0.001, speed));

    let duration: number = this.durationP
      ? this.durationP.getCurrentValue(time)
      : 0;
    duration = Math.min(100, Math.max(0, duration));

    let volume: number = this.volumeP ? this.volumeP.getCurrentValue(time) : 0;
    volume = Math.min(10, Math.max(-10, volume));

    let pan: number = this.panP ? this.panP.getCurrentValue(time) : 0;
    pan = Math.min(1, Math.max(-1, pan));

    // modify the note based on those selectable in the octave
    note = this.#getSelectedNote(note);
    return { beat, note, attack, speed, duration, volume, pan };
  }

  #getSelectedNote(note: number): number {
    // get the midi integer and fraction parts
    let midi = Math.round(note);
    const midiFraction = note - midi;

    // get the octave values
    const midiOffset = midi % 12;
    const normalizedMidiOffset = (midiOffset + 12) % 12;
    const octave: number = Math.trunc(midi / 12);

    // if the note is on, return the original note
    if (this.#activeNotes[normalizedMidiOffset] == 1) {
      // console.log("returning original note", note);
      return note;
    }

    // find the two selected notes surrounding this nonselected note
    // this assumes that the first note in the sequence is selected
    let first: number = normalizedMidiOffset;
    let last: number = normalizedMidiOffset;
    while (first > 0 && this.#activeNotes[first] == 0) first--;
    while (last < 12 && this.#activeNotes[last] == 0) last++;
    const firstOffset: number = normalizedMidiOffset - first;
    const lastOffset: number = last - normalizedMidiOffset;
    // set the midi to the closest active note, favoring the lower one
    if (firstOffset <= lastOffset) midi = octave * 12 + first;
    else midi = octave * 12 + last;

    // return with the fractional note applied
    // console.log("returning modified note", midi + midiFraction);
    return midi + midiFraction;
  }

  override async appendXML(doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      const returnElem: Element = elem;
      await super.appendXML(doc, returnElem);
      // strip the path from the file name
      const nameParts: string[] = this.soundFontFile.split("/");
      if (nameParts.length == 0)
        returnElem.setAttribute("soundFontFile", this.soundFontFile);
      else
        returnElem.setAttribute(
          "soundFontFile",
          nameParts[nameParts.length - 1]
        );
      returnElem.setAttribute("presetName", this.presetName);
      returnElem.setAttribute("isLooping", this.isLooping ? "true" : "false");
      returnElem.setAttribute("measureLength", this.measureLength.toString());
      returnElem.setAttribute("beatCount", this.beatCount.toString());
      returnElem.setAttribute("noteCount", this.noteCount.toString());
      returnElem.setAttribute("noiseSeed", this.noiseSeed);
      returnElem.setAttribute("noteCount", this.noteCount.toString());
      returnElem.setAttribute("noiseAmplitude", this.noiseAmplitude.toString());
      returnElem.setAttribute("reverbDuration", this.reverbDuration.toString());
      returnElem.setAttribute("reverbDecay", this.reverbDecay.toString());

      const notePElem: Element = doc.createElement("noteP");
      const attackPElem: Element = doc.createElement("attackP");
      const speedPElem: Element = doc.createElement("speedP");
      const durationPElem: Element = doc.createElement("durationP");
      const volumePElem: Element = doc.createElement("volumeP");
      const panPElem: Element = doc.createElement("panP");
      returnElem.appendChild(notePElem);
      returnElem.appendChild(attackPElem);
      returnElem.appendChild(speedPElem);
      returnElem.appendChild(durationPElem);
      returnElem.appendChild(volumePElem);
      returnElem.appendChild(panPElem);
      this.noteP?.appendXML(doc, notePElem);
      this.attackP?.appendXML(doc, attackPElem);
      this.speedP?.appendXML(doc, speedPElem);
      this.durationP?.appendXML(doc, durationPElem);
      this.volumeP?.appendXML(doc, volumePElem);
      this.panP?.appendXML(doc, panPElem);
      return Promise.resolve(returnElem);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }
  static override async getXML(
    elem: Element,
    version: string
  ): Promise<Algorithmic> {
    try {
      const CMGgen: Silent = await Silent.getXML(elem, version);
      const g: Algorithmic = new Algorithmic(0);
      g.name = CMGgen.name;
      g.startTime = CMGgen.startTime;
      g.stopTime = CMGgen.stopTime;
      g.mute = CMGgen.mute;
      g.position = CMGgen.position;

      g.presetName = getAttributeValue(elem, "presetName", "string") as string;
      g.soundFontFile = getAttributeValue(
        elem,
        "soundFontFile",
        "string"
      ) as string;
      // need to load the list of unique soundfont files
      // and when they are all assembled retrieve files to the pool and
      // and update the generators that are using them with the
      // correct soundFont, presets, and preset
      // the latter is done in the file handler afer all tracks have been read
      const foundSoundFont: SoundFontGeneratorsType | undefined =
        SoundFontGenerators.find((s) => s.name == g.soundFontFile);
      if (foundSoundFont == undefined) {
        SoundFontGenerators.push({
          name: g.soundFontFile,
          generators: [g],
        });
      } else {
        foundSoundFont.generators.push(g);
      }
      g.isLooping =
        (getAttributeValue(elem, "isLooping", "string") as string) == "true";
      g.measureLength = getAttributeValue(
        elem,
        "measureLength",
        "int"
      ) as number;
      g.beatCount = getAttributeValue(elem, "beatCount", "int") as number;
      g.noteCount = getAttributeValue(elem, "noteCount", "int") as number;
      g.initialSequence();
      g.noteCount = getAttributeValue(elem, "noteCount", "int") as number;
      g.#activeNotes = euclideanRhythm(g.noteCount, 12);
      g.noiseSeed = getAttributeValue(elem, "noiseSeed", "string") as string;
      g.noiseAmplitude = getAttributeValue(
        elem,
        "noiseAmplitude",
        "float"
      ) as number;
      try {
        g.reverbDuration = getAttributeValue(
          elem,
          "reverbDuration",
          "float"
        ) as number;
        g.reverbDecay = getAttributeValue(
          elem,
          "reverbDecay",
          "float"
        ) as number;
      } catch (e) {
        g.reverbDecay = 0;
        g.reverbDuration = 0;
      }

      const notePElem: Element = getElementElement(elem, "noteP");
      const notePType: ALGORITHMTYPE = getAttributeValue(
        notePElem,
        "algorithmType",
        "string"
      ) as ALGORITHMTYPE;
      switch (notePType) {
        case ALGORITHMTYPE.Constant:
          g.noteP = await ConstantValues.getXML(notePElem, version);
          break;
        case ALGORITHMTYPE.Autoregressive:
          g.noteP = await AutoregressiveValues.getXML(notePElem, version);
          break;
        case ALGORITHMTYPE.Oscillator:
          g.noteP = await OscillatorValues.getXML(notePElem, version);
          break;
        case ALGORITHMTYPE.Markovian:
          g.noteP = await MarkovianValues.getXML(notePElem, version);
          break;
        case ALGORITHMTYPE.Wiener:
          g.noteP = await WienerValues.getXML(notePElem, version);
          break;
      }

      let attackPElem: Element | null = null;
      try {
        attackPElem = getElementElement(elem, "attackP");
      } catch {
        attackPElem = null;
      }
      let attackPType: ALGORITHMTYPE = ALGORITHMTYPE.Constant;
      if (attackPElem)
           attackPType = getAttributeValue(
          attackPElem,
          "algorithmType",
          "string"
        ) as ALGORITHMTYPE;

      if (!attackPElem) {
        g.durationP = new ConstantValues(63);
      } else {
        switch (attackPType) {
          case ALGORITHMTYPE.Constant:
            g.attackP = await ConstantValues.getXML(attackPElem, version);
            break;
          case ALGORITHMTYPE.Autoregressive:
            g.attackP = await AutoregressiveValues.getXML(
              attackPElem,
              version
            );
            break;
          case ALGORITHMTYPE.Oscillator:
            g.attackP = await OscillatorValues.getXML(attackPElem, version);
            break;
          case ALGORITHMTYPE.Markovian:
            g.attackP = await MarkovianValues.getXML(attackPElem, version);
            break;
          case ALGORITHMTYPE.Wiener:
            g.attackP = await WienerValues.getXML(attackPElem, version);
            break;
        }
      }
      
      const speedPElem: Element = getElementElement(elem, "speedP");
      const speedPType: ALGORITHMTYPE = getAttributeValue(
        speedPElem,
        "algorithmType",
        "string"
      ) as ALGORITHMTYPE;
      switch (speedPType) {
        case ALGORITHMTYPE.Constant:
          g.speedP = await ConstantValues.getXML(speedPElem, version);
          break;
        case ALGORITHMTYPE.Autoregressive:
          g.speedP = await AutoregressiveValues.getXML(speedPElem, version);
          break;
        case ALGORITHMTYPE.Oscillator:
          g.speedP = await OscillatorValues.getXML(speedPElem, version);
          break;
        case ALGORITHMTYPE.Markovian:
          g.speedP = await MarkovianValues.getXML(speedPElem, version);
          break;
        case ALGORITHMTYPE.Wiener:
          g.speedP = await WienerValues.getXML(speedPElem, version);
          break;
      }

      let durationPElem: Element | null = null;
      try {
        durationPElem = getElementElement(elem, "durationP");
      } catch {
        durationPElem = null;
      }
      let durationPType: ALGORITHMTYPE = ALGORITHMTYPE.Constant;
      if (durationPElem)
        durationPType = getAttributeValue(
          durationPElem,
          "algorithmType",
          "string"
        ) as ALGORITHMTYPE;
      if (!durationPElem) {
        g.durationP = new ConstantValues(100);
      } else {
        switch (durationPType) {
          case ALGORITHMTYPE.Constant:
            g.durationP = await ConstantValues.getXML(durationPElem, version);
            break;
          case ALGORITHMTYPE.Autoregressive:
            g.durationP = await AutoregressiveValues.getXML(
              durationPElem,
              version
            );
            break;
          case ALGORITHMTYPE.Oscillator:
            g.durationP = await OscillatorValues.getXML(durationPElem, version);
            break;
          case ALGORITHMTYPE.Markovian:
            g.durationP = await MarkovianValues.getXML(durationPElem, version);
            break;
          case ALGORITHMTYPE.Wiener:
            g.durationP = await WienerValues.getXML(durationPElem, version);
            break;
        }
      }

      const volumePElem: Element = getElementElement(elem, "volumeP");
      const volumePType: ALGORITHMTYPE = getAttributeValue(
        volumePElem,
        "algorithmType",
        "string"
      ) as ALGORITHMTYPE;
            switch (volumePType) {
        case ALGORITHMTYPE.Constant:
          g.volumeP = await ConstantValues.getXML(volumePElem, version);
          break;
        case ALGORITHMTYPE.Autoregressive:
          g.volumeP = await AutoregressiveValues.getXML(volumePElem, version);
          break;
        case ALGORITHMTYPE.Oscillator:
          g.volumeP = await OscillatorValues.getXML(volumePElem, version);
          break;
        case ALGORITHMTYPE.Markovian:
          g.volumeP = await MarkovianValues.getXML(volumePElem, version);
          break;
        case ALGORITHMTYPE.Wiener:
          g.volumeP = await WienerValues.getXML(volumePElem, version);
          break;
      }

      const panPElem: Element = getElementElement(elem, "panP");
      const panPType: ALGORITHMTYPE = getAttributeValue(
        panPElem,
        "algorithmType",
        "string"
      ) as ALGORITHMTYPE;
      switch (panPType) {
        case ALGORITHMTYPE.Constant:
          g.panP = await ConstantValues.getXML(panPElem, version);
          break;
        case ALGORITHMTYPE.Autoregressive:
          g.panP = await AutoregressiveValues.getXML(panPElem, version);
          break;
        case ALGORITHMTYPE.Oscillator:
          g.panP = await OscillatorValues.getXML(panPElem, version);
          break;
        case ALGORITHMTYPE.Markovian:
          g.panP = await MarkovianValues.getXML(panPElem, version);
          break;
        case ALGORITHMTYPE.Wiener:
          g.panP = await WienerValues.getXML(panPElem, version);
          break;
      }

      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }
  static override validate(
    values: Algorithmic,
    fileContents: CMGFile,
    oldName: string
  ): string[] {
    const result: string[] = Silent.validate(values, fileContents, oldName);
    if (!values.presetName) result.push("Preset must be specified");
    if (values.beatCount > values.measureLength)
      result.push(
        "The number of beats in a measure must not exceed the measurement length"
      );
    if (values.noiseSeed == "") result.push("Seed must not be blank");
    if (values.noteP) {
      const notePType: ALGORITHMTYPE = values.noteP.algorithmType;
      switch (notePType) {
        case ALGORITHMTYPE.Constant:
          result.push(
            ...ConstantValues.validate(values.noteP as ConstantValues)
          );
          break;
        case ALGORITHMTYPE.Autoregressive:
          result.push(
            ...AutoregressiveValues.validate(
              values.noteP as AutoregressiveValues
            )
          );
          break;
        case ALGORITHMTYPE.Oscillator:
          result.push(
            ...OscillatorValues.validate(values.noteP as OscillatorValues)
          );
          break;
        case ALGORITHMTYPE.Markovian:
          result.push(
            ...MarkovianValues.validate(values.noteP as MarkovianValues)
          );
          break;
        case ALGORITHMTYPE.Wiener:
          result.push(...WienerValues.validate(values.noteP as WienerValues));
          break;
      }
    }
    if (values.attackP) {
      const attackPType: ALGORITHMTYPE = values.attackP.algorithmType;
      switch (attackPType) {
        case ALGORITHMTYPE.Constant:
          result.push(
            ...ConstantValues.validate(values.attackP as ConstantValues)
          );
          break;
        case ALGORITHMTYPE.Autoregressive:
          result.push(
            ...AutoregressiveValues.validate(
              values.attackP as AutoregressiveValues
            )
          );
          break;
        case ALGORITHMTYPE.Oscillator:
          result.push(
            ...OscillatorValues.validate(values.attackP as OscillatorValues)
          );
          break;
        case ALGORITHMTYPE.Markovian:
          result.push(
            ...MarkovianValues.validate(values.attackP as MarkovianValues)
          );
          break;
        case ALGORITHMTYPE.Wiener:
          result.push(...WienerValues.validate(values.attackP as WienerValues));
          break;
      }
    }
    if (values.speedP) {
      const speedPType: ALGORITHMTYPE = values.speedP.algorithmType;
      switch (speedPType) {
        case ALGORITHMTYPE.Constant:
          result.push(
            ...ConstantValues.validate(values.speedP as ConstantValues)
          );
          break;
        case ALGORITHMTYPE.Autoregressive:
          result.push(
            ...AutoregressiveValues.validate(
              values.speedP as AutoregressiveValues
            )
          );
          break;
        case ALGORITHMTYPE.Oscillator:
          result.push(
            ...OscillatorValues.validate(values.speedP as OscillatorValues)
          );
          break;
        case ALGORITHMTYPE.Markovian:
          result.push(
            ...MarkovianValues.validate(values.speedP as MarkovianValues)
          );
          break;
        case ALGORITHMTYPE.Wiener:
          result.push(...WienerValues.validate(values.speedP as WienerValues));
          break;
      }
    }
    if (values.durationP) {
      const durationPType: ALGORITHMTYPE = values.durationP.algorithmType;
      switch (durationPType) {
        case ALGORITHMTYPE.Constant:
          result.push(
            ...ConstantValues.validate(values.durationP as ConstantValues)
          );
          break;
        case ALGORITHMTYPE.Autoregressive:
          result.push(
            ...AutoregressiveValues.validate(
              values.durationP as AutoregressiveValues
            )
          );
          break;
        case ALGORITHMTYPE.Oscillator:
          result.push(
            ...OscillatorValues.validate(values.durationP as OscillatorValues)
          );
          break;
        case ALGORITHMTYPE.Markovian:
          result.push(
            ...MarkovianValues.validate(values.durationP as MarkovianValues)
          );
          break;
        case ALGORITHMTYPE.Wiener:
          result.push(
            ...WienerValues.validate(values.durationP as WienerValues)
          );
          break;
      }
    }
    if (values.volumeP) {
      const volumePType: ALGORITHMTYPE = values.volumeP.algorithmType;
      switch (volumePType) {
        case ALGORITHMTYPE.Constant:
          result.push(
            ...ConstantValues.validate(values.volumeP as ConstantValues)
          );
          break;
        case ALGORITHMTYPE.Autoregressive:
          result.push(
            ...AutoregressiveValues.validate(
              values.volumeP as AutoregressiveValues
            )
          );
          break;
        case ALGORITHMTYPE.Oscillator:
          result.push(
            ...OscillatorValues.validate(values.volumeP as OscillatorValues)
          );
          break;
        case ALGORITHMTYPE.Markovian:
          result.push(
            ...MarkovianValues.validate(values.volumeP as MarkovianValues)
          );
          break;
        case ALGORITHMTYPE.Wiener:
          result.push(...WienerValues.validate(values.volumeP as WienerValues));
          break;
      }
    }
    if (values.panP) {
      const panPType: ALGORITHMTYPE = values.panP.algorithmType;
      switch (panPType) {
        case ALGORITHMTYPE.Constant:
          result.push(
            ...ConstantValues.validate(values.panP as ConstantValues)
          );
          break;
        case ALGORITHMTYPE.Autoregressive:
          result.push(
            ...AutoregressiveValues.validate(
              values.panP as AutoregressiveValues
            )
          );
          break;
        case ALGORITHMTYPE.Oscillator:
          result.push(
            ...OscillatorValues.validate(values.panP as OscillatorValues)
          );
          break;
        case ALGORITHMTYPE.Markovian:
          result.push(
            ...MarkovianValues.validate(values.panP as MarkovianValues)
          );
          break;
        case ALGORITHMTYPE.Wiener:
          result.push(...WienerValues.validate(values.panP as WienerValues));
          break;
      }
    }
    return result;
  }
}

// this class represents an audio file that can be used as a generator source
export class AudioFile extends Silent {
  fileName: string;
  samples: Float32Array[];
  sampleRate: number;
  duration: number;
  volume: number;

  constructor(nextGenerator: number) {
    super(nextGenerator);
    this.type = GENERATORTYPE.AudioFile;
    this.fileName = "";
    this.samples = [];
    this.sampleRate = 0;
    this.duration = 0;
    this.volume = 0;
  }

  override copy(): AudioFile {
    const n = new AudioFile(0);
    n.name = this.name;
    n.startTime = this.startTime;
    n.stopTime = this.stopTime;
    n.mute = this.mute;
    n.position = this.position;
    n.fileName = this.fileName;
    n.samples = this.samples;
    n.sampleRate = this.sampleRate;
    n.duration = this.duration;
    n.volume = this.volume;
    return n;
  }

  getSample(
    context: AudioContext | OfflineAudioContext,
    source: AudioBufferSourceNode
  ): void {
    const numberOfChannels = this.samples.length;
    source.buffer = context.createBuffer(
      numberOfChannels,
      this.duration * this.sampleRate,
      this.sampleRate
    );
    for (let i = 0; i < numberOfChannels; i++) {
      // @ts-ignore
      source.buffer.copyToChannel(this.samples[i], i);
    }
  }

  override async setAttribute(name: string, value: string) {
    super.setAttribute(name, value);
    switch (name) {
      case "volume":
        this.volume = parseFloat(value);
        break;
      default:
        break;
    }
  }

  override async appendXML(doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      // start any compression of audio samples necessary
      // should be one for each channel
      const audioPromises: Promise<string>[] = [];
      this.samples.forEach((sample: Float32Array) => {
        const samplePromise: Promise<string> = compressAndConvertToString(
          // @ts-ignore
          sample.buffer
        );
        audioPromises.push(samplePromise);
      });

      // write the general attributes and wait for the sample promises to resolve, if there are any
      const returnElem: Element = await super.appendXML(doc, elem);
      returnElem.setAttribute("fileName", this.fileName);
      returnElem.setAttribute("volume", this.volume.toString());
      returnElem.setAttribute("duration", this.duration.toString());
      returnElem.setAttribute("sampleRate", this.sampleRate.toString());
      returnElem.setAttribute(
        "numberOfChannels",
        this.samples.length.toString()
      );

      if (audioPromises.length > 0) {
        const sampleStrings: string[] = await Promise.all(audioPromises);
        sampleStrings.forEach((s: string, i: number) => {
          returnElem.setAttribute(`sample${i}`, s);
        });
      }
      return Promise.resolve(returnElem);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }

  static override async getXML(
    elem: Element,
    version: string
  ): Promise<AudioFile> {
    try {
      const CMGgen: Silent = await Silent.getXML(elem, version);
      const g: AudioFile = new AudioFile(0);

      g.fileName = getAttributeValue(elem, "fileName", "string") as string;
      g.volume = getAttributeValue(elem, "volume", "float") as number;
      g.duration = getAttributeValue(elem, "duration", "float") as number;
      g.sampleRate = getAttributeValue(elem, "sampleRate", "float") as number;
      const numberOfChannels = getAttributeValue(
        elem,
        "numberOfChannels",
        "int"
      ) as number;

      // decompress the samples
      const samplePromises: Promise<Float32Array>[] = [];
      for (let i = 0; i < numberOfChannels; i++) {
        const sampleString: string = getAttributeValue(
          elem,
          `sample${i}`,
          "string"
        ) as string;
        const samplePromise: Promise<Float32Array> =
          convertFromJsonAndDecompress(sampleString);
        samplePromises.push(samplePromise);
      }

      // get the Silent values
      g.name = CMGgen.name;
      g.startTime = CMGgen.startTime;
      g.stopTime = CMGgen.stopTime;
      g.mute = CMGgen.mute;
      g.position = CMGgen.position;

      // load the decompressed samples
      if (samplePromises.length > 0) {
        const samples: Float32Array[] = await Promise.all(samplePromises);
        g.samples = samples;
      }

      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  static override validate(
    values: AudioFile,
    _fileContents: CMGFile,
    _oldName: string
  ): string[] {
    const errors: string[] = [];
    if (values.fileName == "") errors.push("Audio file must be specified");
    return errors;
  }
}
