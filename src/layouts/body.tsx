// the body of the CMG page. It contains the track
// information is a scrollable
import { useEffect, useState } from "react";
import { useCMGContext } from "../cmgcontext";
import TracksDisplay from "../panels/tracksdisplay";
export default function Body() {
  const { bodyHeight, displayWidth, setStatus } = useCMGContext();

  useEffect(() => {
    setStatus("");
  }, []);

  return (
      <div className="body" style={{width: displayWidth, height: bodyHeight}}>
        <TracksDisplay />
      </div>
  );
}
