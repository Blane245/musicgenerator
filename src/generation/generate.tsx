// turn the sound generators into a preview or recording based on
// which generators are selected and which mode is selected
import { useEffect, useRef, useState } from "react";
import { useCMGContext } from "../cmgcontext";
import {
  GENERATIONMODE,
  GeneratorType,
  RawSourceData,
  SAMPLERATE,
} from "types";
import { buildSources } from "./buildsources";
import Preview2 from "../layouts/preview2";
import ReadyGenerate from "./readygenerate";
import Record from "./record";

export interface GeneratorProps {
  setRecordHandle?: Function;
  recordFormat?: string;
  recordHandle?: FileSystemFileHandle | null;
  generator: GeneratorType | null;
}
export default function Generate(props: GeneratorProps) {
  const { setRecordHandle, recordFormat, recordHandle, generator } = props;
  const { setStatus, playing, mode, setMode, fileContents, timeInterval } =
    useCMGContext();
  const [error, setError] = useState<string>("");
  const [playbackLength, setPlaybackLength] = useState<number>(0);
  const [offsetTime, setOffsetTime] = useState<number>(0);

  // all of the work of the generator is done by this hook when the
  // mode changes to anything but idle
  // const [sourceData, setSourceData] = useState<RawSourceData[]>([]);
  const [sourceData, setSourceData] = useState<RawSourceData[]>([]);
  useEffect(() => {
    if (mode == GENERATIONMODE.idle) return;

    // determine the selected generators and make sure they are ready to generate sound
    const {
      AlgorithmicGenerators,
      AudioFileGenerators,
      SilentGenerators,
      playbackLength,
      offsetTime,
      error,
    } = ReadyGenerate({
      mode,
      generator,
      fileContents,
      timeInterval,
    });
    setPlaybackLength(playbackLength);
    setOffsetTime(offsetTime);

    // catch any errors will selecting generators
    setError(error);
    if (error != "") return;

    // build the generator sources
    const { sources: builtSourceData, error: buildError } = buildSources({
      AlgorithmicGenerators,
      AudioFileGenerators,
      SilentGenerators,
    });

    // catch any errors during build
    setError(buildError);
    if (buildError != "") return;
    setSourceData(builtSourceData);
    // let the system know that playing if entered
    playing.current = true;

    // select either preview or recording
    // preview is here as a non-reactive function
    // recording is reactive as there is a progress bar
    // if (mode == GENERATIONMODE.preview || mode == GENERATIONMODE.solo)
    //   Preview({
    //     fileContents,
    //     playbackLength,
    //     offsetTime,
    //     sourceData: sourceData.current,
    //     setMode,
    //     playing,
    //     setTimeProgress,
    //     setGeneratorsPlaying,
    //     setStatus,
    //     setSignalLevels,
    //   });
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
      {mode == GENERATIONMODE.record &&
      recordHandle && setRecordHandle &&
      sourceData.length > 0 ? (
        <Record
          recordHandle={recordHandle}
          setRecordHandle={setRecordHandle}
          sourceData={sourceData}
          sampleRate={SAMPLERATE}
          playbackLength={playbackLength}
          recordFormat={recordFormat as string}
          setMode={setMode}
        />
      ) : null}
      {(mode == GENERATIONMODE.preview || mode == GENERATIONMODE.solo) &&
      sourceData.length > 0 ? (
        <Preview2
            appName="Computer Music Generator"
            appVersion={import.meta.env.VERSION}
          playbackLength={playbackLength}
          offsetTime={offsetTime}
          sourceData={sourceData}
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
