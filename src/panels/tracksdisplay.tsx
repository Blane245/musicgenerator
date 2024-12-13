//TODO implement defining a generator by click/dragging in the timeline
import { useEffect, useRef, useState } from "react";
import Track from "../classes/track";
import GeneratorDialog from "../dialogs/generatordialog";
import GeneratorIcons from "./generatoricons";
import { useCMGContext } from "../cmgcontext";
import TrackControlsDisplay from "./trackcontrolsdisplay";
export default function TracksDisplay() {
  const { fileContents } = useCMGContext();
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
            <TrackControlsDisplay
              tracks={tracks}
              track={t}
              trackIndex={i}
              setEnableGeneratorDialog={setEnableGeneratorDialog}
            />
            <div
              className="page-track-display"
              key={"track-display:" + t.name}
              id={"track-display:" + t.name}
              ref={(el: HTMLDivElement) => {
                trackRef.current[i] = el;
                return el;
              }}
            >
              <GeneratorIcons track={t} trackIndex={i} elementRef={trackRef} />
            </div>
          </>
        );
      })}
      <GeneratorDialog
        track={tracks[enableGeneratorDialog]}
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
