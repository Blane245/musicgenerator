import { TimeMidiLine } from "types";

/**
 * Worker-safe chart collector - collects chart data without using DOM
 * Implements the same addSource() interface as Chart for compatibility
 */
export default class ChartCollector {
  chartWidth: number;
  chartHeight: number;
  totalTime: number;
  lines: TimeMidiLine[] = [];

  constructor(width: number, height: number, length: number) {
    this.chartWidth = width;
    this.chartHeight = height;
    this.totalTime = length;
  }

  addSource(line: TimeMidiLine) {
    this.lines.push(line);
  }

  copy(): ChartCollector {
    const n = new ChartCollector(this.chartWidth, this.chartHeight, this.totalTime);
    n.lines = [...this.lines];
    return n;
  }

  /**
   * Get the collected lines for SVG generation
   */
  getLines(): TimeMidiLine[] {
    return this.lines;
  }
}
