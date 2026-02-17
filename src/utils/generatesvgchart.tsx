import { TimeMidiLine } from "types";
import secondsToMMSS from "./secondstommss";

const SMALL: number = 0.25; // sources less than 250ms will be drawn as points

export function generateSVGChart(
  lines: TimeMidiLine[],
  width: number,
  height: number,
  totalTime: number
): string {
  // Generate pure SVG string (no DOM, worker-safe)
  
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Background
  svg += `<rect width="${width}" height="${height}" fill="lightgray" position="absolute"/>`;
  
  // Draw scales (horizontal lines for MIDI notes)
  for (let i = 127; i >= 0; i--) {
    const currentY = (height * (127 - i)) / 128;
    
    if (i % 12 == 0) {
      // Major lines
      svg += `<line x1="0" y1="${currentY}" x2="${width}" y2="${currentY}" stroke="black" stroke-width="1px"/>`;
    } else if (i % 6 == 0) {
      // Minor lines
      svg += `<line x1="0" y1="${currentY}" x2="${width}" y2="${currentY}" stroke="black" stroke-width="1px" stroke-dasharray="5 5"/>`;
    }
  }
  
  // Draw vertical time lines (5 second marks)
  for (let time = 0; time < totalTime; time += 5) {
    const x = (width * time) / totalTime;
    svg += `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="black" stroke-width="1px"/>`;
    
    const label = secondsToMMSS(time);
    svg += `<text x="${x}" y="10pt" font-size="10pt" fill="black">${label}</text>`;
  }
  
  // Draw sources (points or lines)
  for (const line of lines) {
    if (Math.abs(line.from.time - line.to.time) <= SMALL) {
      // Point
      const x = (width * line.from.time) / totalTime;
      const y = (height * (127 - line.from.midi)) / 128;
      const hsl = `hsl(${line.from.hue},100%,55%)`;
      svg += `<circle cx="${x}" cy="${y}" r="5px" fill="${hsl}" stroke="none"/>`;
    } else {
      // Line
      const x1 = (width * line.from.time) / totalTime;
      const y1 = (height * (127 - line.from.midi)) / 128;
      const x2 = (width * line.to.time) / totalTime;
      const y2 = (height * (127 - line.to.midi)) / 128;
      const hsl = `hsl(${line.from.hue},100%,55%)`;
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${hsl}" stroke-width="3px"/>`;
    }
  }
  
  svg += `</svg>`;
  
  return svg;
}
