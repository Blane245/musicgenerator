import { getAttributeValue, getElementElement } from "../utils/xmlfunctions";
import { ReverbNoise, Filter } from "./reverbsupport";

export default class RoomReverb {
  name: string;
  context: AudioContext | OfflineAudioContext | undefined;
  enabled: boolean;
  effect: ConvolverNode | undefined;
  attack: number;
  decay: number;
  multitap: DelayNode[];
  multitapGain: GainNode | undefined;
  preDelay: DelayNode | undefined;
  preDelayTime: number;
  output: GainNode | undefined;
  release: number;
  reverbTime: number;
  tailOsc: ReverbNoise | undefined;
  wet: GainNode | undefined;
  constructor(name: string) {
    this.name = name;
    this.enabled = false;
    this.attack = 0.1;
    this.decay = 0.1;
    this.reverbTime = 1.0;
    this.release = 1.0;
    this.effect = undefined;
    this.preDelay = undefined;
    this.preDelayTime = 0.03;
    this.output = undefined;
    this.multitap = [];
    this.multitapGain = undefined;
    this.tailOsc = undefined;
    this.wet = undefined;
  }

  setContext(context: AudioContext | OfflineAudioContext) {
    this.context = context;
    if (this.enabled) {
      this.effect = context.createConvolver();
      this.release = this.reverbTime / 3.0;
      this.output = context.createGain();
      this.wet = context.createGain();
      this.multitapGain = this.context.createGain();
      this.multitapGain.gain.value = 0.2;
      for (let i = 2; i > 0; i--) {
        this.multitap.push(this.context.createDelay(this.reverbTime));
      }
      console.log('roomreverb: context set');
    }
  }

  init(time: number, preDelayTime: number = 0.03) {
    if (this.context && this.enabled) {
      this.preDelayTime = preDelayTime;
      this.preDelay = this.context.createDelay(preDelayTime);
      this.preDelay.delayTime.setValueAtTime(preDelayTime, time);
      this.multitap.map((t: DelayNode, i) => {
        if (this.multitap[i + 1]) {
          t.connect(this.multitap[i + 1]);
        }
        t.delayTime.setValueAtTime(0.001 + i * (preDelayTime / 2), time);
      });
    }
    if (
      this.multitapGain &&
      this.output &&
      this.wet &&
      this.preDelay &&
      this.effect
    ) {
      this.multitap[this.multitap.length - 1].connect(this.multitapGain);
      this.multitapGain.connect(this.output);

      this.wet.connect(this.preDelay);
      this.wet.connect(this.multitap[0]);
      this.preDelay.connect(this.effect);
      this.effect.connect(this.output);
    }
    console.log('roomreverb: initialized');
    this.renderTail(time);
  }

  connect(destination: AudioNode) {
    if (this.output) {
      this.output.connect(destination);
      console.log('roomreverb: output connected to ', destination);
    } else {
      console.log('roomreverb: output connect no context');

    }
  }

  renderTail(time: number = -1) {
    if (this.enabled && this.context) {
      console.log('roomreverbtail: start');

      const renderTime: number = time == -1? this.context.currentTime: time;
      const tailContext = new OfflineAudioContext(
        2,
        this.context.sampleRate * this.reverbTime,
        this.context.sampleRate
      );
      tailContext.oncomplete = (buffer) => {
        (this.effect as ConvolverNode).buffer = buffer.renderedBuffer;
        console.log(
          'roomreverbtail: render complete at tail time', 
          tailContext.currentTime, 
          'context time', 
          this.context?.currentTime, 
          'buffer size', buffer.renderedBuffer.length
        );
      };
      this.tailOsc = new ReverbNoise("noise");
      this.tailOsc.setContext(tailContext);
      const tailLPFilter = new Filter(
        "lowpass",
        tailContext,
        "lowpass",
        5000,
        1
      );
      // tailLPFilter.setup();
      const tailHPFilter = new Filter(
        "highpass",
        tailContext,
        "highpass",
        500,
        1
      );
      // tailHPFilter.setup();

      this.tailOsc.init(renderTime);
      this.tailOsc.connect(tailHPFilter.input);
      tailHPFilter.connect(tailLPFilter.input);
      tailLPFilter.connect(tailContext.destination);
      if (this.tailOsc.ampEnvelope) {
        this.tailOsc.ampEnvelope.attack = this.attack;
        this.tailOsc.ampEnvelope.decay = this.decay;
        this.tailOsc.ampEnvelope.release = this.release;
        console.log('rendertail: start rendering', time);
        tailContext.startRendering();

        this.tailOsc.on({ frequency: 500, velocity: 1, time: renderTime });
        setTimeout(() => {
          if (this.tailOsc) this.tailOsc.off(renderTime);
        }, 1);
      }
    }
  }

  set decayTime(value: number) {
    let dc = value / 3;
    this.reverbTime = value;
    this.release = dc;
  }

  copy(): RoomReverb {
    const n: RoomReverb = new RoomReverb(this.name);
    n.context = this.context;
    n.enabled = this.enabled;
    n.effect = this.effect;
    n.attack = this.attack;
    n.decay = this.decay;
    n.multitap = [...this.multitap];
    n.multitapGain = this.multitapGain;
    n.preDelay = this.preDelay;
    n.output = this.output;
    n.release = this.release;
    n.preDelayTime = this.preDelayTime;
    n.reverbTime = this.reverbTime;
    n.tailOsc = this.tailOsc;
    n.wet = this.wet;
    return n;
  }

  setAttribute(name: string, value: string): void {
    switch (name) {
      case "roomreverb.name":
        this.name = value;
        break;
      case "roomreverb.enabled":
        this.enabled = value == 'true';
        break;
      case "roomreverb.attack":
        this.attack = parseFloat(value);
        if (this.tailOsc && this.tailOsc.ampEnvelope) this.tailOsc.ampEnvelope.attack = this.attack;
        break;
      case "roomreverb.decay":
        this.decay = parseFloat(value);
        if (this.tailOsc && this.tailOsc.ampEnvelope) this.tailOsc.ampEnvelope.decay = this.decay;
        break;
      case "roomreverb.predelay":
        this.preDelayTime = parseFloat(value) / 1000;
        break;
      case "roomreverb.release":
        this.release = parseFloat(value);
        if (this.tailOsc && this.tailOsc.ampEnvelope) this.tailOsc.ampEnvelope.release = this.release;
        break;
      case "roomreverb.reverbtime":
        this.reverbTime = parseFloat(value);
        break;
      default:
        break;
    }
  }

  appendXML(props:{doc: XMLDocument, elem: Element}): void {
    const {doc, elem} = props;
    const fElement: Element = doc.createElement("roomreverb");
    fElement.setAttribute("name", this.name);
    fElement.setAttribute("enabled", this.enabled ? "true" : "false");
    fElement.setAttribute("attack", this.attack.toString());
    fElement.setAttribute("decay", this.decay.toString());
    fElement.setAttribute("predelay", this.preDelayTime.toString());
    fElement.setAttribute("release", this.release.toString());
    fElement.setAttribute("reverbtime", this.reverbTime.toString());
    elem.appendChild(fElement);
  }

  getXML(elem: Element): void {
    try {
      const rElement: Element = getElementElement(elem, "roomreverb");
      this.name = getAttributeValue(rElement, "name", "string") as string;
      this.enabled = getAttributeValue(
        rElement,
        "enabled",
        "boolean"
      ) as boolean;
      this.attack = getAttributeValue(rElement, "attack", "float") as number;
      this.decay = getAttributeValue(rElement, "decay", "float") as number;
      this.preDelayTime = getAttributeValue(rElement, "predelay", "float") as number;
      this.release = getAttributeValue(rElement, "release", "float") as number;
      this.reverbTime = getAttributeValue(
        rElement,
        "reverbtime",
        "float"
      ) as number;
    } catch {}
  }

}
