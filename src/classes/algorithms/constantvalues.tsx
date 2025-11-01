import { ALGORITHMTYPE, ConstantType } from "types";
import { getAttributeValueWithDefault } from "utils/xmlfunctions";
import { AlgorithmValues } from "./algorithmvalues";

export class ConstantValues extends AlgorithmValues {
  override values: ConstantType;
  constructor(initialValue?: number) {
    super(ALGORITHMTYPE.Constant);
    this.values = {
      value: initialValue ? initialValue : 0,
    };
  }
  override copy(): ConstantValues {
    const n = new ConstantValues(this.values.value);
    return n;
  }

  override isEqual(newAlgorithm: ConstantValues): boolean {
    if (!(newAlgorithm instanceof ConstantValues)) return false;
    return newAlgorithm.values.value == newAlgorithm.values.value;
  }

  override setAttribute(name: string, value: string): boolean {
    if (name == "value") {
      this.values.value = parseFloat(value);
      return true;
    }
    if (name == "algorithmType") {
      this.algorithmType = ALGORITHMTYPE[value];
      return true;
    }

    return false;
  }
  override getCurrentValue(_time: number, _beat?: number): number {
    return this.values.value;
  }
  override async appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      elem.setAttribute("algorithmType", ALGORITHMTYPE.Constant);
      elem.setAttribute("value", this.values.value.toString());
      return Promise.resolve(elem);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }

  static override async getXML(
    elem: Element,
    _version: string
  ): Promise<ConstantValues> {
    try {
      const g: ConstantValues = new ConstantValues();
      g.values.value = getAttributeValueWithDefault(elem, "value", "float", 0) as number;

      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }
  static override validate(_algorithm: ConstantValues): string[] {
    const result: string[] = [];
    return result;
  }
}

