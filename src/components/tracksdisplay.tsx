// display a track's controls and time line
// the time line contains the visible generator icons
import { useCMGContext } from "cmgcontext";
import React, { useEffect } from "react";
import GeneratorIcons from "./generatoricons";
import TrackControls from "./trackcontrols";

export default function TracksDisplay() {
  const { fileContents, timelineWidth, controlWidth, setTrackIndex } =
    useCMGContext();
  // const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    // setTracks(fileContents.tracks);
    setTrackIndex(-1);
  }, [fileContents]);

  return (
    <>
      {fileContents.tracks.map((t, i) => (
        <React.Fragment key={`track-${t.name}`}>
          <div className="track-control" style={{ width: controlWidth }}>
            <TrackControls tracks={fileContents.tracks} track={t} trackIndex={i} />
          </div>
          <div
            className="track-display"
            style={{ width: timelineWidth }}
          >
            <GeneratorIcons track={t} trackIndex={i} />
          </div>
        </React.Fragment>
      ))}
    </>
  );
}
