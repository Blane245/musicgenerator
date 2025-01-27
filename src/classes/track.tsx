import { SoundFont2 } from "soundfont2";
import { CMGeneratorType } from "../types";
import { getAttributeValue, getElementElement } from "../utils/xmlfunctions";
import AudioFile from "./audiofile";
import CMG from "./cmg";
import Euclidean from "./euclidean";
import Noise from "./noise";
import SFPG from "./sfpg";
import SFRG from "./sfrg";
import Wiener from "./wiener";
export default class Track {
  name: string;
  mute: boolean;
  solo: boolean;
  generators: CMGeneratorType[];
  constructor(nextTrack: number) {
    this.name = "T".concat(nextTrack.toString());
    this.mute = false;
    this.solo = false;
    this.generators = [];
  }

  copy(): Track {
    const t = new Track(0);
    t.name = this.name;
    t.mute = this.mute;
    t.solo = this.solo;
    t.generators = [];
    this.generators.forEach((g) => {
      const ng = g.copy();
      t.generators.push(ng);
    });
    return t;
  }
  async appendXML(doc: XMLDocument, elem: Element): Promise<Element> {
    // request a promose from each of the generators in the track
    const generatorPromises: Promise<Element>[] = [];
    const generatorElements: Element[] = [];
    // for each generator, create a child element and build upon it
    this.generators.forEach((generator: CMGeneratorType) => {
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

  async getXML(elem: Element, soundFont: SoundFont2 | null, version: string): Promise<Track> {
    try {
      // load the base attributes of the track
      this.name = getAttributeValue(elem, "name", "string") as string;
      this.mute = getAttributeValue(elem, "mute", "string") == "true";
      this.solo = getAttributeValue(elem, "solo", "string") == "true";

      // load the generators for this track
      const generatorsElem: Element = getElementElement(elem, "generators");
      const generatorChildren: HTMLCollection = generatorsElem.children;
      const generatorPromises: Promise<CMGeneratorType>[] = [];
      for (let child of generatorChildren) {
        // read ahead the type to identify the XML loader
        const type = child.getAttribute("type");
        switch (type) {
          case "CMG":
            {
              const generatorPromise: Promise<CMG> = CMG.getXML(child, version);
              generatorPromises.push(generatorPromise);
            }
            break;
          case "AudioFile":
            {
              const generatorPromise: Promise<AudioFile> =
                AudioFile.getXML(child,version);
              generatorPromises.push(generatorPromise);
            }
            break;
          case "Noise":
            {
              const generatorPromise: Promise<Noise> = Noise.getXML(child, version);
              generatorPromises.push(generatorPromise);
            }
            break;
          case "SFPG":
            {
              const generatorPromise: Promise<SFPG> = SFPG.getXML(
                child,
                soundFont,
                version
              );
              generatorPromises.push(generatorPromise);
            }
            break;
          case "SFRG":
            {
              const generatorPromise: Promise<SFRG> = SFRG.getXML(
                child,
                soundFont,
                version
              );
              generatorPromises.push(generatorPromise);
            }
            break;
          case "Wiener":
            {
              const generatorPromise: Promise<Wiener> = Wiener.getXML(
                child,
                soundFont, version
              );
              generatorPromises.push(generatorPromise);
            }
            break;
          case "Euclidean":
            {
              const generatorPromise: Promise<Euclidean> = Euclidean.getXML(
                child,
                soundFont, version
              );
              generatorPromises.push(generatorPromise);
            }
            break;
        }
      }

      // attach the generators to the track
      if (generatorPromises.length > 0) {
        const generators: CMGeneratorType[] = await Promise.all(
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
