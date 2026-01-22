import CMGFile from "classes/cmgfile";
import RandomNumber from "classes/randomnumber";
import Track from "classes/track";
import {
  GENERATORTYPE,
  INTENSITYOPTION,
  INTENSITYTRANSITIONOPTION,
  PANALGORITHM,
  PANOPTION,
  SoundFontGenerators,
  SoundFontGeneratorsType,
  StochasticValues,
  TIMBRETYPE,
  Voice,
} from "types";
import {
  getAttributeValueWithDefault,
  getElementElement,
} from "utils/xmlfunctions";
import Silent from "./silent";

export default class Stochastic extends Silent {
  values: StochasticValues = {
    ensemble: null,
    ensembleName: "",
    Tc: 0, // seconds
    Nt: 0, // cells
    lambda: 0,
    delta: 0,
    voices: [],
    intensityOption: INTENSITYOPTION.none,
    intensityTransitionOption: INTENSITYTRANSITIONOPTION.none,
    intensityParameters: { cycleTime: 0 },
    panOption: PANOPTION.none,
    panAlgorithm: PANALGORITHM.none,
    panParameters: { cycleTime: 0 },
    compositionSeed: "0s00ty50o3",
    compositionRN: new RandomNumber("0s00ty50o3"),
    dynamicsSeed: "0s00ty50o3",
    dynamicsRN: new RandomNumber("0s00ty50o3"),
    composition: [],
  };
  #deltaT: number = this.values.Nt != 0 ? this.values.Tc / this.values.Nt : 0;
  #Ne: number = 0;

  constructor(nextGenerator: number, parent: Track) {
    super(nextGenerator, parent);
    this.type = GENERATORTYPE.Stochastic;
  }

  override copy(parent: Track): Stochastic {
    const n: Stochastic = new Stochastic(0, parent);
    n.name = this.name;
    n.startTime = this.startTime;
    n.stopTime = this.stopTime;
    n.values = { ...this.values };
    n.#deltaT = this.#deltaT;
    n.#Ne = this.#Ne;
    return n;
  }

  override setAttribute(name: string, value: string): boolean {
    if (typeof value == "string") {
      if (super.setAttribute(name, value)) return true;
    }
    const stringValue: string = value;
    // handle muted and volume first since their names contains a number
    if (name.startsWith("muted")) {
      const muteParts = name.split("-");
      if (muteParts.length == 2) {
        const iVoice: number = parseInt(muteParts[1]);
        this.values.voices[iVoice].muted = stringValue == "true";
        return true;
      }
    }
    if (name.startsWith("volume")) {
      const volumeParts = name.split("-");
      if (volumeParts.length == 2) {
        const iVoice: number = parseInt(volumeParts[1]);
        this.values.voices[iVoice].volume = parseInt(stringValue);
        return true;
      }
    }

    if (name.startsWith("velocity")) {
      const velocityParts = name.split("-");
      if (velocityParts.length == 2) {
        const iVoice: number = parseInt(velocityParts[1]);
        this.values.voices[iVoice].velocity = parseInt(stringValue);
        return true;
      }
    }

    switch (name) {
      case "Tc":
        this.values.Tc = parseFloat(stringValue);
        if (this.values.Nt != 0) this.#deltaT = this.values.Tc / this.values.Nt;
        return true;
      case "ensembleName":
        this.values.ensembleName = stringValue;
        return true;
      case "Nt":
        this.values.Nt = parseFloat(stringValue);
        if (this.values.Nt != 0) this.#deltaT = this.values.Tc / this.values.Nt;
        return true;
      case "lambda":
        this.values.lambda = parseFloat(stringValue);
        return true;
      case "delta":
        this.values.delta = parseFloat(stringValue);
        return true;
      case "compositionSeed":
        this.values.compositionSeed = stringValue;
        this.values.compositionRN = new RandomNumber(stringValue);
        return true;
      case "dynamicsSeed":
        this.values.dynamicsSeed = stringValue;
        this.values.dynamicsRN = new RandomNumber(stringValue);
        return true;
      case "intensityOption":
        this.values.intensityOption = stringValue;
        return true;
      case "intensityTransitionOption":
        this.values.intensityTransitionOption = stringValue;
        return true;
      case "panParameters.cycleTime":
        this.values.panParameters.cycleTime = parseFloat(stringValue);
        return true;
      case "intensityParameters.cycleTime":
        this.values.intensityParameters.cycleTime = parseFloat(stringValue);
        return true;
      case "panOption":
        this.values.panOption = stringValue;
        return true;
      case "panAlgorithm":
        this.values.panAlgorithm = stringValue;
        return true;
      case "composition": {
        const valueStrings: string[] = stringValue.split(",");
        let count: number = 0;
        this.values.composition = [];
        for (let i = 0; i < this.values.Nt; i++) {
          this.values.composition.push(Array<number>(this.#Ne).fill(0));
          for (let j = 0; j < this.values.voices.length; j++) {
            this.values.composition[i][j] = parseInt(valueStrings[count]);
            count++;
          }
        }
        return true;
      }
      case "voices":
        this.#Ne = parseInt(stringValue);
        return true; // the Stochastic dialog has already set the value if the voices property
      case "ensembleList":
        return true; // the Stochastic dialog has already set the value of this propert and loaded the ensemble and voices
      default:
        return false;
    }
  }

  static override validate(
    g: Stochastic,
    fileContent?: CMGFile,
    oldName?: string
  ): string[] {
    const e: string[] = [];
    if (fileContent != undefined && oldName != undefined)
      e.concat(Silent.validate(g, fileContent, oldName));
    if (g.values.ensemble == null) e.push("Ensemble must be provided.");
    if (g.values.Tc <= 0) e.push("Composition length must be positive.");
    if (g.values.Nt <= 0) e.push("Time cell count must be positive.");
    if (g.values.lambda <= 0) e.push("Event density must be positive.");
    if (g.values.voices.length == 0) e.push("Ensemble has not been defined.");
    if (
      g.values.panOption != PANOPTION.none &&
      g.values.panAlgorithm != PANALGORITHM.none &&
      g.values.panParameters.cycleTime <= 0
    )
      e.push("Pan Cycle Time must be positive.");
    if (
      g.values.intensityOption != INTENSITYOPTION.none &&
      g.values.intensityTransitionOption != INTENSITYTRANSITIONOPTION.none &&
      g.values.intensityParameters.cycleTime <= 0
    )
      e.push("Intensity Cycle Time must be positive.");
    if (g.values.composition.length == 0)
      e.push("Composition has not yet been defined.");
    return e;
  }

  getNe(): number {
    return this.#Ne;
  }

  getDeltaT(): number {
    return this.#deltaT;
  }

  override async appendXML(doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      const returnElem: Element = elem;
      await super.appendXML(doc, returnElem);
      if (this.values.ensemble) {
        const ensembleElem: Element = doc.createElement("ensemble");
        returnElem.appendChild(ensembleElem);
        ensembleElem.setAttribute("name", this.values.ensemble.name);
        ensembleElem.setAttribute(
          "description",
          this.values.ensemble.description
        );
        const voicesElem: Element = doc.createElement("voices");
        ensembleElem.appendChild(voicesElem);
        this.values.voices.forEach((voice: Voice) => {
          const voiceElem: Element = doc.createElement("voice");
          voicesElem.appendChild(voiceElem);
          voiceElem.setAttribute("name", voice.name);
          voiceElem.setAttribute("presetName", voice.presetName);
          voiceElem.setAttribute("description", voice.description);
          voiceElem.setAttribute("duration", voice.duration.toString());
          voiceElem.setAttribute("registerHi", voice.registerHi.toString());
          voiceElem.setAttribute("registerLo", voice.registerLo.toString());
          voiceElem.setAttribute("soundFontFile", voice.soundFontFile);
          voiceElem.setAttribute("timbre", voice.timbre);
          voiceElem.setAttribute("muted", voice.muted ? "true" : "false");
          voiceElem.setAttribute("volume", voice.volume.toString());
          voiceElem.setAttribute("velocity", voice.velocity.toString());
        });
      }

      returnElem.setAttribute("Tc", this.values.Tc.toString());
      returnElem.setAttribute("Nt", this.values.Nt.toString());
      returnElem.setAttribute("lambda", this.values.lambda.toString());
      returnElem.setAttribute("delta", this.values.delta.toString());
      returnElem.setAttribute("compositionSeed", this.values.compositionSeed);
      returnElem.setAttribute("dynamicsSeed", this.values.dynamicsSeed);

      const intensityElem: Element = doc.createElement("intensity");
      returnElem.appendChild(intensityElem);
      intensityElem.setAttribute(
        "intensityOption",
        this.values.intensityOption
      );
      intensityElem.setAttribute(
        "intensityTransitionOption",
        this.values.intensityTransitionOption
      );
      intensityElem.setAttribute(
        "cycleTime",
        this.values.intensityParameters.cycleTime.toString()
      );

      const panElem: Element = doc.createElement("pan");
      returnElem.appendChild(panElem);
      panElem.setAttribute("panOption", this.values.panOption);
      panElem.setAttribute("panAlgorithm", this.values.panAlgorithm);
      panElem.setAttribute(
        "cycleTime",
        this.values.panParameters.cycleTime.toString()
      );

      // add the composition as a string in row/column order
      let compositionString: string = "";
      this.values.composition.forEach((row: number[]) => {
        row.forEach((value: number) => {
          compositionString += value.toString() + ",";
        });
      });
      returnElem.setAttribute("composition", compositionString);

      return Promise.resolve(returnElem);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  static override async getXML(
    elem: Element,
    version: string,
    parent: Track
  ): Promise<Stochastic> {
    try {
      const CMGgen: Silent = await Silent.getXML(elem, version, parent);
      const g: Stochastic = new Stochastic(0, parent);
      g.name = CMGgen.name;
      g.startTime = CMGgen.startTime;
      g.stopTime = CMGgen.stopTime;
      g.mute = CMGgen.mute;
      g.position = CMGgen.position;

      const ensembleElement: Element | null = getElementElement(
        elem,
        "ensemble"
      );
      if (!ensembleElement)
        throw new Error(`Stochastic getXML missing ensemble attribute`);
      g.values.ensemble = { name: "", description: "", voices: "" };
      g.values.ensemble.name = getAttributeValueWithDefault(
        ensembleElement,
        "name",
        "string",
        ""
      ) as string;
      g.values.ensembleName = g.values.ensemble.name;
      g.values.ensemble.description = getAttributeValueWithDefault(
        ensembleElement,
        "description",
        "string",
        ""
      ) as string;
      g.values.voices = [];
      const voicesElement: Element | null = getElementElement(
        ensembleElement,
        "voices"
      );
      if (!voicesElement) {
        g.values.voices = [];
      } else {
        const voiceList: string[] = [];
        const voicesChildren: HTMLCollection = voicesElement.children;
        for (const child of voicesChildren) {
          const name: string = getAttributeValueWithDefault(
            child,
            "name",
            "string",
            ""
          ) as string;
          voiceList.push(name);
          const description: string = getAttributeValueWithDefault(
            child,
            "description",
            "string",
            ""
          ) as string;
          const soundFontFile: string = getAttributeValueWithDefault(
            child,
            "soundFontFile",
            "string",
            ""
          ) as string;
          const presetName: string = getAttributeValueWithDefault(
            child,
            "presetName",
            "string",
            ""
          ) as string;
          const timbre: TIMBRETYPE = getAttributeValueWithDefault(
            child,
            "timbre",
            "string",
            ""
          ) as TIMBRETYPE;
          const registerLo: number = getAttributeValueWithDefault(
            child,
            "registerLo",
            "float",
            ""
          ) as number;
          const registerHi: number = getAttributeValueWithDefault(
            child,
            "registerHi",
            "float",
            ""
          ) as number;
          const duration: number = getAttributeValueWithDefault(
            child,
            "duration",
            "float",
            ""
          ) as number;
          const muted: boolean = getAttributeValueWithDefault(
            child,
            "muted",
            "boolean",
            ""
          ) as boolean;
          const volume: number = getAttributeValueWithDefault(
            child,
            "volume",
            "int",
            0
          ) as number;
          const velocity: number = getAttributeValueWithDefault(
            child,
            "velocity",
            "int",
            0
          ) as number;
          const voice: Voice = {
            name,
            description,
            soundFontFile,
            presetName,
            preset: undefined,
            timbre,
            registerLo,
            registerHi,
            duration,
            muted,
            volume,
            velocity,
          };
          g.values.voices.push(voice);

          // notify file handler that some soundfonts need to be loaded
          // and preset set for this voice
          const foundSoundFont: SoundFontGeneratorsType | undefined =
            SoundFontGenerators.get(soundFontFile);
          if (foundSoundFont == undefined) {
            SoundFontGenerators.set(soundFontFile, {
              type: GENERATORTYPE.Stochastic,
              users: [
                { generator: g, voiceNumber: g.values.voices.length - 1 },
              ],
            });
          } else {
            foundSoundFont.users.push({
              generator: g,
              voiceNumber: g.values.voices.length - 1,
            });
          }
        }
        g.values.ensemble.voices = voiceList.join(",");
        g.values.Tc = getAttributeValueWithDefault(
          elem,
          "Tc",
          "float",
          0
        ) as number;
        g.values.Nt = getAttributeValueWithDefault(
          elem,
          "Nt",
          "float",
          0
        ) as number;
        g.values.lambda = getAttributeValueWithDefault(
          elem,
          "lambda",
          "float",
          0
        ) as number;
        g.values.delta = getAttributeValueWithDefault(
          elem,
          "delta",
          "float",
          0
        ) as number;
        g.values.compositionSeed = getAttributeValueWithDefault(
          elem,
          "compositionSeed",
          "string",
          ""
        ) as string;
        g.values.dynamicsSeed = getAttributeValueWithDefault(
          elem,
          "dynamicsSeed",
          "string",
          ""
        ) as string;
        const intensityElem: Element | null = getElementElement(
          elem,
          "intensity"
        );
        if (!intensityElem) {
          g.values.intensityOption = INTENSITYOPTION.none;
          g.values.intensityTransitionOption = INTENSITYTRANSITIONOPTION.none;
          g.values.intensityParameters.cycleTime = 0;
        } else {
          g.values.intensityOption = getAttributeValueWithDefault(
            intensityElem,
            "intensityOption",
            "string",
            INTENSITYOPTION.none
          ) as string;
          g.values.intensityTransitionOption = getAttributeValueWithDefault(
            intensityElem,
            "intensityTransitionOption",
            "string",
            INTENSITYTRANSITIONOPTION.none
          ) as string;
          g.values.intensityParameters.cycleTime = getAttributeValueWithDefault(
            intensityElem,
            "cycleTime",
            "float",
            0
          ) as number;
        }
        const panElem: Element | null = getElementElement(elem, "pan");
        if (!panElem) {
          g.values.panOption = PANOPTION.none;
          g.values.panAlgorithm = PANALGORITHM.none;
          g.values.panParameters.cycleTime = 0;
        } else {
          g.values.panOption = getAttributeValueWithDefault(
            panElem,
            "panOption",
            "string",
            PANOPTION.none
          ) as string;
          g.values.panAlgorithm = getAttributeValueWithDefault(
            panElem,
            "panAlgorithm",
            "string",
            PANALGORITHM.none
          ) as string;
          g.values.panParameters.cycleTime = getAttributeValueWithDefault(
            panElem,
            "cycleTime",
            "float",
            0
          ) as number;
        }
        g.values.composition = [];
        const compositionString: string = getAttributeValueWithDefault(
          elem,
          "composition",
          "string",
          ""
        ) as string;
        if (compositionString != "") {
          const nVoices: number = g.values.voices.length;
          const Nt: number = g.values.Nt;
          const compositionList: string[] = compositionString.split(",");
          g.values.composition = [];
          if (compositionList.length < Nt * nVoices) {
            alert(
              `loaded composition is ill formed. Length is ${
                compositionList.length
              } and should be ${Nt * nVoices}. Composition reset.`
            );
          } else {
            let counter: number = 0;
            for (let i = 0; i < Nt; i++) {
              g.values.composition.push(Array<number>(nVoices).fill(0));
              for (let j = 0; j < nVoices; j++) {
                g.values.composition[i][j] = parseInt(compositionList[counter]);
                counter++;
              }
            }
          }
        }
        // set the private properties
        g.#Ne = g.values.voices.length;
        if (g.values.Nt != 0) g.#deltaT = g.values.Tc / g.values.Nt;
      }

      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
