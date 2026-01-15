// the parent class for this collection holds the properties that are required
// for some of the generators.

import { ALGORITHMTYPE } from "types";

// The user interface should take care to check that these have been specified
export class AlgorithmValues {
  algorithmType: ALGORITHMTYPE = ALGORITHMTYPE.None; // the type of algorithm
  values = {};

  constructor(algorithmType: ALGORITHMTYPE) {
    this.algorithmType = algorithmType;
  }

  copy(): AlgorithmValues {
    return new AlgorithmValues(ALGORITHMTYPE.None);
  }

  isEqual(newAlgorithm: AlgorithmValues): boolean {
    return newAlgorithm instanceof AlgorithmValues;
  }

  setAttribute(_name: string, _value: string): boolean {
    return false;
  }

  getCurrentValue(_time: number, _beat?: number): number {
    return 0;
  }
  async appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
    return Promise.resolve(elem);
  }

  static async getXML(
    _elem: Element,
    _version: string
  ): Promise<AlgorithmValues> {
    return Promise.resolve(new AlgorithmValues(ALGORITHMTYPE.None));
  }

  static validate(algorithm: AlgorithmValues): string[] {
    const errors: string[] = [];
    if (algorithm.algorithmType === ALGORITHMTYPE.None)
      errors.push("Generator algorithm must be specified");
    return errors;
  }
}

