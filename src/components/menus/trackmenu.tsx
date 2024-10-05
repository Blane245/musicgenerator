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
    // https://github.com/Blane245/musicgenerator/issues/3
    setFileContents((c: CMGFile) => {
      const newC: CMGFile = structuredClone<CMGFile>(c);
      // only do this if there is not already a track in the
      // file with the same name - 
      console.log('new track being added', newTrack.name, 'current track count', c.tracks.length);
      // prevent a duplicate traqck from being added (not sure why a duplicate is being attempted
      const existingTrack = newC.tracks.findIndex((t) => (t.name == newTrack.name));
      if (existingTrack < 0) {
        newC.tracks.push(newTrack);
        newC.dirty = true;
        setStatus('New Track Added')
      } else {
        console.log('attempt to added duplicate track', newTrack.name)
      }
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