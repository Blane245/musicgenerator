// // Maintains a persistent shared pool across all worker instances
// // The pool data lives in SharedArrayBuffer so all workers can access it

// import { debug } from "utils/debug";
// import { Sample, SampleHeader } from "./types";

// const pool: { sample: Float32Array; header: SampleHeader }[] = [];
// let sharedPoolBuffer: SharedArrayBuffer | null = null;
// let sharedPoolMetadata: Array<{
//   soundfont: string;
//   name: string;
//   offset: number;
//   length: number;
//   header: SampleHeader;
// }> = [];

// /**
//  * Initialize the shared pool (call once at app startup)
//  * Creates a SharedArrayBuffer that can be passed to all workers
//  * @param initialBufferSize - Size in bytes (default 10MB)
//  */
// export function initializeSharedPool(initialBufferSize: number = 10_000_000) {
//   if (sharedPoolBuffer !== null) {
//     debug.warn(
//       "Shared pool already initialized. Ignoring duplicate initialization.",
//     );
//     return;
//   }

//   // Check if SharedArrayBuffer is available
//   if (typeof SharedArrayBuffer === 'undefined') {
//     const errorMsg = `SharedArrayBuffer is not available. This requires:
//   - Browser must support SharedArrayBuffer (Chrome 68+, Firefox 55+, Safari 15.2+)
//   - Server must send these headers:
//     * Cross-Origin-Opener-Policy: same-origin
//     * Cross-Origin-Embedder-Policy: require-corp
  
//   For development with Vite: Check that vite.config.ts has the required headers in server.headers
//   For production: Configure your web server to send these headers`;
//     throw new Error(errorMsg);
//   }

//   // Create a shared buffer for audio samples
//   sharedPoolBuffer = new SharedArrayBuffer(initialBufferSize);
//   debug.log(
//     `Initialized shared pool buffer: ${(initialBufferSize / 1_000_000).toFixed(1)}MB`,
//   );
// }

// /**
//  * Get the shared buffer to pass to workers
//  */
// export function getSharedPoolBuffer(): SharedArrayBuffer | null {
//   return sharedPoolBuffer;
// }

// /**
//  * Get the pool metadata (which samples are where in shared buffer)
//  */
// export function getPoolMetadata(): Array<{
//   name: string;
//   offset: number;
//   length: number;
//   header: SampleHeader;
// }> {
//   return sharedPoolMetadata;
// }

// /**
//  * Main thread version of samplePool
//  * Adds new samples to shared buffer if not already there
//  */
// export function samplePool(soundfont: string, desiredSample: Sample): {
//   sample: Float32Array;
//   header: SampleHeader;
// } {
//   if (!sharedPoolBuffer) {
//     throw new Error(
//       "Shared pool not initialized. Call initializeSharedPool() first.",
//     );
//   }

//   const { header, data } = desiredSample;

//   // Check if sample already in metadata
//   const metaIndex = sharedPoolMetadata.findIndex(
//     (m) =>
//       m.header.name === header.name && m.soundfont === soundfont,
//   );
//   if (metaIndex >= 0) {
//     const meta = sharedPoolMetadata[metaIndex];
//     const float32View = new Float32Array(
//       sharedPoolBuffer,
//       meta.offset,
//       meta.length,
//     );
//     return { sample: float32View, header: meta.header };
//   }

//   // Sample not in pool - add it to shared buffer
//   const currentSize = sharedPoolMetadata.reduce(
//     (sum, m) => sum + m.length * Float32Array.BYTES_PER_ELEMENT,
//     0,
//   );
//   const newSampleSize = data.length * Float32Array.BYTES_PER_ELEMENT;

//   if (currentSize + newSampleSize > sharedPoolBuffer.byteLength) {
//     debug.error(
//       `Shared pool buffer full (${(sharedPoolBuffer.byteLength / 1_000_000).toFixed(1)}MB used). ` +
//         `Consider resizing or implementing a new buffer allocation strategy.`,
//     );
//   }

//   // Convert to float32 in shared memory
//   const offset = currentSize;
//   const float32View = new Float32Array(sharedPoolBuffer, offset, data.length);

//   for (let i = 0; i < data.length; i++) {
//     float32View[i] = data[i] / 32768; // Convert 16-bit to float32
//   }

//   // Store metadata
//   sharedPoolMetadata.push({
//     soundfont,
//     name: header.name,
//     offset,
//     length: data.length,
//     header,
//   });

//   // Also keep in CPU memory pool for fast main thread access
//   pool.push({
//     sample: float32View,
//     header,
//   });

//   return { sample: float32View, header };
// }

// /**
//  * Clear the pool (useful for memory management)
//  */
// export function clearSamplePool() {
//   pool.length = 0;
//   sharedPoolMetadata.length = 0;
// }

// /**
//  * Get pool statistics
//  */
// export function getSamplePoolStats(): {
//   sampleCount: number;
//   bufferUsed: number;
//   bufferCapacity: number;
//   percentUsed: number;
// } {
//   if (!sharedPoolBuffer) {
//     return { sampleCount: 0, bufferUsed: 0, bufferCapacity: 0, percentUsed: 0 };
//   }

//   const bufferUsed = sharedPoolMetadata.reduce(
//     (sum, m) => sum + m.length * Float32Array.BYTES_PER_ELEMENT,
//     0,
//   );

//   return {
//     sampleCount: sharedPoolMetadata.length,
//     bufferUsed,
//     bufferCapacity: sharedPoolBuffer.byteLength,
//     percentUsed: (bufferUsed / sharedPoolBuffer.byteLength) * 100,
//   };
// }
