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
    this.volume = 5;
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

  override async appendXML(props: { elem: Element }) {
    props.elem.setAttribute("fileName", this.fileName);
    props.elem.setAttribute("volume", this.volume.toString());
    props.elem.setAttribute("duration", this.duration.toString());
    props.elem.setAttribute("sampleRate", this.sampleRate.toString());
    const numberOfChannels: number = this.samples.length;
    props.elem.setAttribute("numberOfChannels", numberOfChannels.toString());

    // parallelize the compression of the samples
    const promises: Promise<string>[] = this.samples.map(
      (sample: Float32Array) => {
        const promise: Promise<string> = compressAndConvertToString(
          sample.buffer
        );
        return promise;
      }
    );
    const compressedSamples: string[] = await Promise.all(promises);

    // add the compressed samples to the document
    compressedSamples.map((cs: string, i: number) => {
      props.elem.setAttribute(`sample${i}`, cs);
      console.log('added compressed sample', i)
    });
  }

  override getXML(elem: Element) {
    this.fileName = getAttributeValue(elem, "fileName", "string") as string;
    this.volume = getAttributeValue(elem, "volume", "float") as number;
    this.duration = getAttributeValue(elem, "duration", "float") as number;
    this.sampleRate = getAttributeValue(elem, "sampleRate", "float") as number;
    this.volume = getAttributeValue(elem, "volume", "float") as number;
    const numberOfChannels = getAttributeValue(
      elem,
      "numberOfChannels",
      "int"
    ) as number;
    const samples: Float32Array[] = [];
    async function getAndDecompressSample(sampleString: string) {
      const sample: Float32Array = await convertFromJsonAndDecompress(
        sampleString
      );
      samples.push(sample);
    }
    for (let i = 0; i < numberOfChannels; i++) {
      const sampleString: string = getAttributeValue(
        elem,
        `sample${i}}`,
        "string"
      ) as string;
      getAndDecompressSample(sampleString);
    }
    this.samples = samples;
  }
}
