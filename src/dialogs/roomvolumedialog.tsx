import { ChangeEvent, useEffect, useState } from "react";
import Volume from "../classes/volume";
import { useCMGContext } from "../cmgcontext";
import { setVolume } from "../utils/cmfiletransactions";

export default function RoomVolumeDialog() {
  const { fileContents, setFileContents } = useCMGContext();
  const [volumeData, setVolumeData] = useState<Volume>(new Volume("volume"));

  useEffect(() => {
    setVolumeData(fileContents.volume);
  }, [fileContents.volume]);

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const value: number = parseFloat(event.target["value"]);
    const n: Volume = volumeData.copy();
    n.setVolume(value);
    setVolume(n, setFileContents);
  }

  return (
    <div className="page-footer-volume">
      <p className="title">{`Volume ${volumeData.volume}`}</p>
      <div className="volume-slider" key={`roomvolume`}>
        <input
          type="range"
          min="-5"
          max="5"
          step="1"
          value={volumeData.volume}
          onChange={(event) => handleChange(event)}
        />
      </div>
    </div>
  );
}
