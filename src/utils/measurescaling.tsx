// determine the scaling of the timeline for measures and beats.
// The timeline's start and end times may not be on even beats as scrolling and
// sizing is based in time not measures.
// The first beat may be some time into the timeline, and the last beat may be before the
// end of the time line.
// This routine determines where these beats are both in time and position, along with the

import { linearInterpolate } from "./interpolation";

interface MeasureScalingProps {
  startTime: number; // (secs)
  timeExtent: number; // (secs)
  positionWidth: number; // (pixels)
  measureTime: number; // (secs)
  beatsPerMeasure: number; // int
}
export function measureScaling(props: MeasureScalingProps): {
  startTickTime: number;
  endTickTime: number;
  tickPositionSize: number;
  startTickPosition: number;
  endTickPosition: number;
  nBeats: number;
  startTickNumber: number;
  endTickNumber: number;
} {
  const { startTime, timeExtent, positionWidth, measureTime, beatsPerMeasure } =
    props;
    // console.log('input to measure scaling: start time, time extent, position width, measure time, beats per measure',
    //     startTime, timeExtent, positionWidth, measureTime, beatsPerMeasure
    // );
  const endTime: number = startTime + timeExtent;
  const tickTime: number = measureTime / beatsPerMeasure;

  // get the number of the first tick and its time
  // if it before the start time, move it ahead 1
  let startTickNumber: number = Math.trunc(startTime / tickTime);
  if (startTime - startTickNumber * tickTime > 0) startTickNumber++;
  const startTickTime: number = startTickNumber * tickTime;

  // get the number of beats from the start tick time to the end of the time line
  const nBeats: number = Math.trunc((endTime-startTickTime) / tickTime);
  const endTickNumber: number = startTickNumber + nBeats;

  // get the time of the last tick
  const endTickTime: number = startTickTime + nBeats * tickTime;

  // get their poisitions by scaling them to the time line
  const startTickPosition: number = linearInterpolate(
    startTickTime,
    startTime,
    endTime,
    0,
    positionWidth
  );
  const endTickPosition: number = linearInterpolate(
    endTickTime,
    startTime,
    endTime,
    0,
    positionWidth
  );

  // finally determine the pixel spacing of the time ticks
  const tickPositionSize: number =
    (endTickPosition - startTickPosition) / nBeats;

    // console.log('start and end tick times', startTickTime, endTickTime,
    //     'tick position size', tickPositionSize, 
    //     'start and end tick positions', startTickPosition, endTickPosition,
    //     ' beat count, and start and end tick numbers', nBeats, startTickNumber, endTickNumber
    // );
  return {
    startTickTime,
    endTickTime,
    tickPositionSize,
    startTickPosition,
    endTickPosition,
    nBeats,
    startTickNumber,
    endTickNumber,
  };
}
