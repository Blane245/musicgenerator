// display current generator icons with svg
//     the svg needs to know the conversion of time to timeline units (px)
//     the icon is a box {x=startTimeconverted y=0, x=stoptimeconverted y= trackheight/3}
//     only icons whose start or end times fall with the curren timeline scale are displayed
//     with text Generator name: type draw centered in the box
//     when this svg is click, it invoked the modify RUD action on the generator

import { MouseEvent, useEffect, useState } from "react";
import CMGenerator from "../../classes/cmg";
import TimeLine from "../../classes/timeline";
import Track from "../../classes/track";
import { Preset } from "../../types/soundfonttypes";
import { TimeLineScales } from "../../types/types";
import GeneratorDialog from "../dialogs/generatordialog";

export interface GeneratorIconProps {
    setFileContents: Function,
    track: Track,
    setTracks: Function,
    presets: Preset[],
    timeLine: TimeLine,
    element: HTMLDivElement,
    setMessage: Function,
    setStatus: Function,
}
type GeneratorBox = {
    generator: CMGenerator, position: { x: number, y: number }, width: number, height: number
}
export default function GeneratorIcons(props: GeneratorIconProps): JSX.Element {
    const { setFileContents, track, setTracks, presets, timeLine, element, setMessage, setStatus } = props;
    const [generatorIndex, setGeneratorIndex] = useState<number>(-1);

    const [generatorBoxes, setGeneratorBoxes] =
        useState<GeneratorBox[]>([]);
    const [open, setOpen] = useState<boolean>(false);

    // set the generator icon boxes based on the generator times and timeLine 
    useEffect(() => {
        // get all of the generator boxes
        const boxes: GeneratorBox[] = [];
        track.generators.forEach(generator => {

            // is the generator out of the currently displayed current time
            const timeLineStopTime = timeLine.startTime + TimeLineScales[timeLine.currentZoomLevel].extent;
            if (!(generator.startTime < timeLine.startTime && generator.stopTime < timeLineStopTime) &&
                !(generator.startTime > timeLine.startTime && generator.stopTime > timeLineStopTime)) {

                // bound the icon's start and stop time to the timeline
                const iconStartTime: number = Math.max(generator.startTime, timeLine.startTime);
                const iconStopTime: number = Math.min(generator.stopTime, timeLineStopTime);

                // the track timeline box
                const top = element.clientTop;
                const height = element.clientHeight;
                const left = element.clientLeft;
                const width = element.clientWidth;
                const iconTop = 0;
                const iconLeft = width * (iconStartTime - timeLine.startTime) / (timeLineStopTime - timeLine.startTime);
                const iconWidth: number = width * (iconStopTime - iconStartTime) / (timeLineStopTime - timeLine.startTime);
                const iconHeight: number = height;
                if (iconWidth > 0 && iconHeight > 0) {
                    boxes.push({
                        generator: generator,
                        position: { x: iconLeft, y: iconTop },
                        width: iconWidth,
                        height: iconHeight
                    });
                }
            }
            setGeneratorBoxes(boxes);

        });
    }, [track.generators, timeLine, element])
    function openGeneratorDialog(event: MouseEvent<HTMLOrSVGElement>, generator: CMGenerator): void {
        console.log('generator icon click '.concat(track.name).concat(':').concat(generator.name));
        const boxIndex = generatorBoxes.findIndex((b) => b.generator.name == generator.name);
        const gIndex = track.generators.findIndex((g) => (g.name == generatorBoxes[boxIndex].generator.name))

        setGeneratorIndex(gIndex);
        setOpen(true);
    }
    return (
        <>
            {element ?
                <svg
                    id={track.name.concat(': Generators')}
                    xmlns="http://www.w3.org/2000/svg"
                    width={element.clientWidth}
                    height={element.clientHeight}
                    viewBox={`0 0 ${element.clientWidth} ${element.clientHeight}`}
                >
                    {generatorBoxes.map((generatorBox, i) => (
                        <>
                            <rect
                                x={generatorBox.position.x}
                                y={generatorBox.position.y}
                                width={generatorBox.width}
                                height={generatorBox.height}
                                fill='white'
                                stroke="black"
                                strokeWidth={3}
                                key={'genrect-' + track.name + '-' + i}
                                onClick={event => openGeneratorDialog(event, generatorBoxes[i].generator)}
                            />
                            <text
                                x={generatorBox.position.x + generatorBox.width / 2.0}
                                y={generatorBox.position.y + generatorBox.height / 3.0}
                                fontSize={'10pt'}
                                textAnchor='middle'
                                key={'gentext-' + track.name + '-' + i}
                                onClick={event => openGeneratorDialog(event, generatorBoxes[i].generator)}
                            >
                                {generatorBox.generator.name.concat(":").concat(generatorBox.generator.type)}
                            </text>
                        </>
                    ))}


                </svg>
                : null}

            {open ?
                    <GeneratorDialog
                        setFileContents={setFileContents}
                        track={track}
                        setTracks={setTracks}
                        presets={presets}
                        generatorIndex={generatorIndex}
                        setMessage={setMessage}
                        setStatus={setStatus}
                        closeTrackGenerator={setOpen}
                        setOpen={setOpen}
                    />
                : null}
        </>
    )
}

