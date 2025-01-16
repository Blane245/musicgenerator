// https://github.com/Blane245/musicgenerator/issues/5#issue-2550789485

// turn the sound generators into a preview or recording based on
// which generators are selected and which mode is selected
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
  // mode changes to anything but idle
  const sourceData = useRef<RawSourceData[]>([]);
  const recordLength = useRef<number>(0);
  useEffect(() => {
    if (mode == GENERATIONMODE.idle) return;

    // determine the selected generators and make sure they are ready to generate sound
    const {
      SFPGenerators,
      SFRGenerators,
      NoiseGenerators,
      AudioFileGenerators,
      WienerGenerators,
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
    // console.log("playback length ", playbackLength);

    // build the generator sources
    recordLength.current = playbackLength;
    sourceData.current = buildSources({
      SFPGenerators,
      SFRGenerators,
      NoiseGenerators,
      AudioFileGenerators,
      WienerGenerators,
    });

    // let the system know that playing if entered
    playing.current = true;

    // select either preview or recording
    // preview is here as a non-reactive function
    // recording is reactive as there is a progress bar
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
    // console.log("mode is", mode, "record handle is ", recordHandle);
  }, [mode]);

  function handleErrorClose() {
    setError("");
    setMode(GENERATIONMODE.idle);
    setStatus(``);
  }

  // the only thing displayed by this function is an error popup
  // recording has its own progress bar
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
