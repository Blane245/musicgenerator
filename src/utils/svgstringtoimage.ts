import { debug } from "./debug";

/**
 * Convert an SVG string to an HTML Image element
 * @param svgString The SVG markup as a string
 * @returns Promise resolving to an HTMLImageElement
 */
export async function svgStringToImage(svgString: string): Promise<HTMLImageElement> {
  const format = "jpeg";
  const quality = 1;
  const dataHeader = "data:image/svg+xml;charset=utf-8";
  const encodeAsB64 = (s: string) => `${dataHeader};base64,${btoa(s)}`;

  const svgURL = encodeAsB64(svgString);
  const canvasElem: HTMLCanvasElement = document.createElement("canvas");
  
  // Parse SVG dimensions from the string
  const widthMatch = svgString.match(/width="?(\d+)/);
  const heightMatch = svgString.match(/height="?(\d+)/);
  
  const width = widthMatch ? parseInt(widthMatch[1]) : 800;
  const height = heightMatch ? parseInt(heightMatch[1]) : 600;
  
  canvasElem.width = width;
  canvasElem.height = height;
  
  const ctx = canvasElem.getContext("2d");
  if (!ctx) {
    debug.info("svgStringToImage: no canvas context was set");
    return document.createElement("img");
  }

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);

  await new Promise<void>((resolve, reject) => {
    const sourceImg = new Image();
    sourceImg.onload = () => {
      ctx!.drawImage(sourceImg, 0, 0, width, height);
      resolve();
    };
    sourceImg.onerror = (err) => reject(err);
    sourceImg.src = svgURL;
  });

  const dataURL = canvasElem.toDataURL(`image/${format}`, quality);
  const imgElem: HTMLImageElement = document.createElement("img");
  imgElem.src = dataURL;
  return imgElem;
}
