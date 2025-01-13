// build the sound file as quickly as possible using offline context and write it to the selected wave file

import { float32ToUint16 } from "./float32toint";

// thanx to https://russellgood.com/how-to-convert-audiobuffer-to-audio-file/
export function bufferToWav(
  waveForm: Float32Array[],
  sampleRate: number
): Blob {
  const channelCount: number = 2;
  const length = waveForm[0].length * channelCount * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view: DataView = new DataView(buffer);
  let pos: number = 0;
  const bitsPerSample = 16;

  // write the WAVE Header see https://docs.fileformat.com/audio/wav/
  view.setUint32(pos, 0x46464952, true);
  pos += 4; // 'RIFF'
  view.setUint32(pos, length - 8, true);
  pos += 4; // file length
  view.setUint32(pos, 0x45564157, true);
  pos += 4; // WAVE
  view.setUint32(pos, 0x20746d66, true);
  pos += 4; // ' fmt' chunk
  view.setUint32(pos, 16, true);
  pos += 4; // length = 16
  view.setUint16(pos, 1, true);
  pos += 2; // PCM (uncompressed)
  view.setUint16(pos, channelCount, true);
  pos += 2;
  view.setUint32(pos, sampleRate, true);
  pos += 4;
  view.setUint32(pos, (sampleRate * bitsPerSample * channelCount) / 8, true);
  pos += 4; // bytes/sec
  view.setUint16(pos, (bitsPerSample * channelCount) / 8, true);
  pos += 2; // 16-bit stereo
  view.setUint16(pos, bitsPerSample, true);
  pos += 2; // 16-bit samples
  view.setUint32(pos, 0x61746164, true);
  pos += 4; // "data" - chunk
  view.setUint32(pos, length - pos - 4, true);
  pos += 4; // chunk length

  // write the interleaved data
  let offset: number = 0;
  while (pos < length) {
    for (let i = 0; i < channelCount; i++) {
      view.setUint16(pos, float32ToUint16(waveForm[i][offset]), true); // write 16-bit sample
      pos += 2;
    }
    offset++;
  }
  return new Blob([buffer], { type: "audio/wave" });
}
