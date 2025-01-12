// this class represets the time line
// it has a start time, and extent, and a format for major and minor ticks
// it can be zoomed in or out
import { TimeLineScale, TimeLineScales } from "../types";

export default class TimeLine {
  startTime: number; //
  currentZoomLevel: number; // index into the timeline constant
  timeLineScale: TimeLineScale;
  width: number; // px
  height: number; //px
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.startTime = 0;
    this.currentZoomLevel = // default is 50 seconds as the extent
      TimeLineScales.findIndex((t) => t.extent == 50.0);
    this.timeLineScale = TimeLineScales[this.currentZoomLevel];
  }
  zoomIn(): void {
    if (this.currentZoomLevel > 0) {
      this.currentZoomLevel--;
      this.timeLineScale = TimeLineScales[this.currentZoomLevel];
    }
  }

  zoomOut(): void {
    if (this.currentZoomLevel < TimeLineScales.length - 1) {
      this.currentZoomLevel++;
      this.timeLineScale = TimeLineScales[this.currentZoomLevel];
    }
  }

  shiftLeft(): void {
    this.startTime = Math.max(0, this.startTime - this.timeLineScale.extent / 2.0);
  }

  shiftRight(): void {
    this.startTime+= this.timeLineScale.extent / 2.0;
  }

  copy(): TimeLine {
    const n = new TimeLine(this.width, this.height);
    n.startTime = this.startTime;
    n.currentZoomLevel = this.currentZoomLevel;
    this.timeLineScale = this.timeLineScale;
    return n;
  }
}
