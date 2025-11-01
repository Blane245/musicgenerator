import { MODULATOR } from "types";
import { getAttributeValueWithDefault } from "utils/xmlfunctions";

// the tremelo class defines a generator's tremelo effect
export default class Tremelo {
    values: {
        speed: number; // BPM
        depth: number; // dB
        waveForm: MODULATOR; // waveform 
    } = {speed: 0, depth: 0, waveForm: MODULATOR.SINE}
copy(): Tremelo {
    const n = new Tremelo();
    return n;
}

isEqual (newTremelo: Tremelo): boolean {
    return this.values.depth == newTremelo.values.depth &&
    this.values.speed == newTremelo.values.speed &&
    this.values.waveForm == newTremelo.values.waveForm
}
  setAttribute(name: string, value: string): boolean {
    if (name == "speed") {
      this.values.speed = parseFloat(value);
      return true;
    }
    if (name == "depth") {
      this.values.depth = parseFloat(value);
      return true;
    }
    if (name == "waveform") {
      this.values.waveForm = MODULATOR[value];
      return true;
    }

    return false;
  }

  // TODO teh business end of tremelo
getCurrentValue(_time: number, _beat?: number): number {
    return this.values.value;
  }


 async appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      elem.setAttribute("waveForm", this.values.waveForm);
      elem.setAttribute("speed", this.values.speed.toString());
      elem.setAttribute("depth", this.values.depth.toString());
      return Promise.resolve(elem);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }

  static async getXML(
    elem: Element,
    _version: string
  ): Promise<Tremelo> {
    try {
      const g: Tremelo = new Tremelo();
      g.values.speed = getAttributeValueWithDefault(elem, "speed", "float", 0) as number;
      g.values.depth = getAttributeValueWithDefault(elem, "depth", "float", 0) as number;
      g.values.waveForm  = getAttributeValueWithDefault(elem, "waveForm", "string", 0) as MODULATOR;

      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  // TODO validate the values, may not be necessary
  static validate(_algorithm: Tremelo): string[] {
    const result: string[] = [];
    return result;
  }



}