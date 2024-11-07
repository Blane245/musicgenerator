import { getAttributeValue, getElementElement } from "../utils/xmlfunctions";
import { Noise, Effect, Filter } from "./simplesound";
export default class SimpleReverb extends Effect {
  enabled: boolean;
  wet: GainNode | undefined;
  effect: ConvolverNode | undefined;
  reverbTime: number;
  attack: number;
  decay: number;
  release: number;

  constructor(name: string) {
    super(name);
    this.enabled = false;
    this.attack = 0.001;
    this.decay = 0.1;
    this.effect = undefined;
    this.reverbTime = 1.0;
    this.release = 1.0;
    this.wet = undefined;
  }

  override setContext(context: AudioContext | OfflineAudioContext) {
    if (this.enabled) {
      super.setContext(context);
      this.context = context;
      this.effect = this.context.createConvolver();
      this.wet = this.context.createGain();
    }
  }

  decayTime(value: number): void {
    if (this.enabled) {
      const dc = value / 3;
      this.reverbTime = value;
      this.release = dc;
    }
  }

  override connect(externalInput: AudioNode, destination: AudioNode) {
    if (this.enabled) {
      if (this.input && this.output && this.wet && this.effect) {
        externalInput.connect(this.input);
        this.input.connect(this.wet);
        this.wet.connect(this.effect);
        this.effect.connect(this.output);
        this.output.connect(destination);
      } else
        throw new Error(
          "simple revber: Attempt to connect reverb before context has been set"
        );
    }
  }

  renderTail(wet: AudioBufferSourceNode, time: number) {
    if (this.enabled && this.context && this.effect) {
      console.log("SimpleReverb renderTail");
      const tailContext = new OfflineAudioContext(
        2,
        this.context.sampleRate * this.reverbTime,
        this.context.sampleRate
      );
      tailContext.oncomplete = (buffer) => {
        if (this.effect) this.effect.buffer = buffer.renderedBuffer;
      };

      const tailOsc = new Noise("reverb noise");
      tailOsc.setContext(tailContext);
      // tailOsc.length = this.reverbTime;
      const tailLPFilter = new Filter("reverblp filter", "lowpass", 5000, 1);
      tailLPFilter.setContext(tailContext);
      const tailHPFilter = new Filter("reverbhp filter", "highpass", 5000, 1);
      tailHPFilter.setContext(tailContext);
      tailOsc.init();
      tailOsc.connect(wet, tailContext.destination);
      tailOsc.attack = this.attack;
      tailOsc.decay = this.decay;
      tailOsc.release = this.release;
      tailOsc.on({ frequency: 500, velocity: 1, time });
      setTimeout(() => {
        tailOsc.off();
      }, 1);
    }
  }

  override copy(): SimpleReverb {
    const nr: SimpleReverb = new SimpleReverb(this.name);
    nr.enabled = this.enabled;
    nr.context = this.context;
    nr.attack = this.attack;
    nr.decay = this.decay;
    nr.effect = this.effect;
    nr.input = this.input;
    nr.output = this.output;
    nr.release = this.release;
    nr.reverbTime = this.reverbTime;
    return nr;
  }

  override setAttribute(name: string, value: string): void {
    // no need to handle context values. They are set when the reverb context is brought on line
    switch (name) {
      case "reverb.enabled":
        this.enabled = !this.enabled;
        break;
      case "reverb.attack":
        this.attack = parseFloat(value);
        break;
      case "reverb.decay":
        this.decay = parseFloat(value);
        break;
      case "reverb.release":
        this.release = parseFloat(value);
        break;
      case "reverb.reverbTime":
        this.reverbTime = parseFloat(value);
        break;
      default:
        break;
    }
  }

  override appendXML(doc: XMLDocument, elem: Element): void {
    const fElement: Element = doc.createElement("simplereverb");
    fElement.setAttribute("name", this.name);
    fElement.setAttribute("enabled", this.enabled ? "true" : "false");
    fElement.setAttribute("attack", this.attack.toString());
    fElement.setAttribute("decay", this.decay.toString());
    fElement.setAttribute("release", this.release.toString());
    fElement.setAttribute("reverbTime", this.reverbTime.toString());
    elem.appendChild(fElement);
  }

  override getXML(elem: Element): void {
    try {
      const rElement: Element = getElementElement(elem, "simplereverb");
      this.name = getAttributeValue(rElement, "name", "string") as string;
      this.enabled = getAttributeValue(
        rElement,
        "enabled",
        "boolean"
      ) as boolean;
      this.attack = getAttributeValue(rElement, "attack", "float") as number;
      this.decay = getAttributeValue(rElement, "decay", "float") as number;
      this.release = getAttributeValue(rElement, "release", "float") as number;
      this.reverbTime = getAttributeValue(
        rElement,
        "reverbTime",
        "float"
      ) as number;
    } catch {
      console.log(`error occurred while reading filter element from XML`);
    }
  }
}
