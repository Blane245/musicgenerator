// // Worker-side pool access
// // All workers share the same SharedArrayBuffer created by main thread

// let sharedPoolBuffer: SharedArrayBuffer | null = null;
// let poolMetadata: Array<{
//   name: string;
//   offset: number;
//   length: number;
//   header: any;
// }> = [];

// /**
//  * Initialize worker access to the shared pool
//  */
// export function initWorkerSamplePool(buffer: SharedArrayBuffer, metadata: Array<{
//   name: string;
//   offset: number;
//   length: number;
//   header: any;
// }>) {
//   sharedPoolBuffer = buffer;
//   poolMetadata = metadata;
//   console.log(`Worker: Initialized shared pool with ${metadata.length} samples`);
// }

// /**
//  * Worker version of samplePool lookup
//  * Returns a view into the shared buffer
//  */
// export function workerSamplePool(sampleName: string): {
//   sample: Float32Array;
//   header: any;
// } | null {
//   if (!sharedPoolBuffer) {
//     console.error('Worker: Shared pool buffer not initialized');
//     return null;
//   }

//   const meta = poolMetadata.find((m) => m.name === sampleName);
  
//   if (meta) {
//     // Return a Float32Array view into the shared buffer
//     const float32View = new Float32Array(sharedPoolBuffer, meta.offset, meta.length);
//     return {
//       sample: float32View,
//       header: meta.header
//     };
//   }

//   return null; // Sample not found in pool
// }

// /**
//  * Get current pool metadata (for debugging)
//  */
// export function getWorkerPoolMetadata() {
//   return poolMetadata;
// }

// /**
//  * Get pool stats
//  */
// export function getWorkerPoolStats() {
//   if (!sharedPoolBuffer) {
//     return null;
//   }

//   const bufferUsed = poolMetadata.reduce(
//     (sum, m) => sum + m.length * Float32Array.BYTES_PER_ELEMENT,
//     0
//   );

//   return {
//     sampleCount: poolMetadata.length,
//     bufferUsed,
//     bufferCapacity: sharedPoolBuffer.byteLength,
//     percentUsed: (bufferUsed / sharedPoolBuffer.byteLength) * 100
//   };
// }
