import { GENERATORTYPE } from "types";
import { Silent } from "./silent";
import { compressAndConvertToString, convertFromJsonAndDecompress } from "utils/gzip";
import { getAttributeValueWithDefault } from "utils/xmlfunctions";
import CMGFile from "classes/cmgfile";

// this class represents an audio file that can be used as a generator source
export class AudioFile extends Silent {
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
    n.samples = this.samples;
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
      // @ts-ignore
      source.buffer.copyToChannel(this.samples[i], i);
    }
  }

  override setAttribute(name: string, value: string): boolean {
    super.setAttribute(name, value);
    switch (name) {
      case "volume":
        this.volume = parseFloat(value);
        return true;
      default:
        return false;
    }
  }

  override async appendXML(doc: XMLDocument, elem: Element): Promise<Element> {
    try {
      // start any compression of audio samples necessary
      // should be one for each channel
      const audioPromises: Promise<string>[] = [];
      this.samples.forEach((sample: Float32Array) => {
        const samplePromise: Promise<string> = compressAndConvertToString(
          // @ts-ignore
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

  static override async getXML(
    elem: Element,
    version: string
  ): Promise<AudioFile> {
    try {
      const CMGgen: Silent = await Silent.getXML(elem, version);
      const g: AudioFile = new AudioFile(0);

      g.fileName = getAttributeValueWithDefault(elem, "fileName", "string","") as string;
      g.volume = getAttributeValueWithDefault(elem, "volume", "float",0) as number;
      g.duration = getAttributeValueWithDefault(elem, "duration", "float",0) as number;
      g.sampleRate = getAttributeValueWithDefault(elem, "sampleRate", "float",0) as number;
      const numberOfChannels = getAttributeValueWithDefault(
        elem,
        "numberOfChannels",
        "int",0
      ) as number;

      // decompress the samples
      const samplePromises: Promise<Float32Array>[] = [];
      for (let i = 0; i < numberOfChannels; i++) {
        const sampleString: string = getAttributeValueWithDefault(
          elem,
          `sample${i}`,
          "string",""
        ) as string;
        const samplePromise: Promise<Float32Array> =
          convertFromJsonAndDecompress(sampleString);
        samplePromises.push(samplePromise);
      }

      // get the Silent values
      g.name = CMGgen.name;
      g.startTime = CMGgen.startTime;
      g.stopTime = CMGgen.stopTime;
      g.mute = CMGgen.mute;
      g.position = CMGgen.position;

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

  static override validate(
    values: AudioFile,
    _fileContents: CMGFile,
    _oldName: string
  ): string[] {
    const errors: string[] = [];
    if (values.fileName == "") errors.push("Audio file must be specified");
    return errors;
  }
}
