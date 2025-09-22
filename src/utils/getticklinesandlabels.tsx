import TimeLine from "classes/timeline";
import numeral from "numeral";
import { TimeLineScales, TIMELINETYPE, TimeTicks } from "types";
import { linearInterpolate } from "./interpolation";


// timeline is either displaying time or measures
export default function getTickLinesandLabels(
  timeline: TimeLine,
  ticks: TimeTicks,
  width: number,
): JSX.Element[] {
  const result: JSX.Element[] = [];

  // time mode
  if (timeline.mode == TIMELINETYPE.Time) {
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
} else {
  // measure mode
  // measure ticks
  const startTime: number = timeline.startTime;
  const extent: number = TimeLineScales[timeline.currentZoomLevel].extent;
  const measureSize: number = timeline.measureSize;
  const startMeasure: number = startTime / measureSize;
  const endMeasure: number = (startTime + extent) / measureSize;
  for (let i = startMeasure; i < endMeasure; i++) {
    // draw a tick at this measurement location and add a label 
    const x: number = linearInterpolate(i * measureSize, startMeasure, endMeasure, 0, width);
    // add the subdivision ticks
    result.push(
      <line
        key={'tickline'+i}
        x1={x}
        x2={x}
        y1={timeline.height}
        y2={0}
        stroke={"black"}
        />
    );
      // add the label
    let tAnchor: string = "start";

    result.push(
      <text 
        key={'ticktext-' + i}
        x={x+5}
        y={10}
        fontSize={timeline.height / 3}
        textAnchor={tAnchor}
        stroke="black"
        fontWeight={'lighter'}
      >
        {(i+1).toString()}
        </text>
    )
    // add the subdivision ticks
    for (let j = 1; j < timeline.beatsPerMeasure; j++) {
      const x: number = linearInterpolate((i + j / timeline.beatsPerMeasure) * measureSize,  startMeasure, endMeasure, 0, width)
    result.push(
      <line
        key={'beatline'+i+'-'+j}
        x1={x}
        x2={x}
        y1={timeline.height}
        y2={timeline.height / 2}
        stroke={"black"}
        />
    );
    }
  }
  return result;
}
}
