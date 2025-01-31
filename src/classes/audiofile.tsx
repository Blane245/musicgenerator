import { precision } from "../sfcomponents/util";
import { GENERATORTYPE } from "../types";
import {
  compressAndConvertToString,
  convertFromJsonAndDecompress,
} from "../utils/gzip";
import { getAttributeValue } from "../utils/xmlfunctions";
import CMG from "./cmg";

// this class represents an audio file that can be used as a generator source
export default class AudioFile extends CMG {
  fileName: string;
  samples: Float32Array[];
  sampleRate: number;
  duration: number;
  volume: number;

  constructor(nextGenerator: number) {
    super(nextGenerator);
    this.type = GENERATORTYPE.AudioFile;
    this.fileName = "";
    this.samples = [];
    this.sampleRate = 0;
    this.duration = 0;
    this.volume = 0;
  }

  override copy(): AudioFile {
    const n = new AudioFile(0);
    n.name = this.name;
    n.startTime = this.startTime;
    n.stopTime = this.stopTime;
    n.mute = this.mute;
    n.position = this.position;

    n.fileName = this.fileName;
    n.samples = [...this.samples];
    n.sampleRate = this.sampleRate;
    n.duration = this.duration;
    n.volume = this.volume;
    return n;
  }

  getSample(
    context: AudioContext | OfflineAudioContext,
    source: AudioBufferSourceNode
  ): void {
    const numberOfChannels = this.samples.length;
    source.buffer = context.createBuffer(
      numberOfChannels,
      this.duration * this.sampleRate,
      this.sampleRate
    );
    for (let i = 0; i < numberOfChannels; i++) {
      source.buffer.copyToChannel(this.samples[i], i);
    }
  }

  override setAttribute(name: string, value: string): void {
    super.setAttribute(name, value);
    switch (name) {
      case "fileName":
        // load the data from the file
        // the filename will not update if there is an error
        window
          .showOpenFilePicker({
            multiple: false,
          })
          .then((rh: FileSystemFileHandle[]) => {
            rh[0].getFile().then((file: File) => {
              file.arrayBuffer().then((buffer: ArrayBuffer) => {
                const context: AudioContext = new AudioContext();
                context.decodeAudioData(buffer).then((audio: AudioBuffer) => {
                  this.fileName = file.name;
                  this.sampleRate = audio.sampleRate;
                  this.duration = precision(audio.duration, 1);
                  this.stopTime = this.startTime + this.duration;
                  this.samples = [];
                  for (let i = 0; i < audio.numberOfChannels; i++) {
                    const channelData: Float32Array = audio.getChannelData(i);
                    this.samples.push(channelData);
                  }
                });
              });
            });
          });
        break;
      case "volume":
        this.volume = parseFloat(value);
        break;
      default:
        break;
    }
  }

  override async appendXML(doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      // start any compression of audio samples necessary
      // should be one for each channel
      const audioPromises: Promise<string>[] = [];
      this.samples.forEach((sample: Float32Array) => {
        const samplePromise: Promise<string> = compressAndConvertToString(
          sample.buffer
        );
        audioPromises.push(samplePromise);
      });

      // write the general attributes and wait for the sample promises to resolve, if there are any
      const returnElem: Element = await super.appendXML(doc, elem);
      returnElem.setAttribute("fileName", this.fileName);
      returnElem.setAttribute("volume", this.volume.toString());
      returnElem.setAttribute("duration", this.duration.toString());
      returnElem.setAttribute("sampleRate", this.sampleRate.toString());
      returnElem.setAttribute(
        "numberOfChannels",
        this.samples.length.toString()
      );

      if (audioPromises.length > 0) {
        const sampleStrings: string[] = await Promise.all(audioPromises);
        sampleStrings.forEach((s: string, i: number) => {
          returnElem.setAttribute(`sample${i}`, s);
        });
      }
      return Promise.resolve(returnElem);
    } catch (e: any) {
      return Promise.reject(e);
    }
  }

  static override async getXML(elem: Element, _version:string): Promise<AudioFile> {
    try {
      const g: AudioFile = new AudioFile(0);
      g.name = getAttributeValue(elem, "name", "string") as string;
      g.startTime = getAttributeValue(elem, "startTime", "float") as number;
      g.stopTime = getAttributeValue(elem, "stopTime", "float") as number;
      g.type = getAttributeValue(elem, "type", "string") as GENERATORTYPE;
      g.mute = getAttributeValue(elem, "mute", "string") == "true";
      g.position = getAttributeValue(elem, "position", "int") as number;

      g.fileName = getAttributeValue(elem, "fileName", "string") as string;
      g.volume = getAttributeValue(elem, "volume", "float") as number;
      g.duration = getAttributeValue(elem, "duration", "float") as number;
      g.sampleRate = getAttributeValue(elem, "sampleRate", "float") as number;
      g.volume = getAttributeValue(elem, "volume", "float") as number;
      const numberOfChannels = getAttributeValue(
        elem,
        "numberOfChannels",
        "int"
      ) as number;

      // decompress the samples
      const samplePromises: Promise<Float32Array>[] = [];
      for (let i = 0; i < numberOfChannels; i++) {
        const sampleString: string = getAttributeValue(
          elem,
          `sample${i}`,
          "string"
        ) as string;
        const samplePromise: Promise<Float32Array> =
          convertFromJsonAndDecompress(sampleString);
        samplePromises.push(samplePromise);
      }

      // load the decompressed samples
      if (samplePromises.length > 0) {
        const samples: Float32Array[] = await Promise.all(samplePromises);
        g.samples = samples;
      }

      return Promise.resolve(g);
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
