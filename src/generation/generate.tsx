// https://github.com/Blane245/musicgenerator/issues/5#issue-2550789485

// TODO in order to handle large audio node graphs for both preview and recording
// the network to built in two steps.
// first the raw source, volume, and panner data needs to be obtained for 
// each source of a generator's sound
// then while previewing or recording, the subnet needs to be constructed.
// in teh preview case, using the scheduler, the sources are constructed when 
// their start time arrives in the scheduler and then disconnected when the stop time arrives
// in teh recording case, recording is done in batches do the sources for 
// the batch need to be constructed, connected, and rendered. Each rendered
// batch is collected. when all rendering is complete, the results are 
// added and then written 
import { useEffect, useState } from "react";
import { useCMGContext } from "../cmgcontext";
import {
  CMGeneratorType,
  GENERATIONMODE,
  SAMPLERATE,
  SourceData,
} from "../types";
import { buildSources } from "./buildsources";
import Preview from "./preview";
import ReadyGenerate from "./readygenerate";
import Record from "./record";

// the state of the system changes here when the audio context is defined
// the audio render graph is built
// each of the active generators are responsible for define the needed
// audio nodes and connecting them together.
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
    setStatus,
    playing,
    setTimeProgress,
    fileContents,
    timeInterval,
    setGeneratorsPlaying,
  } = useCMGContext();
  const [error, setError] = useState<string>("");

  // all of the work of the generator is done by this hook when the
  // mode changes to to anything but idle
  useEffect(() => {
    if (mode != GENERATIONMODE.idle) {
      const {
        SFPGenerators,
        SFRGenerators,
        NoiseGenerators,
        playbackLength,
        offsetTime,
        error,
      } = ReadyGenerate({
        mode,
        generator,
        fileContents,
        timeInterval,
      });
      setError(error);
      if (error == "") {
        playing.current = true;
        setTimeProgress(0);

        // the audio context is either on active speaker context of an offline one depending on the mode
        const live: boolean =
          mode == GENERATIONMODE.preview || mode == GENERATIONMODE.solo;

        if (live) {
        }

        // set the context and suspend live performance until the source data
        // is assembled
        const context: AudioContext | OfflineAudioContext = live
          ? new AudioContext()
          : new OfflineAudioContext(2, SAMPLERATE * playbackLength, SAMPLERATE);
        if (live) (context as AudioContext).suspend();

          // build the generator sources
          const sourceData: SourceData[] = buildSources({
            context,
            SFPGenerators,
            SFRGenerators,
            NoiseGenerators,
          });

        if (live) {

          Preview({
            context: context as AudioContext,
            compressor: fileContents.compressor,
            equalizer: fileContents.equalizer,
            playbackLength,
            offsetTime,
            sourceData,
            setMode,
            playing,
            setTimeProgress,
            setGeneratorsPlaying,
            setStatus,
          });
        } else if (mode == GENERATIONMODE.record) {
          Record({
            context: context as OfflineAudioContext,
            compressor: fileContents.compressor,
            equalizer: fileContents.equalizer,
            sourceData,
            sampleRate: SAMPLERATE,
            playbackLength,
            setMode,
            setStatus,
            playing,
          });
        }
      }
    }
  }, [mode]);

  function handleErrorClose() {
    setError("");
    setMode(GENERATIONMODE.idle);
    setStatus(``);
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
}
