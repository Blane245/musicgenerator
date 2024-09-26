import { MouseEvent } from "react";
import CMGFile from "../../classes/cmgfile";
import Track from "../../classes/track";

export interface TrackMenuProps {
  fileContents: CMGFile,
  setFileContents: Function,
  setMessage: Function,
  setStatus: Function,
}

export default function TrackMenu(props: TrackMenuProps) {
  const { fileContents, setFileContents, setMessage, setStatus } = props;

  function handleNewTrack(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const next = fileContents.tracks.length + 1;
    const newTrack = new Track(next);
    setFileContents((c: CMGFile) => {
      const newC: CMGFile = c.copy();
      newC.tracks.push(newTrack);
      newC.dirty = true;
      setStatus('New Track Added')
      return newC;
    })
  }

  return (
    <>
      <button
        onClick={e => handleNewTrack(e)}
      >New Track...</button>
    </>
  );

}