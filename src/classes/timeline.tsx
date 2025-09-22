// this class represets the time line
// it has a start time, and extent, and a format for major and minor ticks
// it can be zoomed in or out
import { TimeLineScales, TIMELINETYPE } from "types";
import { getAttributeValue } from "utils/xmlfunctions";

export default class TimeLine {
  startTime: number; //
  currentZoomLevel: number; // index into the timeline constant
  width: number; // px
  height: number; //px
  mode: TIMELINETYPE;
  snap: boolean;
  measureSize: number; // secs
  beatsPerMeasure: number;
  snapIncrement: number;
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.startTime = 0;
    this.mode = TIMELINETYPE.Time;
    this.snap = false;
    this.snapIncrement = 1; // second or measure
    this.measureSize = 1; //sec
    this.beatsPerMeasure = 1;
    this.currentZoomLevel = // default is 50 seconds as the extent
      TimeLineScales.findIndex((t) => t.extent == 50.0);
  }
  zoomIn(): void {
    if (this.currentZoomLevel > 0) {
      this.currentZoomLevel--;
    }
  }

  zoomOut(): void {
    if (this.currentZoomLevel < TimeLineScales.length - 1) {
      this.currentZoomLevel++;
    }
  }

  shiftLeft(): void {
    this.startTime = Math.max(
      0,
      this.startTime - TimeLineScales[this.currentZoomLevel].extent / 2.0
    );
  }

  shiftRight(): void {
    this.startTime += TimeLineScales[this.currentZoomLevel].extent / 2.0;
  }

  copy(): TimeLine {
    const n = new TimeLine(this.width, this.height);
    n.startTime = this.startTime;
    n.currentZoomLevel = this.currentZoomLevel;
    n.mode = this.mode;
    n.snap = this.snap;
    n.snapIncrement = this.snapIncrement;
    n.beatsPerMeasure = this.beatsPerMeasure;
    n.measureSize = this.measureSize;
    return n;
  }

  setAttribute(name:string, value:string): void {
    switch (name) {
      case 'mode':
        this.mode = TIMELINETYPE[value];
        break;
      case 'measureSize':
        this.measureSize = parseFloat(value);
        break;
      case 'beatsPerMeasure':
        this.beatsPerMeasure = parseInt(value);
        break;
      case 'snap':
        this.snap = value == 'true';
        break;
      case 'snapIncrement':
        this.snapIncrement = parseFloat(value);
        break;
      default:
        break;
    }
  }
  appendXML(_doc: XMLDocument, elem: Element, _fileName: string) {
    elem.setAttribute("startTime", this.startTime.toString());
    elem.setAttribute("currentZoomLevel", this.currentZoomLevel.toString());
    elem.setAttribute("mode", this.mode.toString());
    elem.setAttribute("snap", this.snap?"true":"false");
    elem.setAttribute("snapIncrement", this.snapIncrement.toString());
        elem.setAttribute("beatsPerMeasure", this.beatsPerMeasure.toString());
        elem.setAttribute("measureSize", this.measureSize.toString());

  }
  getXML(tElem: Element, _fileName: string) {
    this.startTime = getAttributeValue(tElem, "startTime", "float") as number;
    this.currentZoomLevel = getAttributeValue(
      tElem,
      "currentZoomLevel",
      "int"
    ) as number;
    try {
      this.mode = getAttributeValue(tElem, 'mode',  'string') as TIMELINETYPE;
    } catch (e) {
      this.mode = TIMELINETYPE.Time;
    }
    try {
      this.snap = (getAttributeValue(tElem, 'snap', 'string') as string) == 'true';
    } catch (e) {
      this.snap = false;
    }
    try {
      this.snapIncrement = getAttributeValue(tElem, 'snapIncrement', 'float') as number;
    } catch (e) {
      this.snapIncrement = 1;
    }
    try {
      this.beatsPerMeasure = getAttributeValue(tElem, 'beatsPerMeasure', 'int') as number;
    } catch (e) {
      this.beatsPerMeasure = 1;
    }
    try {
      this.measureSize = getAttributeValue(tElem, 'measureSize', 'float') as number;
    } catch (e) {
      this.measureSize = 1;
    }
  }
}
