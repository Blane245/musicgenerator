// build the sound file as quickly as possible using offline context
// and write it to the selected mp3 file
// thanx to https://github.com/devowlio/node-lame
import lamejs from "@breezystack/lamejs";
import { float32ToInt16 } from "./float32toint";
const BLOCKSIZE = 1152; // multiple of 576
export function bufferToMp3(
  waveform: Float32Array[],
  sampleRate: number
): Blob {
  const encoder = new lamejs.Mp3Encoder(2, sampleRate, 256);
  
  const mp3Data: Uint8Array[] = [];
  const length: number = waveform[0].length;
  
  for (let i = 0; i < length; i += BLOCKSIZE) {
    const blockLength: number = Math.min(BLOCKSIZE, length - i);
    if (blockLength > 0) {
      const left: Int16Array = new Int16Array(blockLength);
      const right: Int16Array = new Int16Array(blockLength);
      for (let j = 0; j < blockLength; j++) {
        left[j] = float32ToInt16(waveform[0][i + j]);
        right[j] = float32ToInt16(waveform[1][i + j]);
      }
      const buffer: Uint8Array = encoder.encodeBuffer(left, right);
      if (buffer.length > 0) mp3Data.push(buffer);
    }
  }
  
  const buffer: Uint8Array = encoder.flush();
  if (buffer.length) mp3Data.push(buffer);
  
  // @ts-expect-error arraybufferlike and arraybuffer are not the same thing
  const blob = new Blob(mp3Data, { type: "audio/mp3" });
  return blob;
}
