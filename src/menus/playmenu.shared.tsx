// Uses a Web Worker to prepare the audio and image from the
// generators selected

import { useCMGContext } from "cmgcontext";
import readyPlay from "playfunctions/readyplay";
import Report from "playfunctions/reportwriter/report";
import { ReactNode, useEffect } from "react";
import { renderToString } from "react-dom/server";
import { useHotkeys } from "react-hotkeys-hook";
import { SAMPLERATE, PlayData } from "types";
import { useAudioWorkerShared } from "../hooks/useAudioWorkerShared";

export default function PlayMenu() {
  const {
    setCursor,
    fileContents,
    setStatus,
    timeInterval,
    screenWidth,
    screenHeight,
    recordFormat,
    setPlayData,
  } = useCMGContext();

  const {
    startProcessing,
    cancelProcessing,
    isProcessing,
    progress,
    sharedBuffers,
    audioBlob,
    image,
    voiceHues,
    error,
  } = useAudioWorkerShared();

  // Handle result when processing completes
  useEffect(() => {
    if (audioBlob && image && voiceHues && sharedBuffers) {
      // The audio buffers are in shared memory - no copying needed!
      const playData: PlayData = {
        audioBuffer: sharedBuffers.audioChannels,
        audio: audioBlob,
        image,
        voiceHues,
      };

      // this will cause the <Play> component to be displayed
      setPlayData(playData);
      setCursor("default");
    }
  }, [audioBlob, image, voiceHues, sharedBuffers]);

  // Handle errors
  useEffect(() => {
    if (error) {
      setStatus(error);
      setPlayData(null);
      setCursor("default");
    }
  }, [error]);

  // Update status with progress
  useEffect(() => {
    if (progress) {
      setStatus(`${progress.message} (${Math.round(progress.progress)}%)`);
    }
  }, [progress]);

  // Update cursor based on processing state
  useEffect(() => {
    setCursor(isProcessing ? "wait" : "default");
  }, [isProcessing]);

  useHotkeys(
    "ctrl+p",
    () => {
      handleReadyPlay();
    },
    { preventDefault: true },
  );

  useHotkeys(
    "ctrl+r",
    () => {
      handleReport();
    },
    { preventDefault: true },
  );

  useHotkeys(
    "ctrl+x",
    () => {
      cancelProcessing();
    },
    { preventDefault: true },
  );

  // filter the generators and determine the length of the audio
  async function handleReadyPlay() {
    const { generators, duration, error } = readyPlay({
      generator: null,
      fileContents,
      timeInterval,
    });

    // catch any errors while selecting generators
    setStatus(error);
    if (error != "") {
      setPlayData(null);
      setCursor("default");
      return;
    }

    // tell the UI that things are in progress
    setCursor("wait");

    // Start processing in the worker with shared buffers
    startProcessing({
      generators,
      duration,
      sampleRate: SAMPLERATE,
      recordFormat,
      timeInterval,
      windowWidth: screenWidth,
      windowHeight: screenHeight - 40,
    });
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
          if (!handle) return;
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
      setStatus(
        `Exception error while writing the report ${(e as Error).message}`,
      );
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
            {!isProcessing && (
              <a className="dItem" onClick={() => handleReadyPlay()}>
                Play... (ctrl+p)
              </a>
            )}
            {!isProcessing && (
              <a className="dItem" onClick={() => handleReport()}>
                Report... (ctrl+r)
              </a>
            )}
            {isProcessing && (
              <a className="dItem" onClick={() => cancelProcessing()}>
                Cancel Play (ctrl+x)
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
