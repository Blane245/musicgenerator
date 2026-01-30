// display a track's controls and time line
// the time line contains the visible generator icons
import Track from "classes/track";
import { useCMGContext } from "cmgcontext";
import React, { useEffect, useState } from "react";
import GeneratorIcons from "./generatoricons";
import TrackControls from "./trackcontrols";

export default function TracksDisplay() {
  const { fileContents, timelineWidth, controlWidth, setTrackIndex } =
    useCMGContext();
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    setTracks(fileContents.tracks);
    setTrackIndex(-1);
  }, [fileContents.tracks, setTrackIndex]);

  return (
    <>
      {tracks.map((t, i) => (
        <React.Fragment key={`track-${t.name}`}>
          <div className="track-control" style={{ width: controlWidth }}>
            <TrackControls tracks={tracks} track={t} trackIndex={i} />
          </div>
          <div
            className="track-display"
            id={`track-display:${t.name}`}
            style={{ width: timelineWidth }}
          >
            <GeneratorIcons track={t} trackIndex={i} />
          </div>
        </React.Fragment>
      ))}
    </>
  );
}
