//curtesy of a MDN Web Docs via CoPilot
export async function compressAndConvertToString(data: ArrayBuffer): Promise<string> {
  const compressedData: ArrayBuffer = await compressData(data);
  const base64String:string = arrayBufferToBase64(compressedData);
  const jsonString: string = createJsonObject(base64String)
  return jsonString;

  async function compressData(data: ArrayBuffer): Promise<ArrayBuffer> {
    const cs: CompressionStream = new CompressionStream("gzip");
    const writer: WritableStreamDefaultWriter<ArrayBuffer> =
      cs.writable.getWriter();
    writer.write(data);
    writer.close();
    const compressedStream: ReadableStream<Uint8Array> = cs.readable;
    const compressedArray: ArrayBuffer = await new Response(
      compressedStream
    ).arrayBuffer();
    return compressedArray;
  }
  function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

export async function convertFromJsonAndDecompress(
  jsonObject: string
): Promise<Float32Array> {
  const base64String: string = createBase64String(jsonObject);
  const compressedData: ArrayBuffer = base64ToArrayBuffer(base64String);
  const decompressedData: ArrayBuffer = await decompressData(compressedData);
  return new Float32Array(decompressedData);

  function createBase64String(jsonObject: string): string {
    return JSON.parse(jsonObject);
  }

  function base64ToArrayBuffer(base64String: string): ArrayBuffer {
    const binaryString: string = atob(base64String);
    const len: number = binaryString.length;
    const arrayBuffer = new ArrayBuffer(len);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < len; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }
    return arrayBuffer;
  }

  async function decompressData(compressedArrayBuffer: ArrayBuffer) {
    const decompressionStream = new DecompressionStream("gzip");
    const writer = decompressionStream.writable.getWriter();
    writer.write(compressedArrayBuffer);
    writer.close();

    const decompressedStream = decompressionStream.readable;
    const decompressedArrayBuffer = await new Response(
      decompressedStream
    ).arrayBuffer();
    return decompressedArrayBuffer;
  }

}
function createJsonObject(base64String:string) {
  return JSON.stringify(base64String);
}

