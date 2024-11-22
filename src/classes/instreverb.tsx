import { getAttributeValue, getElementElement } from "../utils/xmlfunctions";
import { ReverbNoise } from "./reverbsupport";

export default class InstReverb {
  name: string;
  context: AudioContext | OfflineAudioContext | undefined;
  enabled: boolean;
  effect: ConvolverNode | undefined;
  attack: number;
  decay: number;
  release: number;
  reverbTime: number;
  tailOsc: ReverbNoise | undefined;

  constructor(name: string) {
    this.name = name;
    this.context = undefined;
    this.enabled = false;
    this.attack = 0.001;
    this.decay = 0.1;
    this.release = 1.0;
    this.reverbTime = 1.0;
    this.effect = undefined;
    this.tailOsc = undefined;
  }

  setContext(context: AudioContext | OfflineAudioContext) {
    this.context = context;
    this.effect = context.createConvolver();
  }

  set decayTime(value: number) {
    const dc = value / 3;
    this.reverbTime = value;
    this.release = dc;
  }

  // the reverb tail will be realized at the time given
  renderTail(time: number) {
    if (this.enabled) {
      console.log("RoomInstReverb renderTail", time, this.context);
      if (this.context) {
        const tailContext = new OfflineAudioContext(
          2,
          this.context.sampleRate * this.reverbTime,
          this.context.sampleRate
        );
        tailContext.oncomplete = (buffer: OfflineAudioCompletionEvent) => {
          console.log('instrument tail buffer captured at', time);
          (this.effect as ConvolverNode).buffer = buffer.renderedBuffer;
        };

        this.tailOsc = new ReverbNoise(this.name.concat(":noise"));
        this.tailOsc.setContext(tailContext);
        this.tailOsc.init(time);
        if (
          this.tailOsc.ampEnvelope &&
          this.tailOsc.ampEnvelope.effect &&
          this.tailOsc.effect
        ) {
          console.log('instreverb: tailosc connectd to', tailContext.destination);
          this.tailOsc.connect(tailContext.destination);
          this.tailOsc.ampEnvelope.attack = this.attack;
          this.tailOsc.ampEnvelope.decay = this.decay;
          this.tailOsc.ampEnvelope.release = this.release;
          this.tailOsc.on({ frequency: 500, velocity: 1 });
          tailContext.startRendering();

          setTimeout(() => {
            if (this.tailOsc) this.tailOsc.off( time + 0.01);
          }, 10);
        }
      }
    }
  }

  copy(): InstReverb {
    const n: InstReverb = new InstReverb(this.name);
    n.enabled = this.enabled;
    n.context = this.context;
    n.attack = this.attack;
    n.decay = this.decay;
    n.effect = this.effect;
    n.release = this.release;
    n.reverbTime = this.reverbTime;
    n.tailOsc = this.tailOsc;
    return n;
  }

  setAttribute(name: string, value: string): void {
    // no need to handle context values. They are set when the reverb context is brought on line
    switch (name) {
      case "instreverb.name":
        this.name = value;
        break;
      case "instreverb.enabled":
        this.enabled = (value == 'on');
        break;
      case "instreverb.attack":
        this.attack = parseFloat(value);
        if (this.tailOsc && this.tailOsc.ampEnvelope) this.tailOsc.ampEnvelope.attack = this.attack;
        break;
      case "instreverb.decay":
        this.decay = parseFloat(value);
        if (this.tailOsc && this.tailOsc.ampEnvelope) this.tailOsc.ampEnvelope.decay = this.decay;
        break;
      case "instreverb.release":
        this.release = parseFloat(value);
        if (this.tailOsc && this.tailOsc.ampEnvelope) this.tailOsc.ampEnvelope.release = this.release;
        break;
      case "instreverb.reverbTime":
        this.reverbTime = parseFloat(value);
        break;
      default:
        break;
    }
  }

  appendXML(props:{doc: XMLDocument, elem: Element}): void {
    const {doc, elem} = props;
    const fElement: Element = doc.createElement("instreverb");
    fElement.setAttribute("name", this.name);
    fElement.setAttribute("enabled", this.enabled ? "true" : "false");
    fElement.setAttribute("attack", this.attack.toString());
    fElement.setAttribute("decay", this.decay.toString());
    fElement.setAttribute("release", this.release.toString());
    fElement.setAttribute("reverbTime", this.reverbTime.toString());
    elem.appendChild(fElement);
  }

  getXML(elem: Element): void {
    try {
      const rElement: Element = getElementElement(elem, "instreverb");
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
    } catch {}
  }
}
