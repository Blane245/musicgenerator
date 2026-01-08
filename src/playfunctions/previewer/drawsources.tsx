// draw all of the sources on the instrument or percussion

import TimeLine from "classes/timeline";
import { toNote } from "sfcomponents/util";
import {
  DrawingSection,
  RawSourceData,
  SectionType,
  SourceToDrawingSectionEntry,
  TimeLineScales,
} from "types";
import getOffsetFromTime from "utils/getoffsetfromtime";
import { linearInterpolate } from "utils/interpolation";

const HUELEFT: number = 225;
const HUERIGHT: number = 380;
const SATURATIONLO: number = 60;
const SATURATIONHI: number = 100;
const LIGHTNESSLO: number = 60;
const LIGHTNESSHI: number = 80;

// canvas as inactive
export default function DrawSources(
  sources: RawSourceData[],
  drawing: HTMLElement,
  timeline: TimeLine,
  timeProgress: number,
  sections: DrawingSection[],
  sourceMap: SourceToDrawingSectionEntry[],
  displayWidth: number,
  displayHeight: number
) {
  // console.log("drawing lines for ", sources.length, "sources");
  if (!drawing || !timeline) {
    // console.log("either drawing or timeline is null");
    return;
  }

  // clear the current drawing
  while (drawing.firstChild) {
    drawing.firstChild.remove();
  }

  // draw a horizontal line at the bottom of each drawing section
  // and write its name along the left side
  let stroke: string = "black";
  sections.forEach((section: DrawingSection, i) => {
    const newLine: SVGLineElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    // draw line between sections
    newLine.setAttribute("key", `preview-sectionline-${i}`);
    newLine.setAttribute("x1", "0");
    newLine.setAttribute("x2", displayWidth.toString());
    newLine.setAttribute(
      "y1",
      (section.height + section.verticalOffset).toString()
    );
    newLine.setAttribute(
      "y2",
      (section.height + section.verticalOffset).toString()
    );
    newLine.setAttribute("stroke", stroke);
    newLine.setAttribute("stroke-width", "2");
    newLine.setAttribute("stroke-dasharray", "5,5");
    drawing.appendChild(newLine);

    // label the section with names and lo and hi values
    const hiScale: number = (Math.floor(section.hiValue / 12) + 1) * 12;
    const loScale: number = Math.floor(section.loValue / 12) * 12;
    const hiNote: string = toNote(hiScale);
    const loNote: string = toNote(loScale);
    const sectionNameElement: SVGTextElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    sectionNameElement.textContent =
      section.type +
      "s (" +
      loScale.toFixed(0).toString() +
      ": " +
      loNote +
      ")";
    sectionNameElement.setAttribute("key", `preview-sectionname-${i}`);
    sectionNameElement.setAttribute("x", "2");
    sectionNameElement.setAttribute(
      "y",
      (section.height + section.verticalOffset - 5).toString()
    );
    sectionNameElement.setAttribute("font-size", "12pt");
    sectionNameElement.setAttribute("fill", "black");
    drawing.appendChild(sectionNameElement);
    const sectionHiElement: SVGTextElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    sectionHiElement.textContent =
      "(" + hiScale.toFixed(0).toString() + ": " + hiNote + ")";
    sectionHiElement.setAttribute("key", `preview-sectionhi-${i}`);
    sectionHiElement.setAttribute("x", "2");
    sectionHiElement.setAttribute(
      "y",
      (section.verticalOffset + 15).toString()
    );
    sectionHiElement.setAttribute("font-size", "12pt");
    sectionHiElement.setAttribute("fill", "black");
    drawing.appendChild(sectionHiElement);

    // draw a dotted line at each pitch
    section.loValue = loScale;
    section.hiValue = hiScale;
    const hiMidi = hiScale;
    const loMidi = loScale;
    for (let iMidi = loMidi; iMidi < hiMidi; iMidi++) {
      const y: number = linearInterpolate(
        iMidi,
        loMidi,
        hiMidi,
        section.height + section.verticalOffset,
        section.verticalOffset
      );
      const midiLineElement: SVGLineElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      midiLineElement.setAttribute("x1", "0");
      midiLineElement.setAttribute("x2", displayWidth.toString());
      midiLineElement.setAttribute("y1", y.toString());
      midiLineElement.setAttribute("y2", y.toString());

      midiLineElement.setAttribute(
        "stroke",
        iMidi % 12 == 0 ? "lightcoral" : "lightgray"
      );
      midiLineElement.setAttribute("stroke-width", "1");
      midiLineElement.setAttribute("stroke-dasharray", "5,5");
      midiLineElement.setAttribute(
        "key",
        `preview-sectionmidi-(${i},${iMidi})`
      );
      drawing.appendChild(midiLineElement);
    }
  });

  // get the time line start and end points. time progress should be between
  // this values
  // const strokeWidth: string = "1";
  const timelineStart: number = timeline.startTime;
  const timelineEnd: number =
    timelineStart + TimeLineScales[timeline.currentZoomLevel].extent;
  // console.log(
  //   "time progress and time line start and end",
  //   timeProgress,
  //   timelineStart,
  //   timelineEnd
  // );
  // draw the timeprogress line
  const progressLine: SVGLineElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  );
  if (timeProgress >= timelineStart && timeProgress <= timelineEnd) {
    const offset = getOffsetFromTime(
      timeProgress,
      displayWidth,
      timelineStart,
      timelineEnd
    );
    progressLine.setAttribute("x1", offset.toString());
    progressLine.setAttribute("x2", offset.toString());
    progressLine.setAttribute("y1", "0");
    progressLine.setAttribute("y2", displayHeight.toString());
    progressLine.setAttribute("stroke", "red");
    progressLine.setAttribute("key", `preview-progress`);
    progressLine.id = "timeprogress";
    drawing.appendChild(progressLine);
  }

  // loop through the source data and find each that appears on the current
  // time line
  sources.forEach((s: RawSourceData, i) => {
    const { startTime, duration, note } = s.source;

    // determine if any part of the source appears in the time line
    const lineStart = Math.min(Math.max(timelineStart, startTime), timelineEnd);
    const lineEnd = Math.min(
      Math.max(timelineStart, startTime + duration),
      timelineEnd
    );
    if (lineStart >= lineEnd) {
      // console.log('line', i,'not visible', startTime, stopTime, lineStart, lineEnd);
      return;
    }
    // find the section for this source and retrieve its section height and offset
    const entry: SourceToDrawingSectionEntry | undefined = sourceMap.find(
      (map) => map.sourceIndex == s.index
    );
    if (entry == undefined) {
      // console.log("section not found for source generator", s.gen.name);
      return;
    }
    const sectionIndex = entry.sectionIndex;
    const { height, type, loValue, hiValue, verticalOffset } =
      sections[sectionIndex];

    // convert the source's start and stop time to drawing coordinate
    const xStart: number = getOffsetFromTime(
      lineStart,
      displayWidth,
      timelineStart,
      timelineEnd
    );
    const xEnd: number = getOffsetFromTime(
      lineEnd,
      displayWidth,
      timelineStart,
      timelineEnd
    );
    // for instruments and percussion, draw lines at pitch notes based on
    // source start and stop times, volume, pan, and activity
    // TODO for now, just draw a line for an audiofile
    if (
      type == SectionType.Instrument ||
      type == SectionType.Percussion ||
      type == SectionType.Audio
    ) {
      const yMidi: number = getOffsetFromMidi(
        note,
        loValue,
        hiValue,
        height,
        verticalOffset
      );
      const hue =
        linearInterpolate(s.panner.value, -1, 1, HUELEFT, HUERIGHT) % 360;
      const saturation: number = Math.min(
        SATURATIONLO,
        Math.max(
          SATURATIONHI,
          linearInterpolate(s.vol.value, -3, 0, SATURATIONLO, SATURATIONHI)
        )
      );
      const lightness: number = !s.source.started ? LIGHTNESSLO : LIGHTNESSHI;
      stroke = "hsl(" + hue + "," + saturation + "%," + lightness + "%";
      const newLine: SVGLineElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      newLine.id = "line-" + s.index.toString();
      newLine.setAttribute("x1", xStart.toString());
      newLine.setAttribute("x2", xEnd.toString());
      newLine.setAttribute("y1", yMidi.toString());
      newLine.setAttribute("y2", yMidi.toString());
      newLine.setAttribute("stroke", stroke);
      newLine.setAttribute(
        "stroke-width",
        type == SectionType.Instrument ? "3" : "3"
      );
      newLine.setAttribute("key", `preview-source-${i}`);
      drawing.appendChild(newLine);
    } else {
      // console.log("bad section type", type);
    }
    // TODO for audiofiles, draw the portion of the sample that fits in the timeline
  });
}
function getOffsetFromMidi(
  pitch: number,
  loMidi: number,
  hiMidi: number,
  height: number,
  offset: number
) {
  // adjust the range to add 10% to lo and 10% to high
  let lo: number = loMidi;
  let hi: number = hiMidi;
  return height - ((pitch - lo) * height) / (hi - lo) + offset;
}

// change a line's color
export function redrawSource(s: RawSourceData) {
  // console.log("recoloring a source for generator", s.gen.name);

  // find the source's line
  const sourceElement: Element | null = document.getElementById(
    "line-" + s.index.toString()
  );
  if (!sourceElement) {
    // console.log("line not found for source", s.index);
    return;
  }
  const hue = linearInterpolate(s.panner.value, -1, 1, HUELEFT, HUERIGHT) % 360;
  const saturation: number = Math.min(
    SATURATIONLO,
    Math.max(
      SATURATIONHI,
      linearInterpolate(s.vol.value, -3, 0, SATURATIONLO, SATURATIONHI)
    )
  );
  const lightness: number = !s.source.started ? LIGHTNESSLO : LIGHTNESSHI;
  const stroke = "hsl(" + hue + "," + saturation + "%," + lightness + "%";
  sourceElement.setAttribute("stroke", stroke);
}
