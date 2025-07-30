import TimeLine from "classes/timeline";
import numeral from "numeral";
import { TimeLineScales, TimeTicks } from "types";

export default function getTickLinesandLabels(
  timeline: TimeLine,
  ticks: TimeTicks,
): JSX.Element[] {
  const result: JSX.Element[] = [];
  // ticks
  const tickCount = ticks.tickCount;
  const labelCount: number = ticks.majorTickCount;
  if (tickCount == 0 || labelCount == 0) return [];
  for (let i = 0; i <= tickCount; i++) {
    result.push(
      <line
        key={"tickline-" + i}
        x1={i * ticks.tickSpacing}
        x2={i * ticks.tickSpacing}
        y1={timeline.height}
        y2={timeline.height - ticks.tickHeight}
        stroke={"black"}
      />
    );
  }
  //labels
  const extent: number = TimeLineScales[timeline.currentZoomLevel].extent;
  const labelSize: string = ticks.labelSize.toString() + "px";
  for (let i = 0; i <= labelCount; i++) {
    const tValue: number = timeline.startTime + i * (extent / labelCount);
    const tText = numeral(tValue).format(ticks.labelFormat);
    let tAnchor: string = "middle";
    if (i == 0) tAnchor = "start";
    if (i == labelCount) tAnchor = "end";
    result.push(
      <text
        key={"ticktext-" + i}
        x={i * timeline.width / labelCount}
        y={ticks.labelSize}
        fontSize={labelSize}
        textAnchor={tAnchor}
        stroke={"black"}
        fontWeight={"lighter"}
      >
        {tText}
      </text>
    );
  }
  return result;
}
