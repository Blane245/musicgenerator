import Equalizer from "classes/equalizer";
import { useCMGContext } from "cmgcontext";
import { ChangeEvent, useEffect, useState } from "react";
import { setEqualizer } from "utils/cmfiletransactions";

export default function RoomEqualizerDialog() {
  const { fileContents, setFileContents } = useCMGContext();
  const [equalizerData, setEqualizerData] = useState<Equalizer>(
    new Equalizer()
  );

  useEffect(() => {
    setEqualizerData(fileContents.equalizer);
  }, [fileContents.equalizer]);

  function handleGain(event: ChangeEvent<HTMLInputElement>, i: number): void {
    const value: number = parseInt(event.target["value"]);
    const n: Equalizer = equalizerData.copy();
    n.setGain(i, value);
    setEqualizer(n, setFileContents);
  }

  function handleEnable() {
    const eventName: string = 'equalizer.enabled';
    const eventValue:string = equalizerData.enabled?'false':'true';
    const n: Equalizer = equalizerData.copy();
    n.setAttribute(eventName, eventValue);
    setEqualizer(n, setFileContents);
  }

  function reset() {
    equalizerData.reset();
    const n = equalizerData.copy();
    setEqualizer(n, setFileContents);
  }

  return (
    <div className="equalizer"  style={{backgroundColor: equalizerData.enabled? 'white': 'lightpink'}}>
      <div className="title">
        <label>
          <input type="checkbox" onChange={(()=> handleEnable())} checked={equalizerData.enabled}/>
          <span>&nbsp;Enable&nbsp;</span>
        </label>
        Equalizer (+- 15dB) Freqs (Hz) Reset: &nbsp;
        <button className="button" onClick={reset}>
          &nbsp;
        </button>
      </div>
      <div className="sliders">
        {equalizerData.gains.map((g, i) => {
          return (
            <div className="slider" key={`equalizer${i}`}>
              <span className="param">
                {fileContents.equalizer.frequencies[i] < 1000
                  ? fileContents.equalizer.frequencies[i].toString()
                  : (fileContents.equalizer.frequencies[i] / 1000)
                      .toFixed(0)
                      .concat("K")}
              </span>
              <span className="param">{g}</span>
              <input
                type="range"
                min="-15"
                max="15"
                step="1"
                value={g}
                onChange={(event) => handleGain(event, i)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
