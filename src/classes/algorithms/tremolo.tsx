import { MODULATOR, ModulatorMap } from "types";
import { getAttributeValueWithDefault } from "utils/xmlfunctions";

// the tremolo class defines a generator's volume tremolo and pitch vibrator effects
export default class Tremolo {
    values: {
        speed: number; // mHz
        depth: number; // dB
        waveForm: MODULATOR; // waveform 
    } = {speed: 0, depth: 0, waveForm: MODULATOR.SINE}
copy(): Tremolo {
    const n = new Tremolo();
    n.values = {...this.values};
    return n;
}

isEqual (newTremelo: Tremolo): boolean {
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

  // Tremolo is an oscillator. Use Oscillator algorithm methof
getCurrentValue(time: number, _beat?: number): number {
    let value: number = 0;
    const valueFunction = ModulatorMap.get(this.values.waveForm);
    if (!valueFunction) return value;
    value = valueFunction(
      time,
      0,
      this.values.speed,
      this.values.depth,
      0
    );
    return value;
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
  ): Promise<Tremolo> {
    try {
      const g: Tremolo = new Tremolo();
      g.values.speed = getAttributeValueWithDefault(elem, "speed", "float", 0) as number;
      g.values.depth = getAttributeValueWithDefault(elem, "depth", "float", 0) as number;
      g.values.waveForm  = getAttributeValueWithDefault(elem, "waveForm", "string", 0) as MODULATOR;

      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  static validate(_algorithm: Tremolo): string[] {
    const result: string[] = [];
    return result;
  }



}