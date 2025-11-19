import TimeLine from "classes/timeline";
import { useCMGContext } from "cmgcontext";
import { TimeTicks } from "types";
import getTickLinesandLabels from "utils/getticklinesandlabels";

interface TimelineProps {
  previewTimeline: React.MutableRefObject<TimeLine | null>;
  ticks: TimeTicks;
}
export default function Timeline(props: TimelineProps): JSX.Element {
  const { previewTimeline, ticks } = props;
  const {displayWidth, timelineHeight} = useCMGContext();
  return (
    <div
      className="timeline"
      style={{ width: displayWidth, height: timelineHeight }}
    >
      {!!previewTimeline.current && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={displayWidth}
          height={timelineHeight}
          viewBox={`0 0 ${displayWidth} ${timelineHeight}`}
        >
          <rect
            id="timeline"
            x={0}
            y={0}
            width={displayWidth}
            height={timelineHeight}
            fill="white"
          />
          <path stroke="black" d={`m 0 ${timelineHeight} H ${displayWidth}`} />
          {getTickLinesandLabels(previewTimeline.current, ticks, displayWidth)}
        </svg>
      )}
    </div>
  );
}
