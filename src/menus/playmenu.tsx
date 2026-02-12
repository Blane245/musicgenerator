// The file menu handles creating new files, opening existing ones,
// saving current ones, and adding tracks to current ones
import { useCMGContext } from "cmgcontext";
import buildSourceData from "playfunctions/buildsourcedata";
import Play from "playfunctions/play";
import Report from "playfunctions/reportwriter/report";
import { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { useHotkeys } from "react-hotkeys-hook";
import { PLAYMODE } from "types";

export default function PlayMenu() {
  const {
    setCursor,
    fileContents,
    setStatus,
    mode,
    setMode,
    timeInterval,
    setGeneratorDialogVisible,
    sourceData,
    setSourceData,
    screenWidth,
    screenHeight,
    recordFormat,
  } = useCMGContext();

  // play and report hot keys
  useHotkeys(
    "ctrl+p",
    () => {
      handleReadyPlay(PLAYMODE.play);
    },
    { preventDefault: true },
  );

  // parse the generators and prepare for playing
  // this will build all of the generator samples and put the source graphic on the chart
  async function handleReadyPlay(playMode: PLAYMODE) {
    // determine the selected generators and make sure they are ready to generate sound
    // also build their samples and graphics
    setCursor("waiting");
    const { sourceData, error } = await buildSourceData({
      mode: playMode,
      generator: null,
      fileContents,
      timeInterval,
      windowWidth: screenWidth,
      windowHeight: screenHeight - 40,
      recordFormat,
    });

    // catch any errors while selecting generators
    setStatus(error);
    if (error != "") {
      setMode(PLAYMODE.idle);
      setCursor("default");
      return;
    }

    // let the system know that playing is entered
    setSourceData(sourceData);
    setMode(PLAYMODE.play);
    setCursor("default");
    // make sure that the generator dialog does not appear after play
    setGeneratorDialogVisible(false);
  }

  function handleReport() {
    try {
      // ask for a file suggesting the cmg file name
      const cmgTypeIndex: number = fileContents.name.lastIndexOf(".cmg");
      let suggestedName = "output.html";
      if (cmgTypeIndex > 0) {
        const baseName = fileContents.name.substring(
          fileContents.name.lastIndexOf("\\") + 1,
          cmgTypeIndex,
        );
        suggestedName = baseName + ".html";
      }

      window
        .showSaveFilePicker({
          types: [
            {
              description: "Computer Music Generator Report File",
              accept: { "application/html": [".html"] },
            },
          ],
          suggestedName: suggestedName,
        })
        .then(async (handle) => {
          // build the html for the file contents
          const theReport: ReactNode = Report(fileContents);
          const out: string = renderToString(theReport);
          try {
            const writeable: FileSystemWritableFileStream =
              await handle.createWritable();
            await writeable.write(out);
            await writeable.close();
          } catch (err) {
            const e = err as Error;
            setStatus(
              `Error saving cmg file, type: '${e.name}' message: '${e.message}'`,
            );
          }
        });
    } catch (e) {
      throw new Error(`Error while writing the report ${(e as Error).message}`);
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
            <a className="dItem" onClick={() => handleReadyPlay(PLAYMODE.play)}>
              Play... (ctrl+p)
            </a>
            <a className="dItem" onClick={() => handleReport()}>
              Report...
            </a>
          </div>
        </div>
      </div>
      {!!(sourceData && mode == PLAYMODE.play) && <Play setMode={setMode} />}
    </>
  );
}
