// display current generator icons with svg
//     the svg needs to know the conversion of time to timeline units (px)
//     the icon is a box {x=startTimeconverted y=0, x=stoptimeconverted y= trackheight/3}
//     only icons whose start or end times fall with the curren timeline scale are displayed
//     with text Generator name: type draw centered in the box
//     when this svg is click, it invoked the modify RUD action on the generator

import { MouseEvent, useEffect, useState } from "react";
import CMGenerator from "../../classes/cmg";
import Track from "../../classes/track";
import { SECONDSNAPUNIT, TimeLineScales } from "../../types/types";
import GeneratorDialog from "../dialogs/generatordialog";
import { Generate } from '../generation/generate';
import { useCMGContext } from "../../contexts/cmgcontext";
import { flipGeneratorMute, moveGeneratorBodyPosition, moveGeneratorTime, moveGenertorBodyTime } from "../../utils/cmfiletransactions";

export interface GeneratorIconProps {
    track: Track,
    element: HTMLDivElement,
}
type GeneratorBox = {
    generator: CMGenerator, position: { x: number, y: number }, width: number, height: number
}
export default function GeneratorIcons(props: GeneratorIconProps): JSX.Element {
    const {track, element } = props;
    const {fileContents, setFileContents, timeLine, setMessage, setStatus} = useCMGContext();
    const [generatorIndex, setGeneratorIndex] = useState<number>(-1);
    const [cursorStyle, setCursorStyle] = useState<string>('cursor-default');
    const [moveMode, setMoveMode] = useState<string>('');
    const [menuEnabled, setMenuEnabled] = useState<boolean>(false);
    const [menuX, setMenuX] = useState<number>(0);
    const [menuY, setMenuY] = useState<number>(0);
    const [mouseDown, setMouseDown] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
    const [generatorBoxes, setGeneratorBoxes] = useState<GeneratorBox[]>([]);
    const [openDialog, setOpenDialog] = useState<boolean>(false);

    // TODO revise as snapping is implemented
    const snapTimeResolution = SECONDSNAPUNIT.Deciseconds;

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
                const iconTop = generator.position;
                const iconLeft = width * (iconStartTime - timeLine.startTime) / (timeLineStopTime - timeLine.startTime);
                const iconWidth: number = width * (iconStopTime - iconStartTime) / (timeLineStopTime - timeLine.startTime);
                const iconHeight: number = height / 3.0;
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
        setOpenDialog(true);
    }

    function handleBodyMouseDown(event: MouseEvent<HTMLOrSVGElement>, index: number) {
        event.preventDefault();
        const button = event.button;
        if (button == 0) {
            console.log('body button down', button, 'generator', generatorBoxes[index].generator.name);
            setGeneratorIndex(index);

            //enable cursor movement
            setCursorStyle('cursor-all-scroll');
            setMoveMode('body');
            setMouseDown({ x: event.clientX, y: event.clientY });
        }

    }
    function handleTextMouseDown(event: MouseEvent<HTMLOrSVGElement>, index: number) {
        event.preventDefault();
        const button = event.button;
        console.log('text button down', button, 'generator', generatorBoxes[index].generator.name);
        setGeneratorIndex(index);

        // enable generator menu
        setCursorStyle('cursor-context-menu');
        setMenuX(event.clientX);
        setMenuY(event.clientY);
        setMenuEnabled(true);

    }

    // movement of the start and stop times for the generator
    function handleStartStopMouseDown(event: MouseEvent<HTMLOrSVGElement>, index: number, mode: string) {
        event.preventDefault();
        const button = event.button;

        // enable start move
        if (button == 0) {
            setCursorStyle('cursor-col-resize');
            console.log(mode, 'button down', generatorBoxes[index].generator.name);
            setGeneratorIndex(index);
            setMoveMode(mode);
            setMouseDown({ x: event.clientX, y: event.clientY });

        }
    }

    function handleMouseMove(event: MouseEvent<HTMLOrSVGElement>, index: number) {
        event.preventDefault();

        // index points to the selected genertor box
        // track is the active track element
        // the svg parent has id track.name.concat(': Generators') and contrains the up and down movement
        // the timeline object defines the time boundaries and constrains tht left and right movement
        // the snap resolution constrains which time lines are supportable for movement
        // the the snap resolution is below 1px on the timeline, left/right movement is not possible
        // if the snap resolution excends the extent of the time time  movement is not possble. 


        // handle modes body, start, stop
        if (moveMode == 'body') {

            // movements left and right change the genrators start and stop times
            //TODO this will snap on 0.1 second boundaries for now
            // the generator cannot be moved outside of the display timeline


            // movements up and dow change the vertical position of the generator icon 
            // the icon is contrained to the track timeline svg
            executeIconMove({ x: event.clientX, y: event.clientY }, generatorBoxes[index]);
        }
        else if (moveMode == 'start' || moveMode == 'stop') {

            // left and right movements change the start or stop time of the generator. 
            // start time cannot be moved left of the timeline start or right of the stop time
            // stop time cannot be moved right of the timeline extent or left of the start time
            //TODO  changes snap to 0.1 second boundaries for now
            executeStartStopMove(moveMode, { x: event.clientX, y: event.clientY }, generatorBoxes[index]);
        }
    }

    function handleMouseUp(event: MouseEvent<HTMLOrSVGElement>) {
        event.preventDefault();
        setCursorStyle('cursor-default');
        setMoveMode('');
        setMouseDown({ x: 0, y: 0 });
        setMenuEnabled(false);
        setGeneratorIndex(-1);
    }

    // supress all default behavior on a mouse click
    function handleClick(event: MouseEvent<HTMLOrSVGElement>) {
        event.preventDefault();
    }

    // toggle the mute condition of the selected generator
    function toggleGeneratorMute(index: number) {
        flipGeneratorMute(track, index, setFileContents);
        // setTracks((ts: Track[]) => {
        //     const nts: Track[] = [];
        //     ts.forEach((t) => {
        //         if (t.name = track.name) {
        //             t.generators[index].mute = !t.generators[index].mute;
        //         }
        //         nts.push(t);
        //     });
        //     return nts;
        // });
    }

    function previewGenerator(index: number) {
        const newErrors:string[] = Generate(fileContents, generatorBoxes[index].generator);

        if (newErrors.length != 0) {
            setMessage({error:true, text: newErrors[0]})
        }
        setStatus('audio file previewed');

    }
    return (
        <>
            {element ?
            // TODO for some reason the element parameter client size of
            // other elements is changing when mouse events are handled 
            // within the generator box
            // changing when mouse event are handled 
                <svg
                    className={cursorStyle}
                    id={track.name.concat(': Generators')}
                    key={track.name.concat(': Generators')}
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
                                strokeWidth={1}
                                key={'genrect-' + track.name + '-' + i}
                                onMouseDown={event => handleBodyMouseDown(event, i)}
                                onMouseUp={handleMouseUp}
                                onMouseMove={event => handleMouseMove(event, i)}
                                onClick={handleClick}
                            />
                            <text
                                x={generatorBox.position.x + generatorBox.width / 2.0}
                                y={generatorBox.position.y + generatorBox.height / 3.0}
                                fontSize={'10pt'}
                                textAnchor='middle'
                                dominantBaseline='hanging'
                                key={'gentext-' + track.name + '-' + i}
                                onMouseDown={event => handleTextMouseDown(event, i)}
                                onMouseUp={handleMouseUp}
                                onMouseMove={event => handleMouseMove(event, i)}
                                onClick={handleClick}
                                stroke={generatorBox.generator.mute ? 'red' : 'black'}
                            >
                                {generatorBox.generator.name.concat(":").concat(generatorBox.generator.type)}
                            </text>
                            <line
                                key={'genstart-' + track.name + '-' + i}
                                stroke="blue"
                                strokeWidth={5}
                                x1={generatorBox.position.x}
                                y1={generatorBox.position.y}
                                x2={generatorBox.position.x}
                                y2={generatorBox.position.y + generatorBox.height}
                                onMouseDown={event => handleStartStopMouseDown(event, i, 'start')}
                                onMouseUp={handleMouseUp}
                                onClick={handleClick}
                                onMouseMove={event => handleMouseMove(event, i)}
                            />
                            <line
                                key={'genstop-' + track.name + '-' + i}
                                stroke="blue"
                                strokeWidth={5}
                                x1={generatorBox.position.x + generatorBox.width}
                                y1={generatorBox.position.y}
                                x2={generatorBox.position.x + generatorBox.width}
                                y2={generatorBox.position.y + generatorBox.height}
                                onMouseDown={event => handleStartStopMouseDown(event, i, 'stop')}
                                onMouseUp={handleMouseUp}
                                onMouseMove={event => handleMouseMove(event, i)}
                                onClick={handleClick}
                            />
                        </>
                    ))}


                </svg>
                : null}

            <div
                className="modal-menu"
                style={{
                    display: menuEnabled ? "block" : "none",
                    position: 'absolute',
                    top: menuY.toString() + 'px',
                    left: menuX.toString() + 'px'

                }}


            >
                <p
                    onClick={() => { setOpenDialog(true); setMenuEnabled(false); setCursorStyle('cursor-default'); }}

                >
                    Edit
                </p>
                <p
                    onClick={() => { toggleGeneratorMute(generatorIndex); setMenuEnabled(false); setCursorStyle('cursor-default'); }}
                >
                    {generatorIndex >= 0 && track.generators[generatorIndex].mute ? 'Unmute' : 'Mute'}
                </p>
                <p
                    onClick={() => { setMenuEnabled(false); setCursorStyle('cursor-default'); previewGenerator(generatorIndex) }}
                >
                    Preview
                </p>
            </div>
            {openDialog ?
                <GeneratorDialog
                    track={track}
                    generatorIndex={generatorIndex}
                    closeTrackGenerator={setOpenDialog}
                    setOpen={setOpenDialog}
                />
                : null}
        </>
    )

    // index points to the selected genertor box
    // track is the active track element
    // the svg parent has id track.name.concat(': Generators') and contrains the up and down movement
    // the timeline object defines the time boundaries and constrains tht left and right movement
    // the snap resolution constrains which time lines are supportable for movement
    // the the snap resolution is below 1px on the timeline, left/right movement is not possible
    // if the snap resolution excends the extent of the time time  movement is not possble. 
    function getScalingValues(): { error: boolean, snapPixelResolution: number, maxTime: number, minTime: number, trackBox: { top: number, left: number, bottom: number, right: number } } {
        let snapPixelResolution: number = 0;
        let maxTime: number = 0;
        let minTime: number = 0;
        let trackBox = { top: 0, left: 0, bottom: 0, right: 0 };
        let error: boolean = false;
        console.log('in getScalingValues')

        const trackElement = document.getElementById(track.name.concat(': Generators'));
        if (!trackElement) {
            error = true;
            console.log('can\'t find track element')
            return { error, snapPixelResolution, maxTime, minTime, trackBox };
        }

        trackBox.top = trackElement.clientTop;
        trackBox.left = trackElement.clientLeft;
        trackBox.bottom = trackElement.clientTop + trackElement.clientHeight;
        trackBox.right = trackElement.clientLeft + trackElement.clientWidth;
        minTime = timeLine.startTime;
        maxTime = timeLine.startTime + TimeLineScales[timeLine.currentZoomLevel].extent;
        snapPixelResolution = (trackBox.right - trackBox.left) * snapTimeResolution / (maxTime - minTime);
        if (snapPixelResolution < 1)
            error = true;
        console.log(
            'trackBox', trackBox,
            'error', error,
            'snapPixelResolution', snapPixelResolution,
            'minTime', minTime,
            'extent', TimeLineScales[timeLine.currentZoomLevel].extent,
            'maxTime', maxTime,
        )
        return { error, snapPixelResolution, maxTime, minTime, trackBox };
    }

    // determine if a movement can be made horizontally and return the new starttime in time units
    // the icon must stay within the trackbox contraints
    // the iconBox is the box being moved
    // trackBox is the containing box
    // newLocation is the location of the cursor making the request
    // the amount of movement is the different between the newLocation and where the mouse 
    // the movement will not be allowed is it is outside of contraints or not on a snap point
    function MoveBodyHorizontal(location: { x: number, y: number }, SnapPixelResolution: number, iconLeft: number, iconRight: number, boxLeft: number, boxRight: number): { allowed: boolean, moveNeeded: boolean, start: number } {
        const deltaX: number = location.x - mouseDown.x;
        let allowed: boolean = false;
        let start: number = 0;
        let moveNeeded: boolean = false;
        console.log(
            'in MoveBodyHorizontal',
            'location', location,
            'mouseDown', mouseDown,
            'SnapPixelResolution', SnapPixelResolution,
            'iconLeft', iconLeft,
            'iconRight', iconRight,
            'boxLeft', boxLeft,
            'boxRight', boxRight,
            'deltaX', deltaX,
        )
        // does this move the box too far left or right?
        if (iconLeft + deltaX < boxLeft || iconRight + deltaX > boxRight)
            return { allowed, moveNeeded, start }

        // is the movement on a snap point?
        // if (SnapPixelResolution == 0)
        //     return { allowed, moveNeeded, start }
        // const snapPoint: number = deltaX / SnapPixelResolution; // should be very close to an integer
        // if (snapPoint - Math.trunc(snapPoint) > 0.1) {
        //     console.log ('bad snapPoint',snapPoint);
        //     return { allowed, moveNeeded, start }
        // }
        // get the new start time
        start = track.generators[generatorIndex].startTime + TimeLineScales[timeLine.currentZoomLevel].extent * deltaX / (boxRight - boxLeft);
        allowed = true;
        moveNeeded = true;
        console.log('moveNeeded', moveNeeded, 'start', start)
        setMouseDown({ ...location });
        return { allowed, moveNeeded, start }
    }

    // determine is a move if the icon can be made vertically and if so,
    // set the new top coorinate
    function MoveBodyVertical(location: { x: number, y: number }, iconTop: number, iconBottom: number, boxTop: number, boxBottom: number): { allowed: boolean, moveNeeded: boolean, top: number } {
        const deltaY = location.y - mouseDown.y;
        const newTop = iconTop + deltaY;
        const newBottom = iconBottom + deltaY;
        console.log('in MoveBodyVertical',
            'location', location,
            'iconTop', iconTop,
            'iconBottom', iconBottom,
            'boxTop', boxTop,
            'boxBottom', boxBottom,
            'deltaY', deltaY,
            'newTop', newTop,
            'newBottom', newBottom,

        )
        if (newTop >= boxTop && newBottom <= boxBottom) {
            setMouseDown({ ...location });
            return ({ allowed: true, moveNeeded: true, top: newTop })
        }
        else
            return ({ allowed: false, moveNeeded: (deltaY != 0), top: iconTop });
    }

    // based on the mouse moves in the icon body, update the start and stop, and vertical position of the generator and its icon
    function executeIconMove(location: { x: number, y: number }, iconBox: GeneratorBox): void {
        let allowed: boolean = false;
        let newStart: number = 0;
        let newTop: number = 0;
        let moveNeeded: boolean = false;
        console.log('in executeIconMove');
        const { error, snapPixelResolution, minTime, maxTime, trackBox } = getScalingValues();
        if (error) return;

        ({ allowed, moveNeeded, start: newStart } = MoveBodyHorizontal(location, snapPixelResolution,
            iconBox.position.x, iconBox.position.x + iconBox.width,
            trackBox.left, trackBox.right,
        ));

        // if allowed, change the generators start and stop time
        if (allowed && moveNeeded) {
            console.log('newStart', newStart);
            moveGenertorBodyTime (track, generatorIndex, newStart, setFileContents);
            // setTracks((ts: Track[]) => {
            //     const newts: Track[] = []
            //     ts.map((t: Track) => {
            //         const newt: Track = t.copy();
            //         if (t.name == track.name) {
            //             const newg = t.generators[generatorIndex].copy();
            //             newg.stopTime = newg.stopTime + newStart - newg.startTime;
            //             newg.startTime = newStart;
            //             newt.generators = newt.generators.map((g, i) => i == generatorIndex ? newg : g);
            //         }
            //         newts.push(newt);
            //     });
            //     return newts;
            // });
        }

        // check the vertical movement
        ({ allowed, moveNeeded, top: newTop } = MoveBodyVertical(location,
            iconBox.position.y, iconBox.position.y + iconBox.height,
            trackBox.top, trackBox.bottom));

        //if allowed, move the generator box to the new position
        if (allowed && moveNeeded) {
            console.log(
                'vertical move',
                'generatorIndex', generatorIndex,
            )
            // setGeneratorBoxes((prev: GeneratorBox[]) => {
            //     const newbs: GeneratorBox[] = [];
            //     prev.forEach((b, i) => {
            //         const newb = b.copy();
            //         if (i == generatorIndex) {
            //             newb.position.y = newTop;
            //             console.log('newTop', newTop);
            //         }
            //         newbs.push(newb);
            //     })
            //     return newbs;
            // });
            moveGeneratorBodyPosition (track, generatorIndex, newTop, setFileContents);
            // setTracks((ts: Track[]) => {
            //     const newts: Track[] = []
            //     ts.map((t: Track) => {
            //         const newt: Track = t.copy();
            //         if (t.name == track.name) {
            //             const newg = t.generators[generatorIndex].copy();
            //             newg.position = newTop;
            //             newt.generators = newt.generators.map((g, i) => i == generatorIndex ? newg : g);
            //         }
            //         newts.push(newt);
            //     });
            //     return newts;
            // })
        }
    }

    // this will move either the start or sop times of the generator depending on the mode
    // the location is the amount of movement since the last update
    // the box is the icon box
    // the starttime must not become less than the timeline start
    // the stop time must become greater than the timeline start plus extent
    function executeStartStopMove(mode: string, location: { x: number, y: number }, iconBox: GeneratorBox): void {
        let newValue: number;
        console.log('in executeStartStopMove');
        const { error, snapPixelResolution, minTime, maxTime, trackBox } = getScalingValues();
        console.log(
            'scale error', error,
            'mode', mode,
            'location', location,
            'mouseDown', mouseDown,
            'iconBox', iconBox,
            'trackBox', trackBox,

        )
        if (error) return;

        // the location of the current start and stop times are the extent of the iconBox
        const deltaX: number = location.x - mouseDown.x;
        console.log('deltaX', deltaX);
        if (deltaX == 0)
            return;
        const newLeft: number = iconBox.position.x + deltaX;
        const newRight: number = iconBox.position.x + iconBox.width + deltaX;
        console.log(
            'newLeft', newLeft,
            'newRight', newRight,
        )
        if (mode == 'start') {
            if (newLeft < trackBox.left || deltaX >= iconBox.width)
                return;
            newValue = track.generators[generatorIndex].startTime +
                TimeLineScales[timeLine.currentZoomLevel].extent * deltaX / (trackBox.right - trackBox.left);
            console.log('newStart', newValue);
            setMouseDown({ ...location });
        } else if (mode == 'stop') {
            if (newRight > trackBox.right || iconBox.width + deltaX <= 0.0)
                return;
            newValue = track.generators[generatorIndex].stopTime +
                TimeLineScales[timeLine.currentZoomLevel].extent * deltaX / (trackBox.right - trackBox.left);
            console.log('newStop', newValue)
            setMouseDown({ ...location });
        } else
            return;
        moveGeneratorTime (track, generatorIndex, mode, newValue, setFileContents);
        // setTracks((ts: Track[]) => {
        //     const newts: Track[] = []
        //     ts.map((t: Track) => {
        //         const newt: Track = t.copy();
        //         if (t.name == track.name) {
        //             const newg = t.generators[generatorIndex].copy();
        //             if (newStart)
        //                 newg.startTime = newStart;
        //             if (newStop)
        //                 newg.stopTime = newStop;
        //             newt.generators = newt.generators.map((g, i) => i == generatorIndex ? newg : g);
        //         }
        //         newts.push(newt);
        //     });
        //     return newts;
        // })



    }

}


