import Compressor from "classes/compressor";
import { useCMGContext } from "cmgcontext";
import { ChangeEvent, useEffect, useState } from "react";
import { setCompressor } from "utils/cmfiletransactions";

export default function RoomCompressorDialog() {
  const { setFileContents, fileContents } = useCMGContext();
  const [compressorData, setCompressorData] = useState<Compressor>(
    new Compressor()
  );

  useEffect(() => {
    setCompressorData(fileContents.compressor);
  }, [fileContents.compressor]);

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const eventName: string | null = event.target["name"];
    const eventValue: string | null = event.target["value"];
    const n: Compressor = compressorData.copy();
    if (eventName && eventValue) {
      n.setAttribute(eventName, eventValue);
    }
    setCompressor(n, setFileContents);
  }
  function handleEnable() {
    const eventName: string = 'compressor.enabled';
    const eventValue:string = compressorData.enabled?'false':'true';
    const n: Compressor = compressorData.copy();
    n.setAttribute(eventName, eventValue);
    setCompressor(n, setFileContents);
  }

  function reset() {
    compressorData.reset();
    const n = compressorData.copy();
    setCompressor(n, setFileContents);
  }
  return (
    <div className="compressor"  style={{backgroundColor: compressorData.enabled? 'white': 'lightpink'}}>
      <div className="title">
        <label>
          <input type="checkbox" onChange={(()=> handleEnable())} checked={compressorData.enabled}/>
          <span>&nbsp;Enable&nbsp;</span>
        </label>
        Compressor Reset:&nbsp;
        <button className="button" onClick={reset}>
          &nbsp;
        </button>
        {compressorData.compressor
          ? ` - Current Reduction: ${compressorData.compressor.reduction.toFixed(
              0
            )}`
          : ""}
      </div>
      <div className="sliders">
        <div className="slider">
          <span className="param">Threshold (dB)</span>
          <span className="param">{compressorData.threshold}</span>
          <input
            name="compress.threshold"
            type="range"
            min="-100"
            max="0"
            step="1"
            value={compressorData.threshold}
            onChange={(event) => handleChange(event)}
          />
        </div>
        <div className="slider">
          <span className="param">Knee (dB)</span>
          <span className="param">{compressorData.knee}</span>
          <input
            name="compress.knee"
            type="range"
            min="0"
            max="40"
            step="1"
            value={compressorData.knee}
            onChange={(event) => handleChange(event)}
          />
        </div>
        <div className="slider">
          <span className="param">Ratio (____)</span>
          <span className="param">{compressorData.ratio}</span>
          <input
            name="compress.ratio"
            type="range"
            min="1"
            max="20"
            step="1"
            value={compressorData.ratio}
            onChange={(event) => handleChange(event)}
          />
        </div>
        <div className="slider">
          <span className="param">Attack (msec)</span>
          <span className="param">{compressorData.attack * 1000}</span>
          <input
            name="compress.attack"
            type="range"
            min="0"
            max="1000"
            step="1"
            value={compressorData.attack * 1000}
            onChange={(event) => handleChange(event)}
          />
        </div>
        <div className="slider">
          <span className="param">Release (msec)</span>
          <span className="param">{compressorData.release * 1000}</span>
          <input
            name="compress.release"
            type="range"
            min="0"
            max="1000"
            step="1"
            value={compressorData.release * 1000}
            onChange={(event) => handleChange(event)}
          />
        </div>
      </div>
    </div>
  );
}
