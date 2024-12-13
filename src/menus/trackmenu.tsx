import { MouseEvent } from "react";
import Track from "../classes/track";
import { useCMGContext } from "../cmgcontext";
import { addTrack } from "../utils/cmfiletransactions";
import { getTrackUID } from "../utils/gettrackuid";

export default function TrackMenu() {
  const { fileContents, setFileContents, setStatus, playing } = useCMGContext();

  function handleNewTrack(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    // find a track number that is unique, start wiith the next number
    const next = getTrackUID(fileContents.tracks);

    // create a track with this UID;
    const newTrack = new Track(next);
    // and added to the file
    addTrack(newTrack, setFileContents);
    setStatus(`Track ${newTrack.name}' Added`);
  }

  return (
    <fieldset disabled={playing.current?.on} style={{ width: "30em" }}>
      <button onClick={(e) => handleNewTrack(e)}>New Track</button>
    </fieldset>
  );
}
