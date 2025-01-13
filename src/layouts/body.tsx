// the body of the CMG page. It contains the track
// information is a scrollable
import { useEffect } from "react";
import { useCMGContext } from "../cmgcontext";
import TracksDisplay from "../panels/tracksdisplay";
import { Preset } from "../sfcomponents/types";

export default function Body() {
  const { fileContents, setStatus, setPresets } = useCMGContext();

  useEffect(() => {
    setStatus("");
  }, []);

  // load the presets (bank and presets) for the soundfont file
  useEffect(() => {
    if (fileContents.SoundFont) {
      setPresets(fileContents.SoundFont.presets as Preset[]);
    }
  }, [fileContents.SoundFont]);

  return (
    <div className="page-body">
      <TracksDisplay />
    </div>
  );
}
