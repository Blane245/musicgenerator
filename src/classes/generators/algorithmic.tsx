// the algorithmic generator - uses oscillator, markovian, wiener algorithms to
// provide note, speed, volume, and pan values
// uses the euclidean beats from the parent class

import AutoregressiveValues from "classes/algorithms/autoregressivevalues";
import ConstantValues from "classes/algorithms/constantvalues";
import MarkovianValues from "classes/algorithms/markovianvalues";
import OscillatorValues from "classes/algorithms/oscillatorvalues";
import SequenceValues from "classes/algorithms/sequencevalues";
import WienerValues from "classes/algorithms/wienervalues";
import CMGFile from "classes/cmgfile";
import RandomNumber from "classes/randomnumber";
import { Preset } from "sfcomponents/types";
import { presetNameToPreset } from "sfcomponents/util";
import { SoundFont2 } from "soundfont2";
import {
  ALGORITHMTYPE,
  AlgorithmType,
  effectNames,
  GENERATORTYPE,
  parameterNames,
  SEQUENCEATTRIBUTE,
  SoundFontGenerators,
  SoundFontGeneratorsType,
} from "types";
import { euclideanRhythm } from "utils/euclidean-rhythm";
import {
  getAttributeValueWithDefault,
  getElementElement,
} from "utils/xmlfunctions";
import Silent from "./silent";
import Tremolo from "classes/algorithms/tremolo";

export default class Algorithmic extends Silent {
  soundFontFile: string;
  soundFont: SoundFont2 | undefined;
  presets: Preset[]; // the soundfont preset list (not needed for AudioFile or Noise)
  presetName: string; // the soundfont preset name (not needed for AudioFile or Noise)
  preset: Preset | undefined; // the soundfont preset object (derived from the presetName and the soundFont file)
  isLooping: boolean; // should the sample loop?
  measureLength: number; // the number of beats in a measure
  beatCount: number; // the number of strokes in a measure
  offsetSequence: number; // amount to shift the rhythm sequence
  noteCount: number; // the number of active notes in an active
  offsetNotes: number; // amount to shift the note sequence in the octave
  #activeNotes: number[]; // the active notes of the octave
  noiseSeed: string;
  rn: RandomNumber;
  noiseFrequency: number; // frequency of the modulation moise
  noiseAmplitude: number; // noise gain
  noiseEnabled: boolean;
  reverb: ConvolverNode | undefined;
  context: AudioContext | OfflineAudioContext | undefined;
  reverbDuration: number;
  reverbDecay: number;
  attackEnabled: boolean;
  noteP: AlgorithmType;
  attackP: AlgorithmType;
  speedP: AlgorithmType;
  durationP: AlgorithmType;
  volumeP: AlgorithmType;
  panP: AlgorithmType;
  tremolo: Tremolo;
  tremeloEnabled: boolean;
  vibrato: Tremolo;
  vibratoEnabled: boolean;

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
    this.offsetSequence = 0;
    this.noteCount = 12;
    this.offsetNotes = 0;
    this.#activeNotes = euclideanRhythm(this.noteCount, 12, this.offsetNotes);
    this.noiseSeed = "seed";
    this.rn = new RandomNumber(this.noiseSeed);
    this.noiseFrequency = 0;
    this.noiseAmplitude = 0;
    this.reverb = undefined;
    this.context = undefined;
    this.reverbDecay = 0;
    this.reverbDuration = 0;
    this.attackEnabled = true;
    this.noteP = new ConstantValues(60);
    this.attackP = new ConstantValues(63);
    this.speedP = new ConstantValues(60);
    this.durationP = new ConstantValues(100);
    this.volumeP = new ConstantValues(0);
    this.panP = new ConstantValues(0);
    this.tremolo = new Tremolo();
    this.vibrato = new Tremolo();
    this.noiseEnabled = true;
    this.tremeloEnabled = true;
    this.vibratoEnabled = true;
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
    n.attackEnabled = this.attackEnabled;
    n.soundFontFile = this.soundFontFile;
    n.soundFont = this.soundFont;
    n.presetName = this.presetName;
    n.preset = this.preset;
    n.presets = this.presets;
    n.isLooping = this.isLooping;
    n.measureLength = this.measureLength;
    n.beatCount = this.beatCount;
    n.offsetSequence = this.offsetSequence;
    n.noteCount = this.noteCount;
    n.offsetNotes = this.offsetNotes;
    n.#activeNotes = this.#activeNotes;
    n.noiseSeed = this.noiseSeed;
    n.rn = this.rn;
    n.noiseAmplitude = this.noiseAmplitude;
    n.noiseFrequency = this.noiseFrequency;
    n.reverb = this.reverb;
    n.context = this.context;
    n.reverbDuration = this.reverbDuration;
    n.reverbDecay = this.reverbDecay;
    n.attackEnabled = this.attackEnabled;
    n.noteP = this.noteP.copy();
    n.attackP = this.attackP.copy();
    n.speedP = this.speedP.copy();
    n.durationP = this.durationP.copy();
    n.volumeP = this.volumeP.copy();
    n.panP = this.panP.copy();
    n.tremolo = this.tremolo.copy();
    n.vibrato = this.vibrato.copy();
    n.noiseEnabled = this.noiseEnabled;
    n.tremeloEnabled = this.tremeloEnabled;
    n.vibratoEnabled = this.vibratoEnabled;
    return n;
  }

  override setAttribute(name: string, value: string): boolean {
    // handle a change of the algorithm type
    if (super.setAttribute(name, value)) return true;
    switch (name) {
      case "soundfontfile": {
        if (value != "select a file") {
          this.soundFontFile = value;
          // this will trigger the soundfont to be loaded and the presets to be set
          // by the calling dialog
        }
        return true;
      }
      case "presetName":
        this.presetName = value;
        const { preset } = presetNameToPreset(this.presetName, this.presets);
        this.preset = preset;
        return true;
      case "isLooping":
        this.isLooping = value == "true";
        return true;
      case "measureLength":
        this.measureLength = parseInt(value);
        return true;
      case "beatCount":
        this.beatCount = parseInt(value);
        return true;
      case "offsetSequence":
        this.offsetSequence = parseInt(value);
        return true;
      case "noteCount":
        this.noteCount = parseInt(value);
        this.#activeNotes = euclideanRhythm(
          this.noteCount,
          12,
          this.offsetNotes
        );
        return true;
      case "offsetNotes":
        this.offsetNotes = parseInt(value);
        this.#activeNotes = euclideanRhythm(
          this.noteCount,
          12,
          this.offsetNotes
        );
        return true;
      case "noiseSeed":
        this.noiseSeed = value;
        this.rn = new RandomNumber(this.noiseSeed);
        return true;
      case "noiseAmplitude":
        this.noiseAmplitude = parseFloat(value);
        return true;
      case "noiseFrequency":
        this.noiseFrequency = parseFloat(value);
        return true;
      case "reverbDuration":
        this.reverbDuration = parseFloat(value);
        return true;
      case "reverbDecay":
        this.reverbDecay = parseFloat(value);
        return true;
      case "attackEnabled":
        this.attackEnabled = value == "true";
        return true;
      case "noteP.algorithmType":
        switch (value) {
          case "Constant":
            this.noteP = new ConstantValues();
            return true;
          case "Autoregressive":
            this.noteP = new AutoregressiveValues();
            return true;
          case "Oscillator":
            this.noteP = new OscillatorValues();
            return true;
          case "Markovian":
            this.noteP = new MarkovianValues();
            return true;
          case "Wiener":
            this.noteP = new WienerValues();
            return true;
          case "Sequencer":
            this.noteP = new SequenceValues(SEQUENCEATTRIBUTE.note);
            return true;
          default:
            return false;
        }
      case "attackP.algorithmType":
        switch (value) {
          case "Constant":
            this.attackP = new ConstantValues();
            return true;
          case "Autoregressive":
            this.attackP = new AutoregressiveValues();
            return true;
          case "Oscillator":
            this.attackP = new OscillatorValues();
            return true;
          case "Markovian":
            this.attackP = new MarkovianValues();
            return true;
          case "Wiener":
            this.attackP = new WienerValues();
            return true;
          case "Sequencer":
            this.attackP = new SequenceValues(SEQUENCEATTRIBUTE.attack);
            return true;
          default:
            return false;
        }
      case "speedP.algorithmType":
        switch (value) {
          case "Constant":
            this.speedP = new ConstantValues();
            return true;
          case "Autoregressive":
            this.speedP = new AutoregressiveValues();
            return true;
          case "Oscillator":
            this.speedP = new OscillatorValues();
            return true;
          case "Markovian":
            this.speedP = new MarkovianValues();
            return true;
          case "Wiener":
            this.speedP = new WienerValues();
            return true;
          case "Sequencer":
            this.speedP = new SequenceValues(SEQUENCEATTRIBUTE.speed);
            return true;
          default:
            return false;
        }
      case "durationP.algorithmType":
        switch (value) {
          case "Constant":
            this.durationP = new ConstantValues(100);
            return true;
          case "Autoregressive":
            this.durationP = new AutoregressiveValues();
            return true;
          case "Oscillator":
            this.durationP = new OscillatorValues();
            return true;
          case "Markovian":
            this.durationP = new MarkovianValues();
            return true;
          case "Wiener":
            this.durationP = new WienerValues();
            return true;
          case "Sequencer":
            this.durationP = new SequenceValues(SEQUENCEATTRIBUTE.duration);
            return true;
          default:
            return false;
        }
      case "volumeP.algorithmType":
        switch (value) {
          case "Constant":
            this.volumeP = new ConstantValues();
            return true;
          case "Autoregressive":
            this.volumeP = new AutoregressiveValues();
            return true;
          case "Oscillator":
            this.volumeP = new OscillatorValues();
            return true;
          case "Markovian":
            this.volumeP = new MarkovianValues();
            return true;
          case "Wiener":
            this.volumeP = new WienerValues();
            return true;
          case "Sequencer":
            this.volumeP = new SequenceValues(SEQUENCEATTRIBUTE.volume);
            return true;
          default:
            return false;
        }
      case "panP.algorithmType":
        switch (value) {
          case "Constant":
            this.panP = new ConstantValues();
            return true;
          case "Autoregressive":
            this.panP = new AutoregressiveValues();
            return true;
          case "Oscillator":
            this.panP = new OscillatorValues();
            return true;
          case "Markovian":
            this.panP = new MarkovianValues();
            return true;
          case "Wiener":
            this.panP = new WienerValues();
            return true;
          case "Sequencer":
            this.panP = new SequenceValues(SEQUENCEATTRIBUTE.pan);
            return true;
          default:
            return false;
        }
    }

    // handle all other algorithm property values
    const nameParts: string[] = name.split("."); // should be four, the third being 'values'
    const parameterName: string = nameParts[0];
    const valueName: string = nameParts[1];
    switch (parameterName) {
      case "noteP":
        this.noteP.setAttribute(valueName, value);
        return true;
      case "attackP":
        this.attackP.setAttribute(valueName, value);
        return true;
      case "speedP":
        this.speedP.setAttribute(valueName, value);
        return true;
      case "durationP":
        this.durationP.setAttribute(valueName, value);
        return true;
      case "volumeP":
        this.volumeP.setAttribute(valueName, value);
        return true;
      case "panP":
        this.panP.setAttribute(valueName, value);
        return true;
      case "tremolo":
        this.tremolo.setAttribute(valueName, value);
        return true;
      case "vibrato":
        this.vibrato.setAttribute(valueName, value);
        return true;
      default:
        return false;
    }
  }

  setControlState(noiseEnabled: boolean, tremoloEnabled: boolean, vibratoEnabled: boolean) {
    this.noiseEnabled = noiseEnabled,
    this.tremeloEnabled = tremoloEnabled;
    this.vibratoEnabled = vibratoEnabled;
  }

  // beat counting
  #beatSequence: number[] = [];
  #currentRhythmEntry: number = 0;
  initialSequence() {
    this.#beatSequence = euclideanRhythm(
      this.beatCount,
      this.measureLength,
      this.offsetSequence
    );
    this.#currentRhythmEntry = 0;
  }

  getCurrentValues(
    time: number,
    beats: number
  ): {
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
    let note: number = 0;
    let attack: number = 0;
    let speed: number = 0;
    let duration: number = 0;
    let volume: number = 0;
    let pan: number = 0;
    note = this.noteP.getCurrentValue(time, beats);
    note = Math.min(127, Math.max(0, note));

    attack = this.attackP.getCurrentValue(time, beats);
    attack = Math.min(127, Math.max(0, attack));

    speed = this.speedP.getCurrentValue(time, beats);
    speed = Math.min(10000, Math.max(0.001, speed));

    duration = this.durationP.getCurrentValue(time, beats);
    duration = Math.min(100, Math.max(0, duration));

    volume = this.volumeP.getCurrentValue(time, beats);
    volume = Math.min(10, Math.max(-10, volume));

    pan = this.panP.getCurrentValue(time, beats);
    pan = Math.min(1, Math.max(-1, pan));

    // modify the note based on those selectable in the octave
    note = this.#getSelectedNote(note);
    return { beat, note, attack, speed, duration, volume, pan };

    // the tremolo and vibrato effects values are retrieved when the sample
    // is being processed
  }

  #getSelectedNote(note: number): number {
    // get the pitch integer and fraction parts
    let pitch = Math.round(note);
    const midiFraction = note - pitch;

    // get the octave and offset values
    const midiOffset = pitch % 12;
    const normalizedMidiOffset = (midiOffset + 12) % 12;
    const octave: number = Math.trunc(pitch / 12);

    // if the note is on, return the original note
    if (this.#activeNotes[normalizedMidiOffset] == 1) {
      // console.log("returning original note", note);
      return note;
    }

    // find the two selected notes surrounding this nonselected note
    // this assumes that the first note in the sequence is selected
    let first: number = normalizedMidiOffset;
    let last: number = normalizedMidiOffset;
    while (first >= 0 && this.#activeNotes[first] == 0) first--;
    while (last < 12 && this.#activeNotes[last] == 0) last++;
    const firstOffset: number = normalizedMidiOffset - first;
    const lastOffset: number = last - normalizedMidiOffset;
    // set the pitch to the closest active note, favoring the lower one
    if (firstOffset <= lastOffset) pitch = octave * 12 + first;
    else pitch = octave * 12 + last;

    // return with the fractional note applied
    // console.log("returning modified note", pitch + midiFraction);
    return pitch + midiFraction;
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
      returnElem.setAttribute("offsetSequence", this.offsetSequence.toString());
      returnElem.setAttribute("noteCount", this.noteCount.toString());
      returnElem.setAttribute("offsetNotes", this.offsetNotes.toString());
      returnElem.setAttribute("noiseSeed", this.noiseSeed);
      returnElem.setAttribute("noteCount", this.noteCount.toString());
      returnElem.setAttribute("noiseAmplitude", this.noiseAmplitude.toString());
      returnElem.setAttribute("noiseFrequency", this.noiseFrequency.toString());
      returnElem.setAttribute("reverbDuration", this.reverbDuration.toString());
      returnElem.setAttribute("reverbDecay", this.reverbDecay.toString());
      returnElem.setAttribute("attackEnabled", this.attackEnabled.toString());

      const notePElem: Element = doc.createElement("noteP");
      const attackPElem: Element = doc.createElement("attackP");
      const speedPElem: Element = doc.createElement("speedP");
      const durationPElem: Element = doc.createElement("durationP");
      const volumePElem: Element = doc.createElement("volumeP");
      const panPElem: Element = doc.createElement("panP");
      const tremeloElem: Element = doc.createElement("tremolo");
      const vibratoElem: Element = doc.createElement("vibrato");
      returnElem.appendChild(notePElem);
      returnElem.appendChild(attackPElem);
      returnElem.appendChild(speedPElem);
      returnElem.appendChild(durationPElem);
      returnElem.appendChild(volumePElem);
      returnElem.appendChild(panPElem);
      returnElem.appendChild(tremeloElem);
      returnElem.appendChild(vibratoElem);
      this.noteP.appendXML(doc, notePElem);
      this.attackP.appendXML(doc, attackPElem);
      this.speedP.appendXML(doc, speedPElem);
      this.durationP.appendXML(doc, durationPElem);
      this.volumeP.appendXML(doc, volumePElem);
      this.panP.appendXML(doc, panPElem);
      this.tremolo.appendXML(doc, tremeloElem);
      this.vibrato.appendXML(doc, vibratoElem);
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

      g.presetName = getAttributeValueWithDefault(
        elem,
        "presetName",
        "string",
        ""
      ) as string;
      g.soundFontFile = getAttributeValueWithDefault(
        elem,
        "soundFontFile",
        "string",
        ""
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
        (getAttributeValueWithDefault(
          elem,
          "isLooping",
          "string",
          "true"
        ) as string) == "true";
      g.measureLength = getAttributeValueWithDefault(
        elem,
        "measureLength",
        "int",
        1
      ) as number;
      g.beatCount = getAttributeValueWithDefault(
        elem,
        "beatCount",
        "int",
        1
      ) as number;
      g.offsetSequence = getAttributeValueWithDefault(
        elem,
        "offsetSequence",
        "int",
        1
      ) as number;
      g.initialSequence();
      g.noteCount = getAttributeValueWithDefault(
        elem,
        "noteCount",
        "int",
        1
      ) as number;
      try {
        g.offsetNotes = getAttributeValueWithDefault(
          elem,
          "offsetNotes",
          "int",
          1
        ) as number;
      } catch (e) {
        g.offsetNotes = 0;
      }
      g.#activeNotes = euclideanRhythm(g.noteCount, 12, g.offsetNotes);
      g.noiseSeed = getAttributeValueWithDefault(
        elem,
        "noiseSeed",
        "string",
        "seed"
      ) as string;
      g.noiseAmplitude = getAttributeValueWithDefault(
        elem,
        "noiseAmplitude",
        "float",
        0
      ) as number;
      try {
        g.noiseFrequency = getAttributeValueWithDefault(
          elem,
          "noiseFrequency",
          "float",
          0
        ) as number;
      } catch (e) {
        g.noiseFrequency = 0;
      }
        g.reverbDuration = getAttributeValueWithDefault(
          elem,
          "reverbDuration",
          "float",
          0
        ) as number;
        g.reverbDecay = getAttributeValueWithDefault(
          elem,
          "reverbDecay",
          "float",
          0
        ) as number;
      g.attackEnabled = getAttributeValueWithDefault(
        elem,
        "attackEnabled",
        "boolean",
        true
      ) as boolean;
      [g.noteP, g.speedP, g.attackP, g.durationP, g.volumeP, g.panP].forEach(
        async (algorithm: AlgorithmType, i) => {
          let newAlgorithm: AlgorithmType = algorithm.copy();
          const pElem: Element | null = getElementElement(elem, parameterNames[i]);
          if (!pElem) throw new Error(`Algorithmic getXML missing attribute ${parameterNames[i]}`);

          const pType: ALGORITHMTYPE = getAttributeValueWithDefault(
            pElem,
            "algorithmType",
            "string",
            ""
          ) as ALGORITHMTYPE;
          switch (pType) {
            case ALGORITHMTYPE.Constant: {
              const promise: Promise<ConstantValues> = ConstantValues.getXML(
                pElem,
                version
              );
              const result: AlgorithmType[] = await Promise.all([promise]);
              newAlgorithm = result[0];
              break;
            }
            case ALGORITHMTYPE.Autoregressive: {
              const promise: Promise<AutoregressiveValues> =
                AutoregressiveValues.getXML(pElem, version);
              const result: AlgorithmType[] = await Promise.all([promise]);
              newAlgorithm = result[0];
              break;
            }
            case ALGORITHMTYPE.Oscillator: {
              const promise: Promise<OscillatorValues> =
                OscillatorValues.getXML(pElem, version);
              const result: AlgorithmType[] = await Promise.all([promise]);
              newAlgorithm = result[0];
              break;
            }
            case ALGORITHMTYPE.Markovian: {
              const promise: Promise<MarkovianValues> = MarkovianValues.getXML(
                pElem,
                version
              );
              const result: AlgorithmType[] = await Promise.all([promise]);
              newAlgorithm = result[0];
              break;
            }
            case ALGORITHMTYPE.Wiener: {
              const promise: Promise<WienerValues> = WienerValues.getXML(
                pElem,
                version
              );
              const result: AlgorithmType[] = await Promise.all([promise]);
              newAlgorithm = result[0];
              break;
            }
            case ALGORITHMTYPE.Sequencer: {
              const promise: Promise<SequenceValues> = SequenceValues.getXML(
                pElem,
                version
              );
              const result: AlgorithmType[] = await Promise.all([promise]);
              newAlgorithm = result[0];
              break;
            }
          }
          // move the new algorithm to the correct attribute
          switch (parameterNames[i]) {
            case "noteP":
              g.noteP = newAlgorithm;
              break;
            case "speedP":
              g.speedP = newAlgorithm;
              break;
            case "attackP":
              g.attackP = newAlgorithm;
              break;
            case "durationP":
              g.durationP = newAlgorithm;
              break;
            case "volumeP":
              g.volumeP = newAlgorithm;
              break;
            case "panP":
              g.panP = newAlgorithm;
              break;
          }

          // get the tremolo and vibrator effects
          [g.tremolo, g.vibrato].forEach(async (_effect:Tremolo, i) => {
            try {
              const eElem: Element | null = getElementElement(elem, effectNames[i]);
              if (!eElem) throw new Error(`Algorithmic getXML missing effect ${effectNames[i]}`);

              const promise: Promise<Tremolo> = Tremolo.getXML(eElem, version);
              const tResult: Tremolo[] = await Promise.all([promise]);
              if (effectNames[i] == 'tremolo')
                g.tremolo = tResult[0];  
              else
                g.vibrato = tResult[0];
            } catch (e) {
              if (effectNames[i] == 'tremolo')
                g.tremolo = new Tremolo();  
              else
                g.vibrato = new Tremolo();
            }
          });
        }
      );

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
    if (values.offsetSequence >= values.measureLength)
      result.push("Beat shift amount must be less than the measurement length");
    if (values.noiseSeed == "") result.push("Seed must not be blank");
    const noteP: AlgorithmType = values.noteP;
    const speedP: AlgorithmType = values.speedP;
    const attackP: AlgorithmType = values.attackP;
    const durationP: AlgorithmType = values.durationP;
    const volumeP: AlgorithmType = values.volumeP;
    const panP: AlgorithmType = values.panP;
    // if the noteP is not of sequencer type, then none of the other
    // atrtibutes can be of sequencer type
    if (noteP.algorithmType != ALGORITHMTYPE.Sequencer) {
      if (
        speedP.algorithmType == ALGORITHMTYPE.Sequencer ||
        attackP.algorithmType == ALGORITHMTYPE.Sequencer ||
        durationP.algorithmType == ALGORITHMTYPE.Sequencer ||
        volumeP.algorithmType == ALGORITHMTYPE.Sequencer ||
        panP.algorithmType == ALGORITHMTYPE.Sequencer
      )
        result.push(
          "If note is not a sequencer, no other attribute can be a sequencer."
        );
    }
    [noteP, speedP, attackP, durationP, volumeP, panP].forEach(
      (algorithm: AlgorithmType) => {
        switch (algorithm.algorithmType) {
          case ALGORITHMTYPE.Constant:
            result.push(
              ...ConstantValues.validate(algorithm as ConstantValues)
            );
            break;
          case ALGORITHMTYPE.Autoregressive:
            result.push(
              ...AutoregressiveValues.validate(
                algorithm as AutoregressiveValues
              )
            );
            break;
          case ALGORITHMTYPE.Oscillator:
            result.push(
              ...OscillatorValues.validate(algorithm as OscillatorValues)
            );
            break;
          case ALGORITHMTYPE.Markovian:
            result.push(
              ...MarkovianValues.validate(algorithm as MarkovianValues)
            );
            break;
          case ALGORITHMTYPE.Wiener:
            result.push(...WienerValues.validate(algorithm as WienerValues));
            break;
          case ALGORITHMTYPE.Sequencer:
            result.push(
              ...SequenceValues.validate(algorithm as SequenceValues)
            );
            break;
        }
      }
    );

    [values.tremolo, values.vibrato].forEach((effect: Tremolo) => {
      result.push(...Tremolo.validate(effect));
    })
    return result;
  }
}
