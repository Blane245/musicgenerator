// the body of the CMG page. It contains the track
// information is a scrollable
import { useCMGContext } from "cmgcontext";
import TracksDisplay from "components/tracksdisplay";
export default function Body() {
  const { bodyHeight, displayWidth} = useCMGContext();

  return (
    <div className="page-body" style={{ width: displayWidth, height: bodyHeight }}>
      <TracksDisplay/>
    </div>
  );
}
