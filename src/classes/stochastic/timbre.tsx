// the parent class for all timbres

import { TIMBRE } from "types";

// repersents a single sound element in a cloud 
export default class Timbre {
  type: TIMBRE = TIMBRE.None;
  values: {} = {};
  constructor(type: TIMBRE) {
    this.type = type;
  }
  copy(): Timbre {
    return new Timbre(TIMBRE.None);
  }
  setAttribute(_name: string, _value: string): boolean {
    return false;
  }
  async appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
    return Promise.resolve(elem);
  }
  static async getXML(_elem: Element, _version: string): Promise<Timbre> {
    return Promise.resolve(new Timbre(TIMBRE.None));
  }

  static validate(timbre: Timbre): string[] {
    const errors: string[] = [];
    if (timbre.type === TIMBRE.None) errors.push("Timbre must be specified");
    return errors;
  }
}
