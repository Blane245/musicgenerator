import { ALGORITHMTYPE, MODULATOR, ModulatorMap, OscillatorType } from "types";
import { getAttributeValueWithDefault } from "utils/xmlfunctions";
import { AlgorithmValues } from "./algorithmvalues";

// a algorithm that is an oscillator
export default class OscillatorValues extends AlgorithmValues {
  override values: OscillatorType;
  constructor(
    values: OscillatorType = {
      type: MODULATOR.SINE,
      center: 0,
      frequency: 0,
      amplitude: 0,
      phase: 0,
    }
  ) {
    super(ALGORITHMTYPE.Oscillator);
    this.values = { ...values };
  }

  override copy(): OscillatorValues {
    const n = new OscillatorValues(this.values);
    return n;
  }

  override isEqual(newAlgorithm: OscillatorValues): boolean {
    if (!(newAlgorithm instanceof OscillatorValues)) return false;
    return (
      newAlgorithm.values.amplitude == newAlgorithm.values.amplitude &&
      newAlgorithm.values.center == newAlgorithm.values.center &&
      newAlgorithm.values.frequency == newAlgorithm.values.frequency &&
      newAlgorithm.values.phase == newAlgorithm.values.phase
    );
  }

  override setAttribute(name: string, value: string): boolean {
    switch (name) {
      case "algorithmType":
        this.algorithmType = ALGORITHMTYPE[value];
        return true;
      case "type":
        this.values.type = MODULATOR[value];
        return true;
      case "center":
        this.values.center = parseFloat(value);
        return true;
      case "frequency":
        this.values.frequency = parseFloat(value);
        return true;
      case "amplitude":
        this.values.amplitude = parseFloat(value);
        return true;
      case "phase":
        this.values.phase = parseFloat(value);
        return true;
      default:
        return false;
    }
  }

  override getCurrentValue(time: number, _beat?: number): number {
    let value: number = this.values.center;
    const valueFunction = ModulatorMap.get(this.values.type);
    if (!valueFunction) return value;
    value = valueFunction(
      time,
      this.values.center,
      this.values.frequency,
      this.values.amplitude,
      this.values.phase
    );
    return value;
  }
  override async appendXML(_doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      elem.setAttribute("algorithmType", ALGORITHMTYPE.Oscillator);
      elem.setAttribute("type", this.values.type);
      elem.setAttribute("center", this.values.center.toString());
      elem.setAttribute("frequency", this.values.frequency.toString());
      elem.setAttribute("amplitude", this.values.amplitude.toString());
      elem.setAttribute("phase", this.values.phase.toString());
      return Promise.resolve(elem);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }

  static override async getXML(
    elem: Element,
    _version: string
  ): Promise<OscillatorValues> {
    try {
      const g: OscillatorValues = new OscillatorValues();
      g.values.type = getAttributeValueWithDefault(
        elem,
        "type",
        "string",
        MODULATOR.TRIANGLE
      ) as MODULATOR;
      g.values.center = getAttributeValueWithDefault(
        elem,
        "center",
        "float",
        0
      ) as number;
      g.values.frequency = getAttributeValueWithDefault(
        elem,
        "frequency",
        "float",
        0
      ) as number;
      g.values.amplitude = getAttributeValueWithDefault(
        elem,
        "amplitude",
        "float",
        0
      ) as number;
      g.values.phase = getAttributeValueWithDefault(
        elem,
        "phase",
        "float",
        0
      ) as number;

      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }
  static override validate(_algorithm: OscillatorValues): string[] {
    const result: string[] = [];
    return result;
  }
}
