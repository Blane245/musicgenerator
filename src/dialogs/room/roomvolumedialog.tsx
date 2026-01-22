import Volume from "classes/roomnodes/volume";
import { useCMGContext } from "cmgcontext";
import { ChangeEvent, useEffect, useState } from "react";
import { setVolume } from "utils/cmfiletransactions";

export default function RoomVolumeDialog() {
  const { fileContents, setFileContents } = useCMGContext();
  const [volumeData, setVolumeData] = useState<Volume>(new Volume());

  useEffect(() => {
    setVolumeData(fileContents.volume);
  }, [fileContents.volume]);

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const value: number = parseFloat(event.target["value"]);
    if (!volumeData.effect) {
      const n: Volume = volumeData.copy();
      n.setVolume(value);
      setVolume(n, setFileContents);
    } else {
      volumeData.setVolume(value);
    }
  }

  return (
    <div className="volume">
      <p className="title">{`Volume`}</p>
      <div className="sliders">
        <div className="slider" key={`roomvolume`}>
          <span className="param">{"dB"}</span>
          <span className="param">{volumeData.volume.toFixed(1)}</span>
          <input
            type="range"
            min={-10}
            max={10}
            step={1}
            value={volumeData.volume}
            onChange={(event) => handleChange(event)}
          />
        </div>
      </div>
    </div>
  );
}
