import { useEffect, useRef, useState } from 'react';
import TimeLine from '../../classes/timeline';
import { TIMEFORMATS, TimeLineScale, TimeLineScales } from '../../types/types';
import numeral from 'numeral';
import { CiZoomIn, CiZoomOut } from "react-icons/ci";
export interface TimeLineDisplayProps {
    setMessage: Function,
    setStatus: Function,
    timeLine: TimeLine,
    setTimeLine: Function,
}

// render the timeline
export default function TimeLineDisplay(props: TimeLineDisplayProps) {
    const { timeLine, setTimeLine, setMessage, setStatus } = props;
    const timeLineRef = useRef(null);
    const [ticks, setTicks] = useState<{
        majorTickCount: number,
        scaleExtent: number,
        tickCount: number,
        tickHeight: number,
        tickSpacing: number,
        labelSize: number,
        labelSpacing: number,
        labelFormat: string,
    }>({
        majorTickCount: 0, tickCount: 0, tickHeight: 0,
        tickSpacing: 0, labelSize: 0, labelSpacing: 0,
        scaleExtent: 0, labelFormat: ''
    });

    // create the timeline object when the time line starts up
    useEffect(() => {
        if (timeLineRef && timeLineRef.current) {
            const width: number = timeLineRef.current.clientWidth || 0;
            const height: number = timeLineRef.current.clientHeight || 0;
            const newT = new TimeLine(width, height);
            setTimeLine(newT);
        }
    }, []);

    // capture the tick parameters when the zoom level changes
    useEffect(() => {
        if (timeLine && (timeLine.currentZoomLevel >= 0 && timeLine.currentZoomLevel < TimeLineScales.length)) {
            const scale: TimeLineScale = TimeLineScales[timeLine.currentZoomLevel];
            setTicks({
                majorTickCount: scale.majorDivisions,
                scaleExtent: scale.extent,
                tickCount: scale.majorDivisions * scale.minorDivisions,
                tickHeight: timeLine.height / 3.0,
                tickSpacing: timeLine.width / (scale.majorDivisions * scale.minorDivisions),
                labelSize: timeLine.height / 3.0,
                labelSpacing: timeLine.width / scale.majorDivisions,
                labelFormat: TIMEFORMATS[scale.format].value,
            })
        }
    }, [timeLine, timeLine?.currentZoomLevel])

    // build the tick marks
    function getTickLines
        (count: number, height: number, spacing: number) {
        const result = []
        if (timeLine) {
            for (let i = 0; i <= count; i++) {
                const d: string =
                    `m ${i * spacing} ${timeLine.height}  L ${i * spacing}  ${timeLine.height - height}`
                result.push(
                    <path key={'tick-' + i} d={d} stroke="black" />
                )
            }
        }
        return result;
    }

    // add the major tick mark labels
    function getTickLabels(
        count: number, size: number, spacing: number, extent: number, format: string) {
        const result = [];
        if (timeLine) {
            const sizepx: string = size.toString().concat('px');
            for (let i = 0; i <= count; i++) {
                const tValue: number =
                    timeLine.startTime + i * (extent / count);
                const tText = numeral(tValue).format(format);
                result.push(
                    <text key={'ticktext-' + i}
                        x={i * spacing}
                        y={size}
                        fontSize={sizepx}
                        textAnchor='middle'>
                        {tText}
                    </text>
                )
            }
        }
        return result;
    }


    const handleZoomIn = (): void => {
        if (timeLine) {
            setTimeLine((c: TimeLine) => {
                if (!c) return null;
                const newC = new TimeLine(timeLine.width, timeLine.height);
                newC.currentZoomLevel = c.currentZoomLevel;
                newC.startTime = c.startTime;
                newC.zoomIn();
                return newC;
            });

        }
    }
    const handleZoomOut = (): void => {
        if (timeLine) {
            setTimeLine((c: TimeLine) => {
                if (!c) return null;
                const newC = new TimeLine(timeLine.width, timeLine.height);
                newC.currentZoomLevel = c.currentZoomLevel;
                newC.startTime = c.startTime;
                newC.zoomOut();
                return newC;
            });
        }
    }

    return (
        <>
            <div className='page-time-control'>
                <button
                    disabled={timeLine ? timeLine.currentZoomLevel == 0 : true}
                    onClick={handleZoomIn}
                >
                    <CiZoomIn />
                </button>
                <button
                    disabled={timeLine ? timeLine.currentZoomLevel == TimeLineScales.length - 1 : true}
                    onClick={handleZoomOut}
                >
                    <CiZoomOut />
                </button>
            </div>
            <div ref={timeLineRef} className='page-time-timeline'>
                {timeLine ?
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={timeLine.width}
                        height={timeLine.height}
                        viewBox={`0 0 ${timeLine.width} ${timeLine.height}`}
                    >
                        <path stroke="black" d={`m 0 ${timeLine.height} H ${timeLine.width}`} />
                        {getTickLines(ticks?.tickCount, ticks?.tickHeight, ticks?.tickSpacing)}
                        {getTickLabels(ticks.majorTickCount, ticks.labelSize, ticks.labelSpacing, ticks.scaleExtent, ticks.labelFormat)}
                    </svg>

                    : null}
            </div>
        </>
    )
}
