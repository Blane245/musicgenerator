import { MutableRefObject } from "react";
import { GENERATIONMODE, SourceData } from "../types";
import { bufferToWave } from "../utils/buffertowave";

export interface RecordProps {
  context: OfflineAudioContext;
  sourceData: SourceData[];
  setMode: Function;
  setStatus: Function;
  playing: MutableRefObject<boolean>;
}
export default function Record(params: RecordProps): void {
  const { context, sourceData, setMode, setStatus, playing } = params;

  try {
    window
      .showSaveFilePicker({
        types: [
          {
            description: "Audio file",
            accept: { "audio/wav": [".wav"] },
          },
        ],
      })
      .then((rh: FileSystemFileHandle) => {
        // and provide all sources their start and duration times
        sourceData.forEach((s) => {
          s.source.start(s.gen.startTime, 0, s.duration);
        });

        // render the sources
        (context as OfflineAudioContext)
          .startRendering()
          .then((renderBuffer: AudioBuffer) => {
            // build the blob and write it to the selected file
            rh.createWritable().then((accessHandle) => {
              const blob: Blob = bufferToWave(
                renderBuffer,
                (context as OfflineAudioContext).length
              );
              accessHandle.write(blob);
              accessHandle.close();
              setStatus(`Audio written to ${rh.name}`);
              setMode(GENERATIONMODE.idle);
              playing.current = false;
            });
          });
      });
  } catch {
    setMode(GENERATIONMODE.idle);
  }
}
