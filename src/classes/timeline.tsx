// this class represets the time line
// it has a start time, and extent, and a format for major and minor ticks
// it can be zoomed in or out
import { TimeLineScales } from "types";

export default class TimeLine {
  startTime: number; //
  currentZoomLevel: number; // index into the timeline constant
  width: number; // px
  height: number; //px
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.startTime = 0;
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
    return n;
  }
}
