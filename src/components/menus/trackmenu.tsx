import { MouseEvent } from "react";
import Track from "../../classes/track";
import { useCMGContext } from "../../contexts/cmgcontext";
import { addTrack } from "../../utils/cmfiletransactions";

export default function TrackMenu() {
  const { fileContents, setFileContents, setStatus, playing } = useCMGContext();

  function handleNewTrack(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    // find a track number that is unique, start wiith the next number
    let next = fileContents.tracks.length + 1;
    let found: boolean = false;
    const tracks: Track[] = fileContents.tracks;
    while (!found) {
      const index = tracks.findIndex((t) =>
        (t.name == 'T'.concat(next.toString())))
      if (index < 0) {
        found = true;
      }
      else {
        next++;
      }
    }
    // create a track with this name;
    const newTrack = new Track(next);
    // and added to the file
    addTrack (newTrack, setFileContents);
    setStatus(`Track ${newTrack.name}' Added`)
  }

  return (
    <fieldset disabled={playing.current?.on} style={{width:'30em'}}>
      <button
        onClick={e => handleNewTrack(e)}
      >New Track...</button>
    </fieldset>
  );

}