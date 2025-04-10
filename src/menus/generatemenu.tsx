// The file menu handles creating new files, opening existing ones,
// saving current ones, and adding tracks to current ones
import { useState } from "react";
import { renderToString } from "react-dom/server";
import { useCMGContext } from "../cmgcontext";
import Generate from "../generation/generate";
import Report from "../generation/reportwriter/report";
import { GENERATIONMODE } from "../types";

export default function GenerateMenu() {
  const { fileContents, setStatus, recordFormat, playing } = useCMGContext();

  const [mode, setMode] = useState<GENERATIONMODE>(GENERATIONMODE.idle);
  const [recordHandle, setRecordHandle] = useState<FileSystemFileHandle | null>(
    null
  );

  // handle request to create a new file
  // If the curretn one is 'dirty' the user is
  // prompted to confirm overwrite
  function handlePreview() {
    setMode(GENERATIONMODE.preview);
    setStatus("Previewing file");
  }

  // handle request to open a file.
  // if the current one is 'dirty' the user is asked to confirm over-write
  function handleRecord() {
    setMode(GENERATIONMODE.record);
    const types: FilePickerAcceptType[] =
      recordFormat == "mp3"
        ? [{ description: "MP3 file", accept: { "audio/mp3": [".mp3"] } }]
        : [{ description: "WAV file", accept: { "audio/wav": [".wav"] } }];
    window.showSaveFilePicker({ types: types }).then((rh) => {
      setRecordHandle(rh);
    });
  }

  function handleReport() {
    writeReport();
  }

  function handleStop() {
    playing.current = false;
    setStatus("Stopped recording");
  }

  function handleMenuSelect(action: string) {
    switch (action) {
      case "preview":
        handlePreview();
        break;
      case "record":
        handleRecord();
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
      <fieldset>
        <div className="navbar">
          <div className="dropdown">
            <div className="dropbtn">
              Generate
              <i className="fa fa-caret-down"></i>
            </div>
            <div className="dropdown-one">
              {!playing.current ? (
                <a
                  className="dItem"
                  onClick={() => handleMenuSelect("preview")}
                >
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
        <Generate
          mode={mode}
          setMode={setMode}
          setRecordHandle={setRecordHandle}
          recordFormat={recordFormat}
          recordHandle={recordHandle}
          generator={null}
        />
      </fieldset>
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
          const theReport: React.ReactNode = Report({fileContents:fileContents} );
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
