import TimeLine from "classes/timeline";
import { TIMEFORMATS, TimeLineScale, TimeLineScales, TimeTicks } from "types";

export default function updateTimeTicks (tl: TimeLine): TimeTicks | null {
    if (tl.currentZoomLevel >= 0 && tl.currentZoomLevel < TimeLineScales.length) {
        const scale: TimeLineScale = TimeLineScales[tl.currentZoomLevel];
        return ({
            majorTickCount: scale.majorDivisions,
            scaleExtent:scale.extent,
            tickCount: scale.majorDivisions * scale.minorDivisions,
            tickHeight: tl.height / 3.0,
            tickSpacing: tl.width / (scale.majorDivisions * scale.minorDivisions),
            labelSize: tl.height / 3.0,
            labelSpacing: tl.width / scale.majorDivisions,
            labelFormat: TIMEFORMATS[scale.format].value,
        })
    } else
        return null;
}