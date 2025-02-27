import { ChangeEvent, useEffect, useState } from "react";
import Reverb from "../classes/reverb";
import { useCMGContext } from "../cmgcontext";
import { setReverb } from "../utils/cmfiletransactions";

export default function RoomCompressorDialog() {
  const { setFileContents, fileContents } = useCMGContext();
  const [reverbData, setReverbData] = useState<Reverb>(
    new Reverb("reverb")
  );

  useEffect(() => {
    setReverbData(fileContents.reverb);
  }, [fileContents.compressor]);

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const eventName: string | null = event.target["name"];
    const eventValue: string | null = event.target["value"];
    const n: Reverb = reverbData.copy();
    if (eventName && eventValue) {
      n.setAttribute(eventName, eventValue);
    }
    setReverb(n, setFileContents);
  }
  function reset() {
    const n = new Reverb ('roomreverb');
    setReverb(n, setFileContents);
  }
  return (
    <div className="page-footer-reverb">
      <p className="title">
        Reverb Reset:&nbsp;
        <button className="button" onClick={reset}>
          &nbsp;
        </button>
      </p>
      <div className="sliders">
        <div className="slider" key={'roomreverb'}>
          <span className="param">Duration (sec)</span>
          <span className="param">{reverbData.duration}</span>
          <input
            name="reverb.duration"
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={reverbData.duration}
            onChange={(event) => handleChange(event)}
          />
        </div>
        <div className="slider">
          <span className="param">Decay (sec)</span>
          <span className="param">{reverbData.decay}</span>
          <input
            name="reverb.decay"
            type="range"
            min="0"
            max="10"
            step="1"
            value={reverbData.decay}
            onChange={(event) => handleChange(event)}
          />
        </div>
        <div className="slider">
          <span className="param">LW delay</span>
          <span className="param">{reverbData.leftWall.delay}</span>
          <input
            name="reverb.leftwall.delay"
            type="range"
            min="0"
            max="1000"
            step="1"
            value={reverbData.leftWall.delay}
            onChange={(event) => handleChange(event)}
          />
        </div>
        <div className="slider">
          <span className="param">LW gain (___)</span>
          <span className="param">{reverbData.leftWall.gain}</span>
          <input
            name="reverb.leftwall.gain"
            type="range"
            min="0"
            max="1"
            step=".1"
            value={reverbData.leftWall.gain}
            onChange={(event) => handleChange(event)}
          />
        </div>
        <div className="slider">
          <span className="param">RW delay</span>
          <span className="param">{reverbData.rightWall.delay}</span>
          <input
            name="reverb.rightwall.delay"
            type="range"
            min="0"
            max="1000"
            step="1"
            value={reverbData.rightWall.delay}
            onChange={(event) => handleChange(event)}
          />
        </div>
        <div className="slider">
          <span className="param">RW gain (___)</span>
          <span className="param">{reverbData.rightWall.gain}</span>
          <input
            name="reverb.rightwall.gain"
            type="range"
            min="0"
            max="1"
            step=".1"
            value={reverbData.rightWall.gain}
            onChange={(event) => handleChange(event)}
          />
        </div>
        <div className="slider">
          <span className="param">Ceiling delay</span>
          <span className="param">{reverbData.ceiling.delay}</span>
          <input
            name="reverb.ceiling.delay"
            type="range"
            min="0"
            max="1000"
            step="1"
            value={reverbData.ceiling.delay}
            onChange={(event) => handleChange(event)}
          />
        </div>
        <div className="slider">
          <span className="param">Ceiling gain</span>
          <span className="param">{reverbData.ceiling.gain}</span>
          <input
            name="reverb.ceiling.gain"
            type="range"
            min="0"
            max="1"
            step=".1"
            value={reverbData.ceiling.gain}
            onChange={(event) => handleChange(event)}
          />
        </div>
      </div>
    </div>
  );
}
