import { getAttributeValue, getElementElement } from "../utils/xmlfunctions";
import { ReverbNoise } from "./reverbsupport2";

export default class InstReverb {
  name: string;
  context: AudioContext | OfflineAudioContext | undefined;
  enabled: boolean;
  effect: ConvolverNode | undefined;
  reverbTime: number;
  tailOsc: ReverbNoise | undefined;
  renderTime: number;

  constructor(name: string) {
    this.name = name;
    this.context = undefined;
    this.enabled = false;
    this.reverbTime = 1.0;
    this.effect = undefined;
    this.tailOsc = undefined;
    this.renderTime = -1;
  }

  setContext(context: AudioContext | OfflineAudioContext) {
    this.context = context;
    this.effect = context.createConvolver();
    console.log("instreverb: context set");
  }

  // the reverb tail will be realized at the time given
  renderTail(time: number = -1) {
    if (this.enabled && this.context) {
      this.renderTime = time == -1 ? this.context.currentTime : time;
      console.log("RoomInstReverb renderTail", this.renderTime, this.context);
      const tailContext = new OfflineAudioContext(
        2,
        this.context.sampleRate * this.reverbTime,
        this.context.sampleRate
      );
      tailContext.oncomplete = (buffer: OfflineAudioCompletionEvent) => {
        console.log(
          "instrument tail buffer captured at",
          this.context ? this.context.currentTime : "unknown context time"
        );
        (this.effect as ConvolverNode).buffer = buffer.renderedBuffer;
      };

      this.tailOsc = new ReverbNoise(this.name.concat(":noise"));
      this.tailOsc.setContext(tailContext);
      this.tailOsc.init(this.renderTime);
      this.tailOsc.connect(tailContext.destination);
      tailContext.startRendering();

      setTimeout(() => {
        if (this.tailOsc) this.tailOsc.off(this.renderTime);
      }, 1);
    }
  }

  copy(): InstReverb {
    const n: InstReverb = new InstReverb(this.name);
    n.enabled = this.enabled;
    n.context = this.context;
    n.effect = this.effect;
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
        this.enabled = value == "true";
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
      this.reverbTime = getAttributeValue(
        rElement,
        "reverbTime",
        "float"
      ) as number;
    } catch {}
  }
}
