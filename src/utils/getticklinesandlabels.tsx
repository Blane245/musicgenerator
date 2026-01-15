import TimeLine from "classes/timeline";
import numeral from "numeral";
import { TimeLineScales, TIMELINETYPE, TimeTicks } from "types";
import { linearInterpolate } from "./interpolation";
import { measureScaling } from "./measurescaling";

// timeline is either displaying time or measures
export default function getTickLinesandLabels(
  timeLine: TimeLine,
  ticks: TimeTicks,
  width: number,
): JSX.Element[] {
  const result: JSX.Element[] = [];

  // time mode
  if (timeLine.mode == TIMELINETYPE.Time) {
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
          y1={timeLine.height}
          y2={timeLine.height - ticks.tickHeight}
          stroke={"black"}
        />
      );
    }
    //labels
    const extent: number = TimeLineScales[timeLine.currentZoomLevel].extent;
    const labelSize: string = ticks.labelSize.toString() + "px";
    for (let i = 0; i <= labelCount; i++) {
      const tValue: number = timeLine.startTime + i * (extent / labelCount);
      const tText = numeral(tValue).format(ticks.labelFormat);
      let tAnchor: string = "middle";
      if (i == 0) tAnchor = "start";
      if (i == labelCount) tAnchor = "end";
      result.push(
        <text
          key={"ticktext-" + i}
          x={(i * timeLine.width) / labelCount}
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
    const {
      startTickPosition,
      endTickPosition,
      startTickNumber,
      endTickNumber,
    } = measureScaling({
      startTime: timeLine.startTime,
      timeExtent: TimeLineScales[timeLine.currentZoomLevel].extent,
      positionWidth: width,
      measureTime: timeLine.measureSize,
      beatsPerMeasure: timeLine.beatsPerMeasure,
    });
    // console.log('start and end tick numbers', startTickNumber, endTickNumber, 'start and end tick positions', startTickPosition, endTickPosition);
    // loop through all of the tick, applying labels at the start of each measure
    for (let i = startTickNumber; i <= endTickNumber; i++) {
      // draw a tick at this tick location
      const x: number = linearInterpolate(
        i,
        startTickNumber,
        endTickNumber,
        startTickPosition,
        endTickPosition
      );
      // add the label and major tick when on a measure
      if (i % timeLine.beatsPerMeasure == 0) {
        result.push(
          <line
            key={"tickline" + i}
            x1={x}
            x2={x}
            y1={timeLine.height}
            y2={0}
            stroke={"black"}
          />
        );
        // add the label
        const tAnchor: string = "start";

        result.push(
          <text
            key={"ticktext-" + i}
            x={x + 5}
            y={10}
            fontSize={timeLine.height / 3}
            textAnchor={tAnchor}
            stroke="black"
            fontWeight={"lighter"}
          >
            {(i / timeLine.beatsPerMeasure + 1).toString()}
          </text>
        );
      } else {
        // add the subdivision ticks
        result.push(
          <line
            key={"tickline" + i}
            x1={x}
            x2={x}
            y1={timeLine.height}
            y2={timeLine.height / 2}
            stroke={"black"}
          />
        );
      }
    }
    return result;
  }
}
