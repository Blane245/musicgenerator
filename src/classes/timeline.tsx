// this class represets the time
// it has a start time, and extent, and a format for major and minor ticks
// it can be zoomed in or out
// it formats the timeline based on the current zoom leve and
// produced an svg that represents that time
// all times are in seconds
import { TimeLineScales } from "../types/types";

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
}
