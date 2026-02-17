// Web Worker for heavy audio processing using SharedArrayBuffer
// Accesses the persistent shared sample pool created by main thread

import { GENERATORTYPE, GeneratorType, VoiceHues } from "types";
// import { bufferToMp3 } from "../utils/buffertomp3";
// import { bufferToWav } from "../utils/buffertowav";
// import { initWorkerSamplePool } from "./samplePoolWorker";
import ChartCollector from "./chartcollector";
import { generateSVGChart } from "../utils/generatesvgchart";
import getSourcesFromAlgorithmic from "playfunctions/getsourcesfromalgorithmic";
import Algorithmic from "classes/generators/algorithmic";
import getSourcesFromStochastic from "playfunctions/getsourcesfromstochastic";
import Stochastic from "classes/generators/stochastic";
import { debug, setDebugMode } from "utils/debug";

interface WorkerMessage {
  type: "PROCESS_AUDIO" | "CANCEL" | "INIT_BUFFERS" | "DEBUG_LEVEL" /*| "INIT_SAMPLE_POOL"*/;
  payload?: any;
}

export interface ProcessAudioPayload {
  generators: GeneratorType[];
  duration: number;
  voiceHues: VoiceHues;
  sampleRate: number;
  recordFormat: string;
  windowWidth: number;
  windowHeight: number;
}

interface InitBuffersPayload {
  audioBuffer: SharedArrayBuffer[];
  bufferLength: number;
}

interface DebugLevelPayload {
  level: string;
}

let cancelled = false;
let audioBuffer: SharedArrayBuffer[] | null = null;

// Listen for messages from the main thread
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    // case "INIT_SAMPLE_POOL":
    //   // Receive the shared pool buffer and metadata from main thread
    //   console.log('ProcessAudioPayload: INIT_SAMPLE_POOL received')
    //   const { buffer, metadata } = payload;
    //   initWorkerSamplePool(buffer, metadata);
    //   self.postMessage({
    //     type: "POOL_READY",
    //     message: `Sample pool initialized with ${metadata.length} samples`,
    //   });
    //   break;

    case "DEBUG_LEVEL":
      setDebugMode((payload as DebugLevelPayload).level);
      debug.info(`ProcessAudioPayload: debug level set to ${(payload as DebugLevelPayload).level}`);
      break;
    case "INIT_BUFFERS":
      debug.info("ProcessAudioPayload: INIT_BUFFERS received");
      initSharedBuffers(payload as InitBuffersPayload);
      break;

    case "PROCESS_AUDIO":
      cancelled = false;
      debug.info("ProcessAudioPayload: PROCESS_AUDIO received");
      processAudio(payload as ProcessAudioPayload);
      break;

    case "CANCEL":
      debug.info("ProcessAudioPayload: CANCEL received");
      cancelled = true;
      break;
  }
};

function initSharedBuffers(data: InitBuffersPayload) {
  const { audioBuffer: audioBuf } = data;
  audioBuffer = audioBuf;
  debug.info("initSharedBuffers: BUFFERS_READY sent");

  self.postMessage({
    type: "BUFFERS_READY",
    message: "Shared buffers initialized",
  });
}

async function processAudio(data: ProcessAudioPayload) {
  try {
    if (!audioBuffer) {
      debug.info("processAudio: ERROR sent audioBuffer is null");
      self.postMessage({
        type: "ERROR",
        error: "Shared buffers not initialized",
      });
      return;
    }

    // this will take that generators that have been selected and
    // create the audio composition, graphics, audio file
    const {
      generators,
      duration,
      windowWidth,
      windowHeight,
    } = data;

    const audioChannels: Float32Array[] = [
      new Float32Array(audioBuffer[0]),
      new Float32Array(audioBuffer[1]),
    ];

    //NOTE: the audiobuffer has a fixed length based on the initial duration of
    // the composition. In the case of stochastic generators, there could be
    // sound sample generated past this point as the exact end of the composition
    // is not known until it is built. If any sound is generated past the initial duration
    // it will be discarded. It is important that a Silent generator exists that extents past the
    // end of all stochastic generators by at least one time cell to avoid this from
    // happening. In the case where generators or soloed or selected by time interval,
    // it is quite likely that this truncation will occur.

    // Create typed arrays that view the shared memory
    const totalSamples: number = audioChannels[0].length;

    // Clear the buffers
    audioChannels[0].fill(0);
    audioChannels[1].fill(0);

    // construct the chart collector for the playback graphic
    const chartWidth: number = (Math.trunc(duration / 60) + 1) * windowWidth;
    const chartDuration: number = (Math.trunc(duration / 60) + 1) * 60;
    const chart: ChartCollector = new ChartCollector(
      chartWidth,
      windowHeight,
      chartDuration,
    );

    // build the voice hues. Each unique combination of soundfontfile/presetname
    // within the algorithmic and stochastic generators gets a unique hue.
    // the unique voices are assembled, counted, and the the hue range
    // from 0-360 is divided evenly
    const voiceHues: VoiceHues = new Map<string, number>();
    for (let generator of generators) {
      if (generator.type == GENERATORTYPE.Algorithmic) {
        voiceHues.set(
          (generator as Algorithmic).soundFontFile +
            "|" +
            (generator as Algorithmic).presetName,
          0,
        );
      } else if (generator.type == GENERATORTYPE.Stochastic) {
        for (let voice of (generator as Stochastic).values.voices) {
          if (!voice.muted)
            voiceHues.set(voice.soundFontFile + "|" + voice.presetName, 0);
        }
      }
    }
    const voiceCount: number = Array.from(voiceHues.keys()).length;
    let iHue: number = 0;
    for (let key of voiceHues.keys()) {
      const hue: number = (360 * iHue) / voiceCount;
      voiceHues.set(key, hue);
      iHue++;
    }

    // Rehydrate generators to restore their methods after worker transfer
    generators.forEach((g: GeneratorType, i) => {
      if (g.type === GENERATORTYPE.Algorithmic) {
        generators[i] = Algorithmic.fromPlainObject(g);
      } else if (g.type === GENERATORTYPE.Stochastic) {
        generators[i] = Stochastic.fromPlainObject(g);
      }
    });

    let error: string = "";
    generators.forEach((g: GeneratorType, i) => {
      switch (g.type) {
        case GENERATORTYPE.Silent: // nothing to do here
          break;
        case GENERATORTYPE.Algorithmic:
          error = getSourcesFromAlgorithmic({
            generator: g as Algorithmic,
            audioBuffer: audioChannels,
            chart,
            voiceHues,
          });
          break;
        case GENERATORTYPE.Stochastic:
          error = getSourcesFromStochastic({
            generator: g as Stochastic,
            audioBuffer: audioChannels,
            chart,
            voiceHues,
          });
          break;
      }
      if (error != "") return;

      // Check if cancelled
      if (cancelled) {
        debug.info("processAudio: CANCELLED sent");

        self.postMessage({
          type: "CANCELLED",
          message: "Processing cancelled by user",
        });
        return;
      }

      // Send progress updates
      debug.info("processAudio: PROGRESS sent", 95 * i / generators.length);
      self.postMessage({
        type: "PROGRESS",
        progress: (i / generators.length) * 95,
        message: `Processing generator ${i + 1} of ${generators.length}...`,
      });
    });
    if (error != "") {
      debug.info("processAudio: ERROR sent:", error);
      self.postMessage({
        type: "ERROR",
        error,
      });
    }

    // normalize the audio buffer
    normalize(audioChannels);

    // Audio is in shared buffers - main thread will read and encode it
    debug.info("processAudio: Audio processing complete, generating SVG...");
    self.postMessage({
      type: "PROGRESS",
      progress: 95,
      message: `Generating playback graphic`,
    });

    try {
      // Generate SVG chart as string from collected lines
      debug.info("processAudio: Starting SVG generation...");
      debug.info("processAudio: chart lines count =", chart.getLines().length);
      const svgString: string = generateSVGChart(
        chart.getLines(),
        chart.chartWidth,
        chart.chartHeight,
        chart.totalTime,
      );
      debug.info("processAudio: SVG generation complete, length =", svgString.length);
      debug.info("processAudio: COMPLETE sent");

      // Return voiceHues and SVG - main thread will handle audio encoding from shared buffers
      self.postMessage({
        type: "COMPLETE",
        result: {
          svgString,
          voiceHues,
          duration,
          totalSamples,
        },
      });
    } catch (svgError) {
      console.error("processAudio: Exception during SVG generation:", svgError);
      console.error("processAudio: Error message:", (svgError as Error).message);
      console.error("processAudio: Stack:", (svgError as Error).stack);
      throw svgError;
    }
  } catch (error) {
    debug.info(
      "processAudio: ERROR sent because of exception:",
      (error as Error).message,
      (error as Error).stack,
    );
    self.postMessage({
      type: "ERROR",
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
  }
}

// normalize the audio sample so that the maximum signal level is set to 1
const normalize = (buffer: Float32Array[]) => {
  if (buffer[0].length == 0) return;
  let max: number = 0;
  let rms: number = 0;
  let sum: number = 0;
  for (let i = 0; i < buffer[0].length; i++) {
    if (buffer[0][i] != 0 || buffer[1][i] != 0) {
      max = Math.max(max, Math.abs(buffer[0][i]), Math.abs(buffer[1][i]));
      if (Number.isNaN(max)) {
        throw new Error(`buffer processing error in normalize at sample ${i}`);
      }
      sum += Math.abs(buffer[0][i]) + Math.abs(buffer[1][i]);
      rms += buffer[0][i] * buffer[0][i] + buffer[1][i] * buffer[1][i];
    }
  }
  // const average: number = sum / (2 * count);
  rms = Math.sqrt(rms / (2 * buffer[0].length));
  if (max == 0) return;
  for (let i = 0; i < buffer[0].length; i++) {
    buffer[0][i] /= max;
    buffer[1][i] /= max;
  }
  return;
};

// Catch any unhandled errors or rejections in the worker
self.addEventListener('error', (event: ErrorEvent) => {
  console.error('Worker error event:', event.error, event.message);
  self.postMessage({
    type: 'ERROR',
    error: event.message,
    stack: event.error?.stack || 'No stack trace'
  });
});

self.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  console.error('Worker unhandled rejection:', event.reason);
  self.postMessage({
    type: 'ERROR',
    error: String(event.reason),
    stack: 'Unhandled promise rejection'
  });
});

