// Hook to use the audio processing worker with SharedArrayBuffer
import { useCallback, useEffect, useRef, useState } from "react";
import { ProcessAudioPayload } from "workers/audioProcessing.shared.worker";
// import { getPoolMetadata, getSharedPoolBuffer } from "../sfcomponents/samplepool";
import { SAMPLERATE, VoiceHues } from "../types";
import { svgStringToImage } from "../utils/svgstringtoimage";
import { bufferToMp3 } from "../utils/buffertomp3";
import { bufferToWav } from "../utils/buffertowav";
import { debug, getDebugMode } from "utils/debug";

interface WorkerProgress {
  progress: number;
  message: string;
}

interface SharedBuffers {
    audioChannels: Float32Array[];
    audioBuffer: SharedArrayBuffer[];
}

interface UseAudioWorkerSharedReturn {
  startProcessing: (data: any) => void;
  cancelProcessing: () => void;
  isProcessing: boolean;
  progress: WorkerProgress | null;
  sharedBuffers: SharedBuffers | null;
  audioBlob: Blob | null;
  image: HTMLImageElement | null;
  voiceHues: VoiceHues | null;
  error: string | null;
}

export function useAudioWorkerShared(): UseAudioWorkerSharedReturn {
  const workerRef = useRef<Worker | null>(null);
  const payloadRef = useRef<ProcessAudioPayload | null>(null);
  const sharedBuffersRef = useRef<SharedBuffers | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<WorkerProgress | null>(null);
  const [sharedBuffers, setSharedBuffers] = useState<SharedBuffers | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null> (null);
  const [voiceHues, setVoiceHues] = useState<VoiceHues | null> (null);
  const [error, setError] = useState<string | null>(null);

  // Initialize shared pool once on hook mount
  // useEffect(() => {
  //   // Verify pool was initialized at app startup
  //   const poolBuffer = getSharedPoolBuffer();
  //   if (!poolBuffer) {
  //     console.error(
  //       'Shared pool not initialized! Call initializeSharedPool() at app startup.'
  //     );
  //   }
  // }, []);

  // Initialize worker on mount
  useEffect(() => {
    // Create the worker
    workerRef.current = new Worker(
      new URL('../workers/audioProcessing.shared.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Handle messages from worker
    workerRef.current.onmessage = (event) => {
      const { type, progress: prog, message, result: res, error: err } = event.data;

      switch (type) {
        case 'BUFFERS_READY':
          debug.info('useAudioWorkerShared: BUFFERS_READY Shared buffers initialized in worker');
          break;

        case 'PROGRESS':
          debug.info('useAudioWorkerShared: PROGRESS received');
          setProgress({ progress: prog, message });
          break;

        case 'COMPLETE':
          debug.info('useAudioWorkerShared: COMPLETE received');
          setIsProcessing(false);
          setVoiceHues(res.voiceHues);
          setProgress(null);
          
          // Encode audio on main thread from shared buffers
          if (sharedBuffersRef.current && payloadRef.current) {
            debug.info('useAudioWorkerShared: Encoding audio on main thread...');
            try {
              const startTime = performance.now();
              const audioBlob = payloadRef.current.recordFormat === 'wav'
                ? bufferToWav(sharedBuffersRef.current.audioChannels, payloadRef.current.sampleRate)
                : bufferToMp3(sharedBuffersRef.current.audioChannels, payloadRef.current.sampleRate);
              
              const endTime = performance.now();
              debug.info(`useAudioWorkerShared: Audio encoded in ${(endTime - startTime).toFixed(2)}ms, size: ${audioBlob.size} bytes`);
              setAudioBlob(audioBlob);
            } catch (err) {
              console.error('useAudioWorkerShared: Error encoding audio:', err);
              setError('Failed to encode audio');
            }
          }
          
          // Convert SVG string to image element
          if (res.svgString) {
            svgStringToImage(res.svgString)
              .then(img => setImage(img))
              .catch(err => {
                console.error('Failed to convert SVG to image:', err);
                setError('Failed to generate chart image');
              });
          }
          break;

        case 'ERROR':
          debug.info('useAudioWorkerShared: ERROR received');
          setIsProcessing(false);
          setError(err);
          setProgress(null);
          break;

        case 'CANCELLED':
          debug.info('useAudioWorkerShared: CANCELLED received');
          setIsProcessing(false);
          setProgress(null);
          setError('Processing cancelled');
          break;
      }
    };

    // Pass the shared pool buffer and metadata to the worker
    // const poolBuffer = getSharedPoolBuffer();
    // const poolMetadata = getPoolMetadata();
    
    // if (poolBuffer) {
    //   console.log('useAudioWorkerShared: INIT_SAMPLE_POOL sent');

    //   workerRef.current.postMessage({
    //     type: 'INIT_SAMPLE_POOL',
    //     payload: {
    //       buffer: poolBuffer,
    //       metadata: poolMetadata
    //     }
    //   });
    //   // Note: Do NOT transfer SharedArrayBuffer - it's shared memory, not transferred
    // }

    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const initializeSharedAudioBuffers = useCallback((duration: number):SharedBuffers | null => {
    if (!workerRef.current) return null;

    // Create shared buffers for the audio
    // Each sample is a float32 (4 bytes), so multiply duration by sample rate
    const bufferLength = Math.ceil(duration * SAMPLERATE);
    const audioBuffer: SharedArrayBuffer[] = [new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * bufferLength),new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * bufferLength)]

    // Create typed arrays that view the shared memory
    const audioChannels = [new Float32Array(audioBuffer[0]), new Float32Array(audioBuffer[1])];

    // Initialize with zeros
    audioChannels[0].fill(0);
    audioChannels[1].fill(0);


      debug.info('initializeSharedAudioBuffers: INIT_BUFFERS sent');
    // Send the buffers to the worker
    workerRef.current.postMessage({
      type: 'INIT_BUFFERS',
      payload: {
        audioBuffer,
        bufferLength: bufferLength
      }
    });

    const buffers: SharedBuffers = {
        audioBuffer,
        audioChannels,
    };

    sharedBuffersRef.current = buffers;
    setSharedBuffers(buffers);
    return buffers;
  }, []);

  const startProcessing = useCallback((data: ProcessAudioPayload) => {
    if (!workerRef.current) return;

    // Store payload for later use in COMPLETE handler
    payloadRef.current = data;

    // Initialize shared buffers based on duration
    const { duration } = data;
    initializeSharedAudioBuffers(duration);

    setIsProcessing(true);
    setAudioBlob(null);
    setImage(null);
    setVoiceHues(null);
    setError(null);
    const mode = getDebugMode();
    workerRef.current.postMessage({type: 'DEBUG_LEVEL', payload: {level:mode}});
    setProgress({ progress: 0, message: 'Starting...' });

    // Send the processing request to the worker
    debug.info('startProcessing: PROCESS_AUDIO being sent')
    workerRef.current.postMessage({
      type: 'PROCESS_AUDIO',
      payload: data
    });
  }, [initializeSharedAudioBuffers]);

  const cancelProcessing = useCallback(() => {
    if (!workerRef.current) return;
    debug.info('startProcessing: CANCEL being sent')

    workerRef.current.postMessage({ type: 'CANCEL' });
  }, []);

  return {
    startProcessing,
    cancelProcessing,
    isProcessing,
    progress,
    sharedBuffers,
    audioBlob,
    image,
    voiceHues,
    error
  };
}
