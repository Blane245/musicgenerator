// https://github.com/Blane245/musicgenerator/issues/5#issue-2550789485

// turn the sound generators into a preview or recording based on
// which generators are selected
import { useEffect, useRef, useState } from "react";
import { useCMGContext } from "../cmgcontext";
import {
  CMGeneratorType,
  GENERATIONMODE,
  RawSourceData,
  SAMPLERATE,
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
  recordFormat?: string;
  recordHandle?: FileSystemFileHandle | null;
  generator: CMGeneratorType | null;
}
export default function Generate(props: GeneratorProps) {
  const { mode, setMode, recordFormat, recordHandle, generator } = props;
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
  const sourceData = useRef<RawSourceData[]>([]);
  const recordLength = useRef<number>(0);
  useEffect(() => {
    if (mode == GENERATIONMODE.idle) {
      return;
    }

    // determine the selected generators and make sure they are ready to generate sound
    const {
      SFPGenerators,
      SFRGenerators,
      NoiseGenerators,
      AudioFileGenerators,
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
    console.log("playback length ", playbackLength);

    // build the generator sources
    recordLength.current = playbackLength;
    sourceData.current = buildSources({
      SFPGenerators,
      SFRGenerators,
      NoiseGenerators,
      AudioFileGenerators
    });

    playing.current = true;
    // select either preview or recording
    if (mode == GENERATIONMODE.preview || mode == GENERATIONMODE.solo)
      Preview({
        fileContents,
        playbackLength,
        offsetTime,
        sourceData: sourceData.current,
        setMode,
        playing,
        setTimeProgress,
        setGeneratorsPlaying,
        setStatus,
      });
      console.log('mode is', mode, 'record handle is ', recordHandle);
  }, [mode]);

  function handleErrorClose() {
    setError("");
    setMode(GENERATIONMODE.idle);
    setStatus(``);
  }

  // the only thing displayed by this function is an error popup
  return (
    <>
      {mode == GENERATIONMODE.record && recordHandle ? (
        <Record
          recordHandle={recordHandle}
          sourceData={sourceData.current}
          sampleRate={SAMPLERATE}
          playbackLength={recordLength.current}
          recordFormat={recordFormat as string}
          setMode={setMode}
        />
      ) : null}

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
    </>
  );
}
