// display a track's controls and time line
// the time line contains the visible generator icons
import { useEffect, useRef, useState } from "react";
import Track from "../classes/track";
import { useCMGContext } from "../cmgcontext";
import GeneratorDialog from "../dialogs/generatordialog";
import GeneratorIcons from "./generatoricons";
import TrackControls from "./trackcontrols";

export default function TracksDisplay() {
  const { fileContents, timeLine, generatorType } = useCMGContext();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [enableGeneratorDialog, setEnableGeneratorDialog] =
    useState<number>(-1);
  const trackRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    setTracks(fileContents.tracks);
    setEnableGeneratorDialog(-1);
  }, [fileContents.tracks]);

  function closeTrackGenerator() {
    setEnableGeneratorDialog(-1);
  }

  return (
    <>
      {tracks.map((t, i) => {
        return (
          <>
            <TrackControls
              key={`track-control:${t.name}`}
              tracks={tracks}
              track={t}
              trackIndex={i}
              setEnableGeneratorDialog={setEnableGeneratorDialog}
            />
            <div
              className="page-track-display"
              key={`track-display:${t.name}`}
              id={`track-display:${t.name}`}
              ref={(el: HTMLDivElement) => {
                trackRef.current[i] = el;
                return el;
              }}
              style={{ width: timeLine.width }}
            >
              <GeneratorIcons track={t} key={`track-generators:${t.name}`} />
            </div>
          </>
        );
      })}
      <GeneratorDialog
        key={`generator-dialog`}
        track={tracks[enableGeneratorDialog]}
        generatorType={generatorType}
        generatorIndex={-1}
        setGeneratorIndex={() => {}}
        closeTrackGenerator={closeTrackGenerator}
        open={enableGeneratorDialog >= 0}
        setOpen={() => {
          setEnableGeneratorDialog(-1);
        }}
      />
    </>
  );
}
