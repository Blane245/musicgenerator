// https://github.com/Blane245/musicgenerator/issues/5#issue-2550789485

import { useEffect, useRef, useState } from "react";
import CMG from "../../classes/cmg";
import Noise from "../../classes/noise";
import SFPG from "../../classes/sfpg";
import SFRG from "../../classes/sfrg";
import { useCMGContext } from "../../contexts/cmgcontext";
import {
  CHUNKTIME,
  CMGeneratorType,
  GENERATIONMODE,
  sourceData,
  GENERATORTYPE,
  SAMPLERATE,
} from "../../types/types";
import { setRandomSeed } from "../../utils/seededrandom";
import { getBufferSourceNodesFromNoise } from "./noisenodes";
import { getBufferSourceNodesFromSFPG } from "./sfpgnodes";
import { getBufferSourceNodesFromSFRG } from "./sfrgnodes";

const SCHEDULEAHEADTIME: number = 0.1; // how far ahead to schedule audio (seconds)
const LOOKAHEAD: number = 25.0; // how frequently to call the schedule function (ms)
let timerID: number = 0; // the timer used to set the schedule

// the state of the system changes here when the audio context is defined
// the audio render graph is built
// each of the active generators are responsible for define the needed
// audio nodes and connecting them together.
// the render tail for the room reverb is activated when the room reverb is
// initialized
// the generators are responsbile for setting start times for
// the render tails for instrument reverbs
// using the defined cm generators for all tracks, create a web audio
// if a generator is provided
export interface GeneratorProps {
  mode: GENERATIONMODE;
  setMode: Function;
  generator: CMGeneratorType | null;
}
export default function Generate(props: GeneratorProps) {
  const { mode, setMode, generator } = props;
  const {
    fileContents,
    setStatus,
    playing,
    setTimeProgress,
    timeInterval,
    setGeneratorsPlaying,
  } = useCMGContext();
  const [error, setError] = useState<string>("");
  const recordHandle = useRef<FileSystemFileHandle | null>(null);
  const generatorStarted: boolean[] = [];
  const sourceData: sourceData[] = [];
  const SFPGenerators: SFPG[] = [];
  const SFRGenerators: SFRG[] = [];
  const NoiseGenerators: Noise[] = [];
  let playbackLength = 0;
  let nextTime: number = 0.0;

  // all of the work of the generator is done by this hook when the
  // mode changes to to anything but idle
  useEffect(() => {
    if (mode != GENERATIONMODE.idle) {
      ReadyGenerate();
      if (mode == GENERATIONMODE.preview || mode == GENERATIONMODE.solo) {
        PreviewOrRecord(mode);
      } else if (mode == GENERATIONMODE.record) {
        // request a file to write to
        // if not selected, abort the recording
        try {
          window
            .showSaveFilePicker({
              types: [
                {
                  description: "Audio file",
                  accept: { "audio/wav": [".wav"] },
                },
              ],
            })
            .then((rh: FileSystemFileHandle) => {
              recordHandle.current = rh;
              PreviewOrRecord(mode);
            });
        } catch {
          recordHandle.current = null;
          setMode(GENERATIONMODE.idle);
        }
      }
    }
  }, [mode]);

  function handleErrorClose() {
    setError("");
    setMode(GENERATIONMODE.idle);
    setStatus(``);
  }

  function isSelected(
    generator: CMGeneratorType,
    startTime: number,
    endTime: number
  ): boolean {
    if (generator.startTime >= startTime && generator.stopTime <= endTime) {
      return true;
    } else return false;
  }

  // find the selected generator that has the earliest start time
  function findEarliestSelected (startTime: number, endTime: number): number {
    let earliest: number = 1e65;
    fileContents.tracks.forEach((t) => {
      t.generators.forEach((g) => {
        if (isSelected(g, startTime, endTime)) 
          earliest = Math.min(earliest, g.startTime);
      });
    })
    return earliest;
  }
  function ReadyGenerate() {
    // get the active generators for the entire rendering
    if (mode == GENERATIONMODE.preview || mode == GENERATIONMODE.record) {
      // the timeline interval overrides other filters
      if (timeInterval.startTime != undefined && timeInterval.endTime != undefined) {
        const startTime: number = timeInterval.startTime;
        const endTime: number = timeInterval.endTime;

        // find the slected generator with the earliest start time
        const firstGeneratorTime: number = findEarliestSelected(
          startTime,
          endTime
        );
        fileContents.tracks.forEach((t) => {
          t.generators.forEach((g) => {
            if (isSelected(g, startTime, endTime)) {
              // move the generators time back to zero with the
              // earliest selected as zero and the others following
              const thisG = g.copy();
              thisG.startTime = thisG.startTime - firstGeneratorTime;
              thisG.stopTime = thisG.stopTime - firstGeneratorTime;
              if (g.type == GENERATORTYPE.SFPG) SFPGenerators.push(thisG as SFPG);
              if (g.type == GENERATORTYPE.SFRG) SFRGenerators.push(thisG as SFRG);
              if (g.type == GENERATORTYPE.Noise)
                NoiseGenerators.push(thisG as Noise);

            }
          });
        });
      } else {
        // find if there are any solo tracks
        let isSolo: boolean = fileContents.tracks.findIndex((t) => t.solo) >= 0;

        fileContents.tracks.forEach((t) => {
          if (!t.mute) {
            if ((isSolo && t.solo) || !isSolo) {
              t.generators.forEach((g: CMG | SFPG | SFRG | Noise) => {
                if (g.type == GENERATORTYPE.SFPG && !g.mute) {
                  if (!(g as SFPG).preset) {
                    setError(
                      `Generator '${g.name}' on track '${t.name}' does not have a preset assigned.`
                    );
                    return;
                  } else {
                    SFPGenerators.push(g as SFPG);
                    playbackLength = Math.max(playbackLength, g.stopTime);
                  }
                }
                if (g.type == GENERATORTYPE.SFRG && !g.mute) {
                  if (!(g as SFRG).preset) {
                    setError(
                      `Generator '${g.name}' on track '${t.name}' does not have a preset assigned.`
                    );
                    return;
                  } else {
                    SFRGenerators.push(g as SFRG);
                    playbackLength = Math.max(playbackLength, g.stopTime);
                  }
                }
                if (g.type == GENERATORTYPE.Noise) {
                  NoiseGenerators.push(g as Noise);
                  playbackLength = Math.max(playbackLength, g.stopTime);
                }
              });
            }
          }
        });
      }
      // get the generator being soloed and shift its start time to zero
    } else if (mode == GENERATIONMODE.solo && generator) {
      if (!generator.mute) {
        if (generator.type == GENERATORTYPE.SFPG) {
          const tempGen: SFPG = (generator as SFPG).copy();
          tempGen.stopTime = tempGen.stopTime - tempGen.startTime;
          tempGen.startTime = 0;
          SFPGenerators.push(tempGen);
          playbackLength = tempGen.stopTime;
        } else if (generator.type == GENERATORTYPE.SFRG) {
          const tempGen: SFRG = (generator as SFRG).copy();
          tempGen.stopTime = tempGen.stopTime - tempGen.startTime;
          tempGen.startTime = 0;
          SFRGenerators.push(tempGen);
          playbackLength = tempGen.stopTime;
        } else if (generator.type == GENERATORTYPE.Noise) {
          const tempGen: Noise = (generator as Noise).copy();
          tempGen.stopTime = tempGen.stopTime - tempGen.startTime;
          tempGen.startTime = 0;
          NoiseGenerators.push(tempGen);
          playbackLength = tempGen.stopTime;
        }
      }
    }
    if (
      SFPGenerators.length == 0 &&
      SFRGenerators.length == 0 &&
      NoiseGenerators.length == 0
    ) {
      setError("No generators are available to produce any sound");
    } else {
      // console.log('useful generators', GENERATORTYPE.SFPG, SFPGenerators.length, GENERATORTYPE.SFRG, SFRGenerators.length, GENERATORTYPE.Noise, NoiseGenerators.length);
    }
    if (error == "") {
      if (playing.current) playing.current.on = true;
    }
  }

  return (
    <div
      style={{ display: error == "" ? "none" : "block" }}
      className="modal-content"
    >
      <div className="modal-header">
        <span className="close" onClick={handleErrorClose}>
          &times;
        </span>
        <h2>Error occurred during audio generation</h2>
      </div>
      <div className="modal-body">
        <p>{error}</p>
      </div>
      <div className="modal-footer">
        <button id={"generator-error"} onClick={handleErrorClose}>
          OK
        </button>
      </div>
    </div>
  );

  // construct the audio sources from the selected generators
  function buildSources(
    context: AudioContext | OfflineAudioContext,
    roomConcentrator: GainNode,
    chunkTime: number
  ): void {
    SFPGenerators.forEach((g) => {
      const SFPGData: sourceData[] = getBufferSourceNodesFromSFPG(
        context,
        g,
        chunkTime,
        roomConcentrator
      );
      sourceData.push(...SFPGData);
      generatorStarted.push(...Array(SFPGData.length).fill(false));
    });

    // build the buffers for the SFRGs
    SFRGenerators.forEach((g) => {
      setRandomSeed(g.seed);
      const SFRGData: sourceData[] = getBufferSourceNodesFromSFRG(
        context,
        g,
        roomConcentrator
      );
      sourceData.push(...SFRGData);
      generatorStarted.push(...Array(SFRGData.length).fill(false));
    });

    // build the buffers for the SFRGs
    NoiseGenerators.forEach((g) => {
      setRandomSeed(g.seed);
      const noiseData: sourceData[] = getBufferSourceNodesFromNoise(
        context,
        g,
        roomConcentrator
      );
      sourceData.push(...noiseData);
      generatorStarted.push(...Array(noiseData.length).fill(false));
    });
  }

  function StartStop(
    source: AudioBufferSourceNode,
    start: number,
    stop: number,
    lastGain: GainNode | null
  ): void {
    source.start(start);
    if (lastGain) {
      const value = lastGain.gain.value;
      // console.log('last gain at time ', stop, 'value', value);
      lastGain.gain.setValueAtTime(value, stop - CHUNKTIME);
      lastGain.gain.cancelAndHoldAtTime(stop - CHUNKTIME);
      lastGain.gain.exponentialRampToValueAtTime(0.001, stop);
      source.stop(stop);
    }
    if (stop >= playbackLength - 1) {
    } else {
      source.stop(stop);
    }
  }
  // do either a preview, record or generate
  function PreviewOrRecord(mode: GENERATIONMODE): void {
    if (mode != GENERATIONMODE.idle) {
      if (playing.current) playing.current.on = true;
      setTimeProgress(0);

      // the audio context is either on active speaker context of an offline one depending on the mode
      const live: boolean =
        mode == GENERATIONMODE.preview || mode == GENERATIONMODE.solo;
      const record: boolean = mode == GENERATIONMODE.record;
      const context: AudioContext | OfflineAudioContext = live
        ? new AudioContext()
        : new OfflineAudioContext(2, SAMPLERATE * playbackLength, SAMPLERATE);

      // hold up the speakers until all of the generators have been built
      if (live) (context as AudioContext).suspend();

      // set up the reverb, equalizer, and compressor
      if (fileContents.reverb.enabled) {
        console.log(
          "generator: set roomreverb context and initializing at ",
          context.currentTime
        );
        fileContents.reverb.setContext(context);
        fileContents.reverb.init(context.currentTime);
      }
      fileContents.equalizer.setContext(context);
      fileContents.compressor.setContext(context);

      // make the room level connections
      // room concentrator -> equalizer
      // equalizer -> compressor
      // compressor to destination
      const roomConcentrator: GainNode = context.createGain();
      roomConcentrator.connect(fileContents.equalizer.front());
      if (fileContents.compressor.effect) {
        fileContents.equalizer.back().connect(fileContents.compressor.effect);
        fileContents.compressor.effect.connect(context.destination);
      } else console.log("generator: compressor missing");

      // connect the optional reverb
      // room concentrator -> room reverb
      // room reverb -> equalizer
      if (fileContents.reverb.enabled)
        if (fileContents.reverb.wet && fileContents.reverb.output && fileContents.compressor.effect) {
          console.log(
            "generator: connecting room concentrator -> reverb wet -> equalizer"
          );
          roomConcentrator.connect(fileContents.reverb.wet);
          fileContents.reverb.output.connect(fileContents.compressor.effect);
        } else console.log("generator: room reverb or compressor missing");

      // build the generator sources and connect to the room concentrator
      buildSources(context, roomConcentrator, CHUNKTIME);

      // the preview and solo modes are done in realtime
      if (live) {
        // resume the audio context after the sources have been built
        context.resume();

        // the real time scheduler
        scheduler();
        function scheduler(): void {
          if (playing.current?.on) {
            const aheadTime = context.currentTime + SCHEDULEAHEADTIME;
            while (nextTime < aheadTime) {
              let started: boolean = false;
              const newGeneratorsPlaying:CMGeneratorType[] = [];
              sourceData.forEach((item, i) => {
                if (aheadTime >= item.start && !generatorStarted[i]) {
                  const { source, reverb, start, stop, lastGain }: sourceData =
                    item;
                  StartStop(source, start, stop, lastGain);
                  newGeneratorsPlaying.push(item.generator);
                  // kick off the optional instrument reverb
                  if (reverb) {
                    reverb.renderTail(/*start*/);
                  }
                  generatorStarted[i] = true;
                  started = true;
                }
                if (newGeneratorsPlaying.length > 0) setGeneratorsPlaying(newGeneratorsPlaying);
              });
              if (started) setTimeProgress(context.currentTime);
              nextTime += CHUNKTIME;
            }
            timerID = window.setTimeout(scheduler, LOOKAHEAD);
          } else {
            clearTimeout(timerID);
          }

          // stop the playback if the current time is past all generator stop times
          const running = sourceData.find((t) => t.stop > context.currentTime);
          if (!running || !playing.current?.on) {
            if (playing.current) playing.current.on = false;
            if (context.state !== "closed") {
              (context as AudioContext).suspend();
              (context as AudioContext).close();
            }
            setMode(GENERATIONMODE.idle);
            setTimeProgress(0);
            setStatus(`Preview Complete`);
            setGeneratorsPlaying([]);
          }
        }
      } else if (record && recordHandle.current) {
        const rh: FileSystemFileHandle = recordHandle.current;
        
        // and provide all source their start and stop times
        sourceData.forEach((item) => {
          const { source, reverb, start, stop, lastGain }: sourceData = item;
          StartStop(source, start, stop, lastGain);
          if (reverb) reverb.renderTail(start);
        });

        // render the sources
        (context as OfflineAudioContext)
          .startRendering()
          .then((renderBuffer: AudioBuffer) => {

            // build the blob and write it to the selected file
            rh.createWritable().then((accessHandle) => {
              const blob: Blob = bufferToWave(
                renderBuffer,
                (context as OfflineAudioContext).length
              );
              accessHandle.write(blob);
              accessHandle.close();
              setStatus(`Audio written to ${rh.name}`);
              setMode(GENERATIONMODE.idle);
              if (playing.current) playing.current.on = false;
            });
            recordHandle.current = null;
          });
      } else {
        setStatus(`Improper generation mode '${mode}'`);
        setMode(GENERATIONMODE.idle);
        if (playing.current) playing.current.on = false;
      }
    }
  }

  // build the sound file as quickly as possible using offline context and write it to the selected wave file
  // thanx to https://russellgood.com/how-to-convert-audiobuffer-to-audio-file/
  function bufferToWave(aBuffer: AudioBuffer, len: number): Blob {
    const numOfChan = aBuffer.numberOfChannels;
    const sampleRate = aBuffer.sampleRate;
    const length = len * numOfChan * 2 + 44;
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
    const channels: Float32Array[] = [];
    for (let i = 0; i < aBuffer.numberOfChannels; i++) {
      channels.push(aBuffer.getChannelData(i));
    }

    let offset: number = 0;
    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample: number = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setUint16(pos, sample, true); // write 16-bit sample
        pos += 2;
      }
      offset++;
    }
    return new Blob([buffer], { type: "audio/wave" });
  }
}
