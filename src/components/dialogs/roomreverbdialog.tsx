import { useCMGContext } from "../../contexts/cmgcontext";
import RoomReverb from "../../classes/roomreverb";
import { ChangeEvent, useEffect, useState } from "react";
import { setRoomReverb } from "../../utils/cmfiletransactions";

// TODO disable ReverbTime and delayTime during playback or record
export default function RoomReverbDialog() {
  const { setFileContents, fileContents } = useCMGContext();
  const [reverbData, setReverbData] = useState<RoomReverb>(
    new RoomReverb("roomreverb")
  );
  useEffect(() => {
    setReverbData(fileContents.reverb);
  }, [fileContents.reverb]);
  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    // update the form with the new attribute value
    const eventName: string | null = event.target["name"];
    const eventValue: string | null = event.target["value"];
    if (eventName && eventValue) {
      setReverbData((prev: RoomReverb) => {
        const newReverb = prev.copy();
        newReverb.setAttribute(eventName, eventValue);
        setRoomReverb(newReverb, setFileContents);
        return newReverb;
      });
    }
  }

  return (
    <div className="page-footer-reverb">
      <p className="title">
        Room Reverb Enable:{" "}
        <input
          name="roomreverb.enabled"
          checked={reverbData.enabled}
          onChange={handleChange}
          type="checkbox"
          style={{width: '10px', height: '10px'}}
        />
      </p>
      <div className="sliders">
        <div className="reverb-slider">
          <span className="param">Attack (sec)</span>
          <span className="param">{reverbData.attack}</span>
          <input
            name="roomreverb.attack"
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={reverbData.attack}
            onChange={handleChange}
          />
        </div>
        <br/>
        <div className="reverb-slider">
          <span className="param">Decay Time(sec)</span>
          <span className="param">{reverbData.decay}</span>
          <input
            name="roomreverb.decay"
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={reverbData.decay}
            onChange={handleChange}
          />
        </div>
        <br/>
        <div className="reverb-slider">
          <span className="param">Release (sec)</span>
          <span className="param">{reverbData.release}</span>
          <input
            name="roomreverb.release"
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={reverbData.release}
            onChange={handleChange}
          />
        </div>
        <br/>
        <div className="reverb-slider">
          <span className="param">Reverb Time (sec)</span>
          <span className="param">{reverbData.reverbTime}</span>
          <input
            name="roomreverb.reverbtime"
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={reverbData.reverbTime}
            onChange={handleChange}
          />
        </div>
        <br/>
        <div className="reverb-slider">
          <span className="param">Predelay Time (msec)</span>
          <span className="param">{reverbData.preDelayTime * 1000}</span>
          <input
            name="roomreverb.predelay"
            type="range"
            min="0"
            max="1000"
            step="10"
            value={reverbData.preDelayTime * 1000}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );
}
