import { useCMGContext } from "../../contexts/cmgcontext";
import Compressor from "../../classes/compressor";
import { ChangeEvent, useEffect, useState } from "react";
import { setCompressor } from "../../utils/cmfiletransactions";

export default function RoomCompressorDialog() {
  const { setFileContents, fileContents } = useCMGContext();
  const [compressorData, setCompressorData] = useState<Compressor>(
    new Compressor("compressor")
  );

  useEffect(() => {
    setCompressorData(fileContents.compressor);
  } ,[fileContents.compressor]);

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const eventName: string | null = event.target["name"];
    const eventValue: string | null = event.target["value"];
    const n: Compressor = compressorData.copy();
    if (eventName && eventValue) {
      n.setAttribute(eventName, eventValue);
    }
    setCompressor(n, setFileContents);
  }
  function reset() {
    const n = compressorData.copy();
    n.threshold = -24;
    n.knee = 30;
    n.ratio = 12;
    n.attack = 0.003;
    n.release = 0.25
    if (n.effect) {
      n.effect.threshold.value = n.threshold;
      n.effect.knee.value = n.knee;
      n.effect.ratio.value = n.ratio;
      n.effect.attack.value = n.attack;
      n.effect.release.value = n.attack;
    }
    setCompressor(n, setFileContents);
  }
  return (
    <div className="page-footer-compressor">
      <p className="title">
        Compressor Reset:&nbsp;
        <button className='button'
        onClick={reset}
        >&nbsp;</button>
        {compressorData.effect
          ? ` - Current Reduction: ${compressorData.effect.reduction.toFixed(
              0
            )}`
          : ""}
      </p>
      <div className="sliders">
        <div className="compressor-slider">
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
        <div className="compressor-slider">
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
        <div className="compressor-slider">
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
        <div className="compressor-slider">
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
        <div className="compressor-slider">
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
