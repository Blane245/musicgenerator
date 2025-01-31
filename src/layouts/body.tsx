// the body of the CMG page. It contains the track
// information is a scrollable
import { useEffect, useState } from "react";
import { useCMGContext } from "../cmgcontext";
import TracksDisplay from "../panels/tracksdisplay";
import { Preset } from "../sfcomponents/types";
type BodyProps = {
  top: number;
}
export default function Body(props: BodyProps) {
  const { bodyHeight, screenWidth, fileContents, setStatus, setPresets } = useCMGContext();

  const [height, setHeight] = useState<number>(bodyHeight);
  const [width, setWidth] = useState<number>(screenWidth);

  useEffect(() => {
    setHeight(bodyHeight);
    setWidth(screenWidth);
  }, [bodyHeight, screenWidth])

  useEffect(() => {
    setStatus("");
  }, []);

  // load the presets (bank and presets) for the soundfont file
  useEffect(() => {
    if (fileContents.SoundFont) {
      setPresets(fileContents.SoundFont.presets as Preset[]);
    }
  }, [fileContents.SoundFont]);

  // the top of the page body is the height of the page header
  return (
    <div className="page-body"
    style={{height:height, width:width, top: props.top}}
    >
      <TracksDisplay />
    </div>
  );
}
