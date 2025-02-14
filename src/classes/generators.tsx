import { SoundFont2 } from "soundfont2";
import {
  compressAndConvertToString,
  convertFromJsonAndDecompress,
} from "../utils/gzip";
import { Preset } from "../sfcomponents/types";
import { precision, presetNameToPreset } from "../sfcomponents/util";
import { Algorithm, ALGORITHMTYPE, GENERATORTYPE } from "../types";
import { euclideanRhythm } from "../utils/euclidean-rhythm";
import { getAttributeValue, getElementElement } from "../utils/xmlfunctions";
import {
  AlgorithmValues,
  MarkovianValues,
  OscillatorValues,
  WienerValues,
} from "./algorithmvalues";
import CMGFile from "./cmgfile";

// base class for all generator types
// contains properties used almost all generators
export class CMG {
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
    this.type = GENERATORTYPE.CMG;
    this.mute = false;
    this.position = 0;
  }

  copy(): CMG {
    const newCMG = new CMG(0);
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
        this.type = GENERATORTYPE.CMG;
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
      return Promise.resolve(returnElem);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }

  static async getXML(
    elem: Element,
    _version: string,
    _soundFont: SoundFont2
  ): Promise<CMG> {
    try {
      const g: CMG = new CMG(0);
      g.name = getAttributeValue(elem, "name", "string") as string;
      g.startTime = getAttributeValue(elem, "startTime", "float") as number;
      g.stopTime = getAttributeValue(elem, "stopTime", "float") as number;
      g.type = getAttributeValue(elem, "type", "string") as GENERATORTYPE;
      g.mute = getAttributeValue(elem, "mute", "string") == "true";
      g.position = getAttributeValue(elem, "position", "int") as number;
      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // validate the user-supplied values of the generator
  static validate(
    values: CMG,
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

export class Algorithmic extends CMG {
  soundFont: SoundFont2 | undefined;
  presetName: string; // the soundfont preset name (not needed for AudioFile or Noise)
  preset: Preset | undefined; // the soundfont preset object (derived from the presetName and the soundFont file)
  isLooping: boolean; // should the sample loop?
  measureLength: number; // the number of beats in a measure
  beatCount: number; // the number of strokes in a measure
  noiseAmplitude: number; // dB of Gaussian noise to apply
  noiseDispersion: number; // std of midi of Gaussion noise
  noteP: Algorithm;
  speedP: Algorithm;
  volumeP: Algorithm;
  panP: Algorithm;

  constructor(nextGenerator: number) {
    super(nextGenerator);
    this.type = GENERATORTYPE.Algorithmic;
    this.soundFont = undefined;
    this.presetName = "";
    this.preset = undefined;
    this.isLooping = true;
    this.measureLength = 4;
    this.beatCount = 4;
    this.noiseAmplitude = 0;
    this.noiseDispersion = 0;
    this.noteP = undefined;
    this.speedP = undefined;
    this.volumeP = undefined;
    this.panP = undefined;
  }

  override copy(): Algorithmic {
    const n = new Algorithmic(0);
    n.name = this.name;
    n.startTime = this.startTime;
    n.stopTime = this.stopTime;
    n.mute = this.mute;
    n.position = this.position;
    n.soundFont = this.soundFont;
    n.presetName = this.presetName;
    n.preset = this.preset;
    n.isLooping = this.isLooping;
    n.measureLength = this.measureLength;
    n.beatCount = this.beatCount;
    n.noiseAmplitude = this.noiseAmplitude;
    n.noiseDispersion = this.noiseDispersion;
    n.noteP = this.noteP;
    n.speedP = this.speedP;
    n.volumeP = this.volumeP;
    n.panP = this.panP;
    return n;
  }

  // when the soundfont file is changed update the preset
  setSoundFont(soundFont: SoundFont2) {
    this.soundFont = soundFont;
    const { preset, name } = presetNameToPreset(
      this.presetName,
      this.soundFont
    );
    this.preset = preset;
    this.presetName = name;
  }

  override setAttribute(name: string, value: string): void {
    // handle a change of the algorithm type
    super.setAttribute(name, value);
    switch (name) {
      case "presetName":
        this.presetName = value;
        const { preset } = presetNameToPreset(this.presetName, this.soundFont);
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
      case "noiseAmplitude":
        this.noiseAmplitude = parseInt(value);
        return;
      case "noiseDispersion":
        this.noiseDispersion = parseInt(value);
        return;
      case "noteP.algorithmType":
        switch (value) {
          case "Oscillator":
            this.noteP = new OscillatorValues();
            return;
          case "Markovian":
            this.noteP = new MarkovianValues();
            return;
          case "Wiener":
            this.noteP = new WienerValues();
            return;
          case "None":
            this.noteP = new AlgorithmValues();
            return;
        }
        break;
      case "speedP.algorithmType":
        switch (value) {
          case "Oscillator":
            this.speedP = new OscillatorValues();
            return;
          case "Markovian":
            this.speedP = new MarkovianValues();
            return;
          case "Wiener":
            this.speedP = new WienerValues();
            return;
          case "None":
            this.speedP = new AlgorithmValues();
            return;
        }
        break;
      case "volumeP.algorithmType":
        switch (value) {
          case "Oscillator":
            this.volumeP = new OscillatorValues();
            return;
          case "Markovian":
            this.volumeP = new MarkovianValues();
            return;
          case "Wiener":
            this.volumeP = new WienerValues();
            return;
          case "None":
            this.volumeP = new AlgorithmValues();
            return;
        }
        break;
      case "panP.algorithmType":
        switch (value) {
          case "Oscillator":
            this.panP = new OscillatorValues();
            return;
          case "Markovian":
            this.panP = new MarkovianValues();
            return;
          case "Wiener":
            this.panP = new WienerValues();
            return;
          case "None":
            this.panP = new AlgorithmValues();
            return;
        }
        break;
    }

    // handle all other algorithm property values
    const nameParts: string[] = name.split("."); // should be four, the third being 'values'
    const parameterName: string = nameParts[0];
    const algorithmName: string = nameParts[1];
    const valueName: string = nameParts[3];
    switch (parameterName) {
      case "noteP":
        switch (algorithmName) {
          case "oscillator":
            (this.noteP as OscillatorValues).setAttribute(valueName, value);
            return;
          case "markovian":
            (this.noteP as MarkovianValues).setAttribute(valueName, value);
            return;
          case "wiener":
            (this.noteP as WienerValues).setAttribute(valueName, value);
            return;
        }
        break;
      case "speedP":
        switch (algorithmName) {
          case "oscillator":
            (this.speedP as OscillatorValues).setAttribute(valueName, value);
            return;
          case "markovian":
            (this.speedP as MarkovianValues).setAttribute(valueName, value);
            return;
          case "wiener":
            (this.speedP as WienerValues).setAttribute(valueName, value);
            return;
        }
        break;
      case "volumeP":
        switch (algorithmName) {
          case "oscillator":
            (this.volumeP as OscillatorValues).setAttribute(valueName, value);
            return;
          case "markovian":
            (this.volumeP as MarkovianValues).setAttribute(valueName, value);
            return;
          case "wiener":
            (this.volumeP as WienerValues).setAttribute(valueName, value);
            return;
        }
        break;
      case "panP":
        switch (algorithmName) {
          case "oscillator":
            (this.panP as OscillatorValues).setAttribute(valueName, value);
            return;
          case "markovian":
            (this.panP as MarkovianValues).setAttribute(valueName, value);
            return;
          case "wiener":
            (this.panP as WienerValues).setAttribute(valueName, value);
            return;
        }
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
    note: number;
    speed: number;
    volume: number;
    pan: number;
  } {
    const entry: number = this.#currentRhythmEntry;
    this.#currentRhythmEntry =
      (this.#currentRhythmEntry + 1) % this.measureLength;
    const beat = this.#beatSequence[entry] != 0;
    let note: number = 0;
    let speed: number = 0;
    let volume: number = 0;
    let pan: number = 0;
    switch (this.noteP?.algorithmType) {
      case ALGORITHMTYPE.Oscillator:
        note = (this.noteP as OscillatorValues).getCurrentValue(time);
        break;
      case ALGORITHMTYPE.Markovian:
        note = (this.noteP as MarkovianValues).getCurrentValue(time);
        break;
      case ALGORITHMTYPE.Wiener:
        note = (this.noteP as WienerValues).getCurrentValue(time);
        break;
    }
    switch (this.speedP?.algorithmType) {
      case ALGORITHMTYPE.Oscillator:
        note = (this.speedP as OscillatorValues).getCurrentValue(time);
        break;
      case ALGORITHMTYPE.Markovian:
        note = (this.speedP as MarkovianValues).getCurrentValue(time);
        break;
      case ALGORITHMTYPE.Wiener:
        note = (this.speedP as WienerValues).getCurrentValue(time);
        break;
    }
    switch (this.volumeP?.algorithmType) {
      case ALGORITHMTYPE.Oscillator:
        note = (this.volumeP as OscillatorValues).getCurrentValue(time);
        break;
      case ALGORITHMTYPE.Markovian:
        note = (this.volumeP as MarkovianValues).getCurrentValue(time);
        break;
      case ALGORITHMTYPE.Wiener:
        note = (this.volumeP as WienerValues).getCurrentValue(time);
        break;
    }
    switch (this.panP?.algorithmType) {
      case ALGORITHMTYPE.Oscillator:
        note = (this.panP as OscillatorValues).getCurrentValue(time);
        break;
      case ALGORITHMTYPE.Markovian:
        note = (this.panP as MarkovianValues).getCurrentValue(time);
        break;
      case ALGORITHMTYPE.Wiener:
        note = (this.panP as WienerValues).getCurrentValue(time);
        break;
    }
    return { beat, note, speed, volume, pan };
  }

  override async appendXML(doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      const returnElem: Element = elem;
      await super.appendXML(doc, returnElem);
      returnElem.setAttribute("presetName", this.presetName);
      returnElem.setAttribute("isLooping", this.isLooping ? "true" : "false");
      returnElem.setAttribute("measureLength", this.measureLength.toString());
      returnElem.setAttribute("beatCount", this.beatCount.toString());
      returnElem.setAttribute("noiseAmplitude", this.noiseAmplitude.toString());
      returnElem.setAttribute(
        "noiseDispersion",
        this.noiseDispersion.toString()
      );
      returnElem.setAttribute("position", this.position.toString());

      const notePElem: Element = doc.createElement("noteP");
      const speedPElem: Element = doc.createElement("noteP");
      const volumePElem: Element = doc.createElement("noteP");
      const panPElem: Element = doc.createElement("noteP");
      returnElem.appendChild(notePElem);
      returnElem.appendChild(speedPElem);
      returnElem.appendChild(volumePElem);
      returnElem.appendChild(panPElem);
      switch (this.noteP?.algorithmType) {
        case ALGORITHMTYPE.Oscillator:
          (this.noteP as OscillatorValues).appendXML(doc, notePElem);
          break;
        case ALGORITHMTYPE.Markovian:
          (this.noteP as MarkovianValues).appendXML(doc, notePElem);
          break;
        case ALGORITHMTYPE.Wiener:
          (this.noteP as WienerValues).appendXML(doc, notePElem);
          break;
      }
      switch (this.speedP?.algorithmType) {
        case ALGORITHMTYPE.Oscillator:
          (this.speedP as OscillatorValues).appendXML(doc, speedPElem);
          break;
        case ALGORITHMTYPE.Markovian:
          (this.speedP as MarkovianValues).appendXML(doc, speedPElem);
          break;
        case ALGORITHMTYPE.Wiener:
          (this.speedP as WienerValues).appendXML(doc, speedPElem);
          break;
      }
      switch (this.volumeP?.algorithmType) {
        case ALGORITHMTYPE.Oscillator:
          (this.volumeP as OscillatorValues).appendXML(doc, volumePElem);
          break;
        case ALGORITHMTYPE.Markovian:
          (this.volumeP as MarkovianValues).appendXML(doc, volumePElem);
          break;
        case ALGORITHMTYPE.Wiener:
          (this.volumeP as WienerValues).appendXML(doc, volumePElem);
          break;
      }
      switch (this.panP?.algorithmType) {
        case ALGORITHMTYPE.Oscillator:
          (this.panP as OscillatorValues).appendXML(doc, panPElem);
          break;
        case ALGORITHMTYPE.Markovian:
          (this.panP as MarkovianValues).appendXML(doc, panPElem);
          break;
        case ALGORITHMTYPE.Wiener:
          (this.panP as WienerValues).appendXML(doc, panPElem);
          break;
      }
      return Promise.resolve(returnElem);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }
  static override async getXML(
    elem: Element,
    version: string,
    soundFont: SoundFont2
  ): Promise<Algorithmic> {
    try {
      const CMGgen: CMG = await CMG.getXML(elem, version, soundFont);
      const g: Algorithmic = new Algorithmic(0);
      g.soundFont = soundFont;
      g.presetName = getAttributeValue(elem, "presetName", "string") as string;
      const { preset } = presetNameToPreset(g.presetName, soundFont);
      g.preset = preset;
      g.isLooping =
        (getAttributeValue(elem, "isLooping", "string") as string) == "true";
      g.measureLength = getAttributeValue(
        elem,
        "measureLength",
        "int"
      ) as number;
      g.beatCount = getAttributeValue(elem, "beatCount", "int") as number;
      g.noiseAmplitude = getAttributeValue(
        elem,
        "noiseAmplitude",
        "int"
      ) as number;
      g.noiseDispersion = getAttributeValue(
        elem,
        "noiseDispersion",
        "int"
      ) as number;

      const notePElem: Element = getElementElement(elem, "noteP");
      const speedPElem: Element = getElementElement(elem, "speedP");
      const volumePElem: Element = getElementElement(elem, "volumeP");
      const panPElem: Element = getElementElement(elem, "panP");
      const notePType: ALGORITHMTYPE = getAttributeValue(
        notePElem,
        "algorithmType",
        "string"
      ) as ALGORITHMTYPE;
      const speedPType: ALGORITHMTYPE = getAttributeValue(
        speedPElem,
        "algorithmType",
        "string"
      ) as ALGORITHMTYPE;
      const volumePType: ALGORITHMTYPE = getAttributeValue(
        volumePElem,
        "algorithmType",
        "string"
      ) as ALGORITHMTYPE;
      const panPType: ALGORITHMTYPE = getAttributeValue(
        panPElem,
        "algorithmType",
        "string"
      ) as ALGORITHMTYPE;
      switch (notePType) {
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
      switch (speedPType) {
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
      switch (volumePType) {
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
      switch (panPType) {
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
      g.name = CMGgen.name;
      g.startTime = CMGgen.startTime;
      g.stopTime = CMGgen.stopTime;
      g.mute = CMGgen.mute;
      g.position = CMGgen.position;

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
    const result: string[] = CMG.validate(values, fileContents, oldName);
    if (!values.presetName) result.push("Preset must be specified");
    if (values.beatCount > values.measureLength)
      result.push(
        "The number of beats in a measure must not exceed the measurement length"
      );
    if (values.noteP) {
      const notePType: ALGORITHMTYPE = values.noteP.algorithmType;
      switch (notePType) {
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
    if (values.speedP) {
      const speedPType: ALGORITHMTYPE = values.speedP.algorithmType;
      switch (speedPType) {
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
    if (values.volumeP) {
      const volumePType: ALGORITHMTYPE = values.volumeP.algorithmType;
      switch (volumePType) {
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
export class AudioFile extends CMG {
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
      source.buffer.copyToChannel(this.samples[i], i);
    }
  }

  override setAttribute(name: string, value: string): void {
    super.setAttribute(name, value);
    switch (name) {
      case "fileName":
        // load the data from the file
        // the filename will not update if there is an error
        window
          .showOpenFilePicker({
            multiple: false,
          })
          .then((rh: FileSystemFileHandle[]) => {
            rh[0].getFile().then((file: File) => {
              file.arrayBuffer().then((buffer: ArrayBuffer) => {
                const context: AudioContext = new AudioContext();
                context.decodeAudioData(buffer).then((audio: AudioBuffer) => {
                  this.fileName = file.name;
                  this.sampleRate = audio.sampleRate;
                  this.duration = precision(audio.duration, 1);
                  this.stopTime = this.startTime + this.duration;
                  this.samples = [];
                  for (let i = 0; i < audio.numberOfChannels; i++) {
                    const channelData: Float32Array = audio.getChannelData(i);
                    this.samples.push(channelData);
                  }
                });
              });
            });
          });
        break;
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
    version: string,
    soundFont: SoundFont2
  ): Promise<AudioFile> {
    try {
      const CMGgen: CMG = await CMG.getXML(elem, version, soundFont);
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

      // get the CMG values
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

// TODO the Noise generator

// the noise generator - uses algorithms for speed, volume, and pan and white
// or gaussian noise for note
