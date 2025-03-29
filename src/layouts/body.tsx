// the body of the CMG page. It contains the track
// information is a scrollable
import { useEffect, useState } from "react";
import { useCMGContext } from "../cmgcontext";
import TracksDisplay from "../panels/tracksdisplay";
export default function Body() {
  const { bodyHeight, screenWidth, setStatus,} = useCMGContext();

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
  // the top of the page body is the height of the page header
  return (
    <div className="body"
    style={{height:height, width:width}}
    >
      <TracksDisplay />
    </div>
  );
}
