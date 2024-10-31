import numeral from 'numeral';
import { useEffect, useRef, useState } from 'react';
import { CiCircleChevLeft, CiCircleChevRight, CiZoomIn, CiZoomOut } from "react-icons/ci";
import TimeLine from '../../classes/timeline';
import { useCMGContext } from '../../contexts/cmgcontext';
import { TIMEFORMATS, TimeLineScale, TimeLineScales } from '../../types/types';

// render the timeline
export default function TimeLineDisplay() {
    const { timeLine, setTimeLine, timeProgress, playing } = useCMGContext();
    const timeLineRef = useRef<HTMLDivElement>(null);
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

    // update the playback tick when the time progress changes
    useEffect(() => {
        updatePlayBackTime();
    }, [timeProgress])

    // capture the tick parameters when the zoom level changes
    useEffect(() => {
        if (timeLine.currentZoomLevel >= 0 && timeLine.currentZoomLevel < TimeLineScales.length) {
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
    }, [timeLine])

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
        const sizepx: string = size.toString().concat('px');
        for (let i = 0; i <= count; i++) {
            const tValue: number =
                timeLine.startTime + i * (extent / count);
            const tText = numeral(tValue).format(format);
            let tAnchor: string = 'middle';
            if (i == 0) tAnchor = 'start';
            if (i == count) tAnchor = 'end';
            result.push(
                <text key={'ticktext-' + i}
                    x={i * spacing}
                    y={size}
                    fontSize={sizepx}
                    textAnchor={tAnchor}>
                    {tText}
                </text>
            )
        }
        return result;
    }

    function updatePlayBackTime() {

        if (ticks.scaleExtent > 0) {

            // shift left or right if the timeprogress is the left or right of the start time
            const extent = TimeLineScales[timeLine.currentZoomLevel].extent;
            let startTime = timeLine.startTime;
            if (timeProgress < timeLine.startTime) {
                while (timeProgress < startTime) {
                    startTime = Math.max(startTime - extent / 2.0, 0);
                }
            } else if (timeProgress > timeLine.startTime + extent) {
                let endTime = timeLine.startTime + extent;
                while (timeProgress > endTime) {
                    endTime += extent / 2.0;
                    startTime = endTime - extent;
                }
            }

            // update the timeline if it has moved
            if (startTime != timeLine.startTime) {
                setTimeLine((c: TimeLine) => {
                    const newC = new TimeLine(timeLine.width, timeLine.height);
                    newC.currentZoomLevel = c.currentZoomLevel;
                    newC.startTime = startTime;
                    return newC;
                });       
            }

            // move the playback tick
            const playbackElem = document.getElementById('playback-tick');
            if (playbackElem) {
                const newLoc = timeLine.width * (timeProgress - startTime) / (ticks.scaleExtent)
                playbackElem.setAttribute('x1', newLoc.toString());
                playbackElem.setAttribute('x2', newLoc.toString());
            }

        }
    }

    const handleZoomIn = (): void => {
        setTimeLine((c: TimeLine) => {
            const newC = new TimeLine(timeLine.width, timeLine.height);
            newC.currentZoomLevel = c.currentZoomLevel;
            newC.startTime = c.startTime;
            newC.zoomIn();
            return newC;
        });
    }
    const handleZoomOut = (): void => {
        setTimeLine((c: TimeLine) => {
            const newC = new TimeLine(timeLine.width, timeLine.height);
            newC.currentZoomLevel = c.currentZoomLevel;
            newC.startTime = c.startTime;
            newC.zoomOut();
            return newC;
        });
    }

    // shift time line start left 1/2 of the extent of the current zoom level
    const handleShiftLeft = (): void => {
        setTimeLine((c: TimeLine) => {
            const extent = TimeLineScales[c.currentZoomLevel].extent;
            const newC = new TimeLine(timeLine.width, timeLine.height);
            newC.currentZoomLevel = c.currentZoomLevel;
            newC.startTime = Math.min(0, c.startTime - extent / 2.0);
            return newC;
        })
    }

    // shift time line start right 1/2 of the extent of the current zoom level
    const handleShiftRight = (): void => {
        setTimeLine((c: TimeLine) => {
            const extent = TimeLineScales[c.currentZoomLevel].extent;
            const newC = new TimeLine(timeLine.width, timeLine.height);
            newC.currentZoomLevel = c.currentZoomLevel;
            newC.startTime = c.startTime + extent / 2.0;
            return newC;
        })

    }

    return (
        <>
            <div className='page-time-control'>
                <fieldset disabled={playing.current?.on} style={{ width: 'inherit' }}>
                    <button style={{ fontSize: '15px' }}
                        disabled={timeLine.currentZoomLevel == 0}
                        onClick={handleZoomIn}
                    >
                        <CiZoomIn />
                    </button>
                    <button style={{ fontSize: '15px' }}
                        disabled={timeLine.currentZoomLevel == TimeLineScales.length - 1}
                        onClick={handleZoomOut}
                    >
                        <CiZoomOut />
                    </button>
                    <button style={{ fontSize: '15px' }}
                        disabled={timeLine.startTime == 0}
                        onClick={handleShiftLeft}
                    >
                        <CiCircleChevLeft />
                    </button>
                    <button style={{ fontSize: '15px' }}
                        // disabled={timeLine.startTime + TimeLineScales[timeLine.currentZoomLevel].extent}
                        onClick={handleShiftRight}
                    >
                        <CiCircleChevRight />
                    </button>
                </fieldset>
            </div>
            <div ref={timeLineRef} className='page-time-timeline'>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={timeLine.width}
                    height={timeLine.height}
                    viewBox={`0 0 ${timeLine.width} ${timeLine.height}`}
                >
                    <path stroke="black" d={`m 0 ${timeLine.height} H ${timeLine.width}`} />
                    {getTickLines(ticks?.tickCount, ticks?.tickHeight, ticks?.tickSpacing)}
                    {getTickLabels(ticks.majorTickCount, ticks.labelSize, ticks.labelSpacing, ticks.scaleExtent, ticks.labelFormat)}
                    <line stroke="red" x1="0" x2="0" y1="0" y2={timeLine.height} id='playback-tick' />
                </svg>
            </div>
        </>
    )
}
