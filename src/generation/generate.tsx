// https://github.com/Blane245/musicgenerator/issues/5#issue-2550789485

// turn the sound generators into a preview or recording based on
// which generators are selected
import { useEffect, useState } from "react";
import { useCMGContext } from "../cmgcontext";
import {
  CMGeneratorType,
  GENERATIONMODE,
  SAMPLERATE,
  RawSourceData,
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
    if (mode == GENERATIONMODE.idle) return;

    // determine the selected generators and make sure they are ready to generate sound
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
    if (error != "") return;
    // console.log('playback length ', playbackLength);

    // build the generator sources
    const sourceData: RawSourceData[] = buildSources({
      SFPGenerators,
      SFRGenerators,
      NoiseGenerators,
    });

    // select either preview or recording
    if (mode == GENERATIONMODE.preview || mode == GENERATIONMODE.solo)
      Preview({
        fileContents,
        playbackLength,
        offsetTime,
        sourceData,
        setMode,
        playing,
        setTimeProgress,
        setGeneratorsPlaying,
        setStatus,
      });
    else
      Record({
        fileContents,
        sourceData,
        sampleRate: SAMPLERATE,
        playbackLength,
        setMode,
        setStatus,
        playing,
      });
  }, [mode]);

  function handleErrorClose() {
    setError("");
    setMode(GENERATIONMODE.idle);
    setStatus(``);
  }

  // the only thing displayed by this function is an error popup
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
