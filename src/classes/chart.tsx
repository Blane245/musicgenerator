// move to types

import { TimeMidiLine, TimeMidiPoint } from "types";
import secondsToMMSS from "utils/secondstommss";

// can remain local
type ChartPoint = {
  x: number;
  y: number;
  hue: number;
};

type ChartLine = {
  from: ChartPoint;
  to: ChartPoint;
};

const SMALL: number = 0.25; // sources less that 250ms will be drawn as points
// defines the image of all of the sound sources
export default class Chart {
  chartWidth: number;
  chartHeight: number;
  totalTime: number;
  #svgElem: SVGSVGElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  );
  #satuation: string = "100%";
  #lightness: string = "55%";
  #pointRadius: string = "5px";
  #lineWidth: string = "3px";

  constructor(width: number, height: number, length: number) {
    this.chartWidth = width;
    this.chartHeight = height;
    this.totalTime = length;
    this.#svgElem.setAttribute("width", this.chartWidth.toString());
    this.#svgElem.setAttribute("height", this.chartHeight.toString());
    this.#svgElem.setAttribute(
      "viewBox",
      `0 0 ${this.chartWidth} ${this.chartHeight}`,
    );
    const bgRect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect",
    );
    bgRect.setAttribute("width", this.chartWidth.toString());
    bgRect.setAttribute("height", this.chartHeight.toString());
    bgRect.setAttribute("fill", "white");
    bgRect.setAttribute("position", "absolute");
    this.#svgElem.appendChild(bgRect);
    this.#drawScales();
  }

  copy(): Chart {
    const n: Chart = new Chart(
      this.chartWidth,
      this.chartHeight,
      this.totalTime,
    );
    n.#svgElem = this.#svgElem;
    n.#satuation = this.#satuation;
    n.#lightness = this.#lightness;
    n.#lineWidth = this.#lineWidth;
    n.#pointRadius = this.#pointRadius;
    return n;
  }

  addSource(line: TimeMidiLine) {
    if (Math.abs(line.from.time - line.to.time) <= SMALL) {
      this.#addPoint(line.from);
    } else this.#addLine(line);
  }

  #addPoint(point: TimeMidiPoint) {
    const pointElem: SVGCircleElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle",
    );
    const chartPoint: ChartPoint = this.#pointToChart(point);
    pointElem.setAttribute("cx", chartPoint.x.toString() + "px");
    pointElem.setAttribute("cy", chartPoint.y.toString() + "px");
    pointElem.setAttribute("r", this.#pointRadius);
    pointElem.setAttribute(
      "fill",
      "hsl(" +
        chartPoint.hue.toString() +
        "," +
        this.#satuation +
        "," +
        this.#lightness +
        ")",
    );
    pointElem.setAttribute("stroke", "none");
    this.#svgElem.appendChild(pointElem);
  }

  // add a line to the chart. the color is that of the 'from' point
  #addLine(line: TimeMidiLine) {
    const lineElem: SVGLineElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line",
    );
    const chartLine: ChartLine = this.#lineToChart(line);
    lineElem.setAttribute("x1", chartLine.from.x.toString() + "px");
    lineElem.setAttribute("y1", chartLine.from.y.toString() + "px");
    lineElem.setAttribute("x2", chartLine.to.x.toString() + "px");
    lineElem.setAttribute("y2", chartLine.to.y.toString() + "px");
    lineElem.setAttribute(
      "stroke",
      "hsl(" +
        chartLine.from.hue.toString() +
        "," +
        this.#satuation +
        "," +
        this.#lightness +
        ")",
    );
    lineElem.setAttribute(
      "fill",
      "hsl(" +
        chartLine.from.hue.toString() +
        "," +
        this.#satuation +
        "," +
        this.#lightness +
        ")",
    );
    lineElem.setAttribute("stroke-width", this.#lineWidth);
    this.#svgElem.appendChild(lineElem);
  }

  #drawScales() {
    const height = this.chartHeight;
    const width = this.chartWidth;
    const duration = this.totalTime;

    // draw the horizontal major and minor midi lines and label the major ones
    let currentY: number = 0;
    for (let i = 127; i >= 0; i--) {
      if (i % 12 == 0) {
        // major vertical axis lines
        const major: SVGLineElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line",
        );
        major.setAttribute("x1", "0px");
        major.setAttribute("y1", currentY.toString() + "px");
        major.setAttribute("x2", width.toString() + "px");
        major.setAttribute("y2", currentY.toString() + "px");
        major.setAttribute("stroke", "black");
        major.setAttribute("fill", "black");
        major.setAttribute("stroke-width", "1px");
        this.#svgElem.appendChild(major);
      } else if (i % 6 == 0) {
        // minor lines
        const minor: SVGLineElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line",
        );
        minor.setAttribute("x1", "0px");
        minor.setAttribute("y1", currentY.toString() + "px");
        minor.setAttribute("x2", width.toString() + "px");
        minor.setAttribute("y2", currentY.toString() + "px");
        minor.setAttribute("stroke", "black");
        minor.setAttribute("fill", "black");
        minor.setAttribute("stroke-width", "1px");
        minor.setAttribute("stroke-dasharray", '5 5');
        this.#svgElem.appendChild(minor);
      }
      currentY += this.chartHeight / 128;
    }

    // draw the vertical 5 second lines and times
    for (let time: number = 0; time < duration; time += 5) {
      const x: number = this.chartWidth * time / duration;
      const hack: SVGLineElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      hack.setAttribute("x1", x.toString() + "px");
      hack.setAttribute("y1", "0px");
      hack.setAttribute("x2", x.toString() + "px");
      hack.setAttribute("y2", height.toString() + "px");
      hack.setAttribute("stroke", "black");
      hack.setAttribute("fill", "black");
      hack.setAttribute("stroke-width", "1px");
      this.#svgElem.appendChild(hack);
        const label: SVGTextElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text",
        );
        label.setAttribute("x", x.toString() + "px");
        label.setAttribute("y", "10pt");
        label.textContent = secondsToMMSS(time);
        label.setAttribute("font-size", "10pt");
        label.setAttribute("fill", "black");
        this.#svgElem.appendChild(label);
    }
  }

  // convert the assembled svg into an jpeg image
  // this is done by
  //    encoding the svg as a binary 64 string
  //    converting this to a canvas element
  //    converting the canvas element to a data URL
  //    then creating an image from this data URL
  async toImgElem(): Promise<HTMLImageElement> {
    const format = "jpeg";
    const quality = 1;
    const dataHeader = "data:image/svg+xml;charset=utf-8";
    const serializeAsXML = ($e: Node) =>
      new XMLSerializer().serializeToString($e);
    const encodeAsB64 = (s: string) => `${dataHeader};base64,${btoa(s)}`;

    const svgURL = encodeAsB64(serializeAsXML(this.#svgElem));
    const canvasElem: HTMLCanvasElement = document.createElement("canvas");
    canvasElem.width = this.chartWidth;
    canvasElem.height = this.chartHeight;
    const ctx = canvasElem.getContext("2d");
    if (!ctx) {
      console.log("Chart: no canvas context was set");
      return document.createElement("img");
    }

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, this.chartWidth, this.chartHeight);

    await new Promise<void>((resolve, reject) => {
      const sourceImg = new Image();
      sourceImg.onload = () => {
        ctx.drawImage(sourceImg, 0, 0, this.chartWidth, this.chartHeight);
        resolve();
      };
      sourceImg.onerror = (err) => reject(err);
      sourceImg.src = svgURL;
    });

    const dataURL = canvasElem.toDataURL(`image/${format}`, quality);
    const imgElem: HTMLImageElement = document.createElement("img");
    imgElem.src = dataURL;
    return Promise.resolve(imgElem);
  }

  #pointToChart = (point: TimeMidiPoint): ChartPoint => ({
    x: (this.chartWidth * point.time) / this.totalTime,
    y: (this.chartHeight * (127 - point.midi)) / 128,
    hue: point.hue,
  });

  #lineToChart = (line: TimeMidiLine): ChartLine => {
    const result: ChartLine = {
      from: { x: 0, y: 0, hue: 0 },
      to: { x: 0, y: 0, hue: 0 },
    };
    result.from = this.#pointToChart(line.from);
    result.to = this.#pointToChart(line.to);
    return result;
  };
}
