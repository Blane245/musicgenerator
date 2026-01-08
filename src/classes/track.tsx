import { GENERATORTYPE, GeneratorType } from "types";
import {
  getAttributeValue,
  getAttributeValueWithDefault,
  getElementElement,
} from "utils/xmlfunctions";
import Silent from "./generators/silent";
import AudioFile from "./generators/audiofile";
import Algorithmic from "./generators/algorithmic";
import { TrackEffect } from "./control";
import Stochastic from "./generators/stochastic";
export default class Track {
  name: string;
  mute: boolean;
  solo: boolean;
  volume: number;
  generators: GeneratorType[];
  volumeEffect: TrackEffect | null;
  constructor(nextTrack: number) {
    this.name = "T".concat(nextTrack.toString());
    this.mute = false;
    this.solo = false;
    this.volume = 0;
    this.generators = [];
    this.volumeEffect = null;
  }

  copy(): Track {
    const t = new Track(0);
    t.name = this.name;
    t.mute = this.mute;
    t.solo = this.solo;
    t.volume = this.volume;
    t.generators = [];
    this.generators.forEach((g) => {
      const ng = g.copy(t);
      t.generators.push(ng);
    });
    t.volumeEffect = this.volumeEffect;
    return t;
  }

  initializeVolumeRamp(time: number, effect: TrackEffect) {
    console.log(
      "track volume control name, time, effect",
      this.name,
      time,
      effect
    );
    this.volumeEffect = effect;
    effect.initializeVolumeRamp(time);
  }

  getVolume(time: number): number {
    if (this.volumeEffect) return this.volumeEffect.getCurrentValues(time).volume;
    else return this.volume;
  }
  async appendXML(doc: XMLDocument, elem: Element): Promise<Element> {
    // request a promose from each of the generators in the track
    const generatorPromises: Promise<Element>[] = [];
    const generatorElements: Element[] = [];
    // for each generator, create a child element and build upon it
    this.generators.forEach((generator: GeneratorType) => {
      const generatorElement = doc.createElement("generator");
      generatorElements.push(generatorElement);
      const generatorPromise: Promise<Element> = generator.appendXML(
        doc,
        generatorElement
      );
      generatorPromises.push(generatorPromise);
    });

    // wait for all of the generator promises to resolve, if there are any
    try {
      // build the track XML and add generator children
      const generatorsElem: Element = doc.createElement("generators");
      const trackElem: Element = elem;
      trackElem.setAttribute("name", this.name);
      trackElem.setAttribute("mute", this.mute.toString());
      trackElem.setAttribute("solo", this.solo.toString());
      trackElem.setAttribute("volume", this.volume.toString());
      if (generatorPromises.length > 0) {
        const generatorXML: Element[] = await Promise.all(generatorPromises);
        generatorXML.forEach((gElem: Element) => {
          generatorsElem.appendChild(gElem);
        });
      }
      trackElem.appendChild(generatorsElem);
      return Promise.resolve(trackElem);
    } catch (e: any) {
      console.log("XML file writing error on track", this.name);
      return Promise.reject(e);
    }
  }

  async getXML(elem: Element, version: string): Promise<Track> {
    try {
      // load the base attributes of the track
      this.name = getAttributeValue(elem, "name", "string") as string;
      this.mute = getAttributeValue(elem, "mute", "string") == "true";
      this.solo = getAttributeValue(elem, "solo", "string") == "true";
      this.volume = getAttributeValueWithDefault(
        elem,
        "volume",
        "float",
        0
      ) as number;

      // load the generators for this track
      const generatorsElem: Element | null = getElementElement(
        elem,
        "generators"
      );
      if (!generatorsElem)
        throw new Error(`Track getXML missing generators element`);
      const generatorChildren: HTMLCollection = generatorsElem.children;
      const generatorPromises: Promise<GeneratorType>[] = [];
      for (let child of generatorChildren) {
        // read ahead the type to identify the XML loader
        const type = child.getAttribute("type") as GENERATORTYPE;
        switch (type) {
          case GENERATORTYPE.Silent:
            {
              const generatorPromise: Promise<Silent> = Silent.getXML(
                child,
                version,
                this
              );
              generatorPromises.push(generatorPromise);
            }
            break;
          case GENERATORTYPE.AudioFile:
            {
              const generatorPromise: Promise<AudioFile> = AudioFile.getXML(
                child,
                version,
                this
              );
              generatorPromises.push(generatorPromise);
            }
            break;
          case GENERATORTYPE.Algorithmic:
            {
              const generatorPromise: Promise<Algorithmic> = Algorithmic.getXML(
                child,
                version,
                this
              );
              generatorPromises.push(generatorPromise);
            }
            break;
          case GENERATORTYPE.Stochastic:
            {
              const generatorPromise: Promise<Stochastic> = Stochastic.getXML(
                child,
                version,
                this
              );
              generatorPromises.push(generatorPromise);
            }
            break;
        }
      }

      // attach the generators to the track
      if (generatorPromises.length > 0) {
        const generators: GeneratorType[] = await Promise.all(
          generatorPromises
        );
        this.generators = generators;
      }

      return Promise.resolve(this);
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
