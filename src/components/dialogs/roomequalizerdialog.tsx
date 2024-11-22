import { ChangeEvent, useEffect, useState } from "react";
import Equalizer from "../../classes/equalizer";
import { useCMGContext } from "../../contexts/cmgcontext";
import { setEqualizer } from "../../utils/cmfiletransactions";

export default function RoomEqualizerDialog() {
  const { fileContents, setFileContents } = useCMGContext();
  const [equalizerData, setEqualizerData] = useState<Equalizer>(
    new Equalizer("equalizer")
  );

  useEffect(() => {
    setEqualizerData(fileContents.equalizer);
  },[fileContents.equalizer])

  function handleChange(event: ChangeEvent<HTMLInputElement>, i: number): void {
    const value: number = parseInt(event.target["value"]);
    const n: Equalizer = equalizerData.copy();
    n.setGain(i, value);
    setEqualizer(n, setFileContents);   
  }

  function reset() {
    const n = equalizerData.copy();
    n.gains = Array(equalizerData.gains.length).fill(0);
    if (equalizerData.context) {
      for (let i = 0; i < n.gains.length; i++) {
        n.effects[i].gain.value = 0;
      }
    }
    setEqualizer(n, setFileContents);
  }

  return (
    <div className="page-footer-equalizer">
      <p className="title">
        Equalizer (+- 15dB) Freqs (Hz) Reset: &nbsp;
        <button className='button' onClick={reset}>&nbsp;</button>
        </p>
      <div className="sliders">
        {equalizerData.gains.map((g, i) => {
          return (
            <div className="equalizer-slider" key={`equalizer${i}`}>
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
                onChange={(event) => handleChange(event, i)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
