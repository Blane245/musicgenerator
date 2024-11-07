import { rand } from "../utils/seededrandom";
import { getAttributeValue, getElementElement } from "../utils/xmlfunctions";
export default class SimpleReverb {
  name: string;
  context: AudioContext | OfflineAudioContext | undefined;
  enabled: boolean;
  source: AudioBufferSourceNode | undefined;
  effect: ConvolverNode | undefined;
  reverbTime: number;

  constructor(name: string) {
    this.name = name;
    this.enabled = false;
    this.effect = undefined;
    this.reverbTime = 1.0;
  }

  setContext(context: AudioContext | OfflineAudioContext) {
    if (this.enabled) {
      this.context = context;
      this.effect = this.context.createConvolver();
    }
  }

  connect(externalInput: AudioNode, destination: AudioNode) {
    if (this.enabled) {
      if (this.effect) {
        externalInput.connect(this.effect);
        this.effect.connect(destination);
      } else
        console.log(
          "simple reverb: Attempt to connect reverb before context has been set"
        );
    }
  }

  disconnect() {
    if (this.effect) this.effect.disconnect();
  }

  renderReverb(source: AudioBufferSourceNode, time: number) {
    if (this.enabled) {
      if (this.context && this.effect && source.buffer) {
        console.log("Render Reverb");
        const bufferLength = Math.min(
          source.buffer.length,
          source.buffer.sampleRate * this.reverbTime
        );
        const tailContext = new OfflineAudioContext(
          2,
          bufferLength,
          this.context.sampleRate
        );

        // add some noise and delay the time for the echo bye reverbtime
        const inputBuffer = source.buffer;
        const outputNode = tailContext.createBufferSource();
        outputNode.buffer = tailContext.createBuffer(
          source.channelCount,
          bufferLength,
          inputBuffer.sampleRate
        );
        for (
          let channel = 0;
          channel < inputBuffer.numberOfChannels;
          channel++
        ) {
          const inputData = inputBuffer.getChannelData(channel);
          const outputData = outputNode.buffer.getChannelData(channel);
          for (let sample = 0; sample < bufferLength; sample++) {
            outputData[sample] =
              inputData[sample] + (rand() * 2 - 1) /* * 0.1*/;
          }
          console.log(
            "channel",
            channel,
            "input sample min/max",
            Math.min(...inputData),
            Math.max(...inputData),
            "otuput sample min/max",
            Math.min(...outputData),
            Math.max(...outputData)
          );
        }

        console.log(
          "output length",
          outputNode.buffer.length,
          "start time",
          time,
          "reverb time",
          this.reverbTime,
          "current time",
          this.context.currentTime
        );

        //TODO could simplet start the output node a bit later
        // const delay = tailContext.createDelay(this.reverbTime);
        // outputNode.connect(delay);
        // delay.connect(tailContext.destination);
        outputNode.connect(tailContext.destination);
        outputNode.start(time);
        outputNode.stop(time + this.reverbTime);

        tailContext.startRendering().then((renderedBuffer) => {
          console.log("reverb effect done at time ", this.context?.currentTime);
          if (this.effect) this.effect.buffer = renderedBuffer;
          else console.log("startRendering reverb: context not set");
        });
      } else
        console.log(
          "RenderReverb: attempt to render before context has been set."
        );
    }
  }

  copy(): SimpleReverb {
    const n: SimpleReverb = new SimpleReverb(this.name);
    n.enabled = this.enabled;
    n.context = this.context;
    n.source = this.source;
    n.effect = this.effect;
    n.reverbTime = this.reverbTime;
    return n;
  }

  setAttribute(name: string, value: string): void {
    // no need to handle context values. They are set when the reverb context is brought on line
    switch (name) {
      case "name":
        this.name = value;
        break;
      case "reverb.enabled":
        this.enabled = !this.enabled;
        break;
      case "reverb.reverbTime":
        this.reverbTime = parseFloat(value);
        break;
      default:
        break;
    }
  }

  appendXML(doc: XMLDocument, elem: Element): void {
    const fElement: Element = doc.createElement("simplereverb");
    fElement.setAttribute("name", this.name);
    fElement.setAttribute("enabled", this.enabled ? "true" : "false");
    fElement.setAttribute("reverbTime", this.reverbTime.toString());
    elem.appendChild(fElement);
  }

  getXML(elem: Element): void {
    try {
      const rElement: Element = getElementElement(elem, "simplereverb");
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
    } catch {
      console.log(`error occurred while reading filter element from XML`);
    }
  }
}
