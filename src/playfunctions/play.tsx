// turn the sound generators into a preview or recording based on
// which generators are selected and which mode is selected
import { useCMGContext } from "cmgcontext";
import Preview from "playfunctions/preview";
import { useEffect, useState } from "react";
import {
  PLAYMODE,
  GeneratorType,
  RawSourceData,
  SAMPLERATE,
} from "types";
import { buildSources } from "./buildsources";
import ReadyPlay from "./readyplay";
import Record from "./record";

export interface PlayProps {
  setRecordHandle?: Function;
  recordFormat?: string;
  recordHandle?: FileSystemFileHandle | null;
  generator: GeneratorType | null;
}
export default function Play(props: PlayProps) {
  const { setRecordHandle, recordFormat, recordHandle, generator } = props;
  const { setStatus, playing, mode, setMode, fileContents, timeInterval } =
    useCMGContext();
  const [error, setError] = useState<string>("");

  // all of the work of the generator is done by this hook when the
  // mode changes to anything but idle
  // const [sourceData, setSourceData] = useState<RawSourceData[]>([]);
  const [sourceData, setSourceData] = useState<RawSourceData[]>([]);
  useEffect(() => {
    if (mode == PLAYMODE.idle) return;

    // determine the selected generators and make sure they are ready to generate sound
    const {
      AlgorithmicGenerators,
      AudioFileGenerators,
      SilentGenerators,
      error,
    } = ReadyPlay({
      mode,
      generator,
      fileContents,
      timeInterval,
    });
    
    // catch any errors will selecting generators
    setError(error);
    if (error != "") return;

    // build the generator sources
    const { sources: builtSourceData, error: buildError } = buildSources({
      fileContents,
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
  }, [mode]);

  function handleErrorClose() {
    setError("");
    setMode(PLAYMODE.idle);
    setStatus(``);
  }

  // the only thing displayed by this function is an error popup
  // recording has its own progress bar
  return (
    <>
      {mode == PLAYMODE.record &&
      recordHandle &&
      setRecordHandle &&
      sourceData.length > 0 ? (
        <Record
          recordHandle={recordHandle}
          setRecordHandle={setRecordHandle}
          sourceData={sourceData}
          sampleRate={SAMPLERATE}
          recordFormat={recordFormat as string}
          setMode={setMode}
        />
      ) : null}
      {(mode == PLAYMODE.preview || mode == PLAYMODE.solo) &&
      sourceData.length > 0 ? (
        <Preview
          appName="Computer Music Generator"
          appVersion={import.meta.env.VERSION}
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
