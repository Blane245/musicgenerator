
  // build the sound file as quickly as possible using offline context and write it to the selected wave file
  // thanx to https://russellgood.com/how-to-convert-audiobuffer-to-audio-file/
  export function bufferToWave(result: Float32Array[], sampleRate: number): Blob {
    const numOfChan = result.length;
    const length = result[0].length * numOfChan * 2 + 44;
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
    view.setUint16(pos, numOfChan, true);
    pos += 2;
    view.setUint32(pos, sampleRate, true);
    pos += 4;
    view.setUint32(pos, (sampleRate * bitsPerSample * numOfChan) / 8, true);
    pos += 4; // bytes/sec
    view.setUint16(pos, (bitsPerSample * numOfChan) / 8, true);
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
      for (let i = 0; i < numOfChan; i++) {
        let sample: number = Math.max(-1, Math.min(1, result[i][offset])); // clamp
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setUint16(pos, sample, true); // write 16-bit sample
        pos += 2;
      }
      offset++;
    }
    return new Blob([buffer], { type: "audio/wave" });
  }
