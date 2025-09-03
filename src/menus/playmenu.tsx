// The file menu handles creating new files, opening existing ones,
// saving current ones, and adding tracks to current ones
import { useCMGContext } from "cmgcontext";
import { buildSources } from "generation/buildsources";
import ReadyGenerate from "generation/readygenerate";
import Record from "generation/record";
import Report from "generation/reportwriter/report";
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { useHotkeys } from "react-hotkeys-hook";
import { GENERATIONMODE, SAMPLERATE } from "types";

export default function PlayMenu() {
  const {
    fileContents,
    setStatus,
    recordFormat,
    playing,
    mode,
    setMode,
    playbackLength,
    setPlaybackLength,
    setOffsetTime,
    sourceData,
    setSourceData,
    timeInterval,
    setGeneratorDialogVisible,
  } = useCMGContext();

  const [recordHandle, setRecordHandle] = useState<FileSystemFileHandle | null>(
    null
  );
  // a couple of hot keys are supported for preview and record
  useHotkeys("ctrl+p", (event) => {
    event.preventDefault();
    if (!playing.current) handlePreview;
  });

  useHotkeys("ctrl+r", (event) => {
    event.preventDefault();
    if (!playing.current) handleRecord;
  });

  // handle request to create a new file
  // If the curretn one is 'dirty' the user is
  // prompted to confirm overwrite
  function handlePreview() {
    playing.current = true;
    setMode(GENERATIONMODE.preview);
  }

  // handle request to open a file.
  // if the current one is 'dirty' the user is asked to confirm over-write
  function handleRecord() {

    // display a dialog for selecting a file with and without overwrite allowed
    const types: FilePickerAcceptType[] =
      recordFormat == "mp3"
        ? [{ description: "MP3 file", accept: { "audio/mp3": [".mp3"] } }]
        : [{ description: "WAV file", accept: { "audio/wav": [".wav"] } }];
    window.showSaveFilePicker({ types: types }).then((rh) => {
      setRecordHandle(rh);
      if (rh) playing.current = true;
    });
  }

  function handleReport() {
    writeReport();
  }

  function handleStop() {
    playing.current = false;
    setStatus("Stopped recording");
  }

  // parse the generators and prepare for recording or previewing
  function handleReadyPlay(playMode: GENERATIONMODE) {
    // determine the selected generators and make sure they are ready to generate sound
    const {
      AlgorithmicGenerators,
      AudioFileGenerators,
      SilentGenerators,
      error,
    } = ReadyGenerate({
      mode: playMode,
      generator: null,
      fileContents,
      timeInterval,
    });

    // catch any errors will selecting generators
    setStatus(error);
    if (error != "") return;

    if (playMode == GENERATIONMODE.record) handleRecord();

    // build the generator sources
    const { sources: builtSourceData, error: buildError } = buildSources({
      AlgorithmicGenerators,
      AudioFileGenerators,
      SilentGenerators,
    });

    // catch any errors during build
    setStatus(buildError);
    if (buildError != "") return;
    setSourceData(builtSourceData);
    // let the system know that playing is entered
    if (playMode == GENERATIONMODE.preview) handlePreview();
    else setMode(GENERATIONMODE.record);
    // make sure that the generator dialog does not appear after preview or record
    setGeneratorDialogVisible(false);
  }

  function handleMenuSelect(action: string) {
    switch (action) {
      case "preview":
        handleReadyPlay(GENERATIONMODE.preview);
        break;
      case "record":
        handleReadyPlay(GENERATIONMODE.record);
        break;
      case "stop":
        handleStop();
        break;
      case "report":
        handleReport();
        break;
      default:
        break;
    }
  }

  return (
    <>
      <div className="navbar">
        <div className="dropdown">
          <div className="dropbtn">
            Play
            <i className="fa fa-caret-down"></i>
          </div>
          <div className="dropdown-one">
            {!playing.current ? (
              <a className="dItem" onClick={() => handleMenuSelect("preview")}>
                Preview
              </a>
            ) : null}
            {!playing.current ? (
              <a className="dItem" onClick={() => handleMenuSelect("record")}>
                Record
              </a>
            ) : null}
            {!playing.current ? (
              <a className="dItem" onClick={() => handleMenuSelect("report")}>
                Report...
              </a>
            ) : null}
            {playing.current ? (
              <a className="dItem" onClick={() => handleMenuSelect("stop")}>
                Stop
              </a>
            ) : null}
          </div>
        </div>
      </div>
      {mode == GENERATIONMODE.record &&
      recordHandle &&
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
    </>
  );
  function writeReport() {
    try {
      const page: HTMLElement | null = document.getElementById("page");
      // ask for a file
      window
        .showSaveFilePicker({
          types: [
            {
              description: "Computer Music Generator Report File",
              accept: { "application/html": [".html"] },
            },
          ],
        })
        .then(async (handle) => {
          if (page) page.inert = true;
          // build the html for the file contents
          const theReport: React.ReactNode = Report({
            fileContents: fileContents,
          });
          const out: string = renderToString(theReport);
          try {
            const writeable: FileSystemWritableFileStream =
              await handle.createWritable();
            await writeable.write(out);
            await writeable.close();
            if (page) page.inert = false;
          } catch (err) {
            if (page) page.inert = false;
            const e = err as Error;
            setStatus(
              `Error saving cmg file, type: '${e.name}' message: '${e.message}'`
            );
          }
        });
    } catch (_) {}
  }
}
