import { CMGeneratorType } from "../types/types";
import { getAttributeValue } from "../utils/xmlfunctions";
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
  appendXML(props:{elem: Element}): void {
    props.elem.setAttribute("name", this.name);
    props.elem.setAttribute("mute", this.mute.toString());
    props.elem.setAttribute("solo", this.solo.toString());
  }

  getXML(elem: Element) {
    this.name = getAttributeValue(elem, "name", "string") as string;
    this.mute = getAttributeValue(elem, "mute", "string") == "true";
    this.solo = getAttributeValue(elem, "solo", "string") == "true";
  }
}
