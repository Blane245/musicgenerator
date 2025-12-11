import { TIMBRE } from "types";
import Timbre from "./timbre";

export default class Percussion extends Timbre {
  override values: {
    duration: number;
    frequency: number;
  } = {
    duration: 0,
    frequency: 0,
  };
  constructor() {
    super(TIMBRE.Percussion);
  }
  override copy(): Percussion {
    const n: Percussion = new Percussion();
    n.values = { ...this.values };
    return n;
  }
  override setAttribute(name: string, value: string): boolean {
    return false;
  }
  override async appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
    return Promise.resolve(elem);
  }
  static override async getXML(
    _elem: Element,
    _version: string
  ): Promise<Timbre> {
    return Promise.resolve(new Timbre(TIMBRE.None));
  }

  static override validate(timbre: Timbre): string[] {
    const errors: string[] = [];
    if (timbre.type === TIMBRE.None) errors.push("Timbre must be specified");
    return errors;
  }
}
