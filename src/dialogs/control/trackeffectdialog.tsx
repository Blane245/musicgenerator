import { TrackEffect } from "classes/control";
import Track from "classes/track";
import { ChangeEvent } from "react";

export interface TrackEffectDialogProps {
  effect: TrackEffect;
  list: string[];
  tracks: Track[];
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleListChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}

export default function TrackEffectDialog(
  props: TrackEffectDialogProps
): JSX.Element {
  const { effect, list, tracks, handleChange, handleListChange } = props;
  return (
    <>
      <label style={{ display: "inline-grid", textAlign: "center" }}>
        Track List
        <select
          id={"tracklist"}
          name="list"
          multiple={true}
          size={5}
          value={list}
          onChange={(e) => handleListChange(e)}
        >
          {tracks.map((t) => (
            <option key={`tracks-${t.name}`} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        &nbsp;Start Volume(dB):&nbsp;
        <input
          name="volumeStart"
          type="number"
          min={-10}
          max={10}
          value={effect.volumeStart}
          onChange={(e) => handleChange(e)}
        />
      </label>
      <label>
        &nbsp;End Volume(dB):&nbsp;
        <input
          name="volumeStop"
          type="number"
          min={-10}
          max={10}
          value={effect.volumeStop}
          onChange={(e) => handleChange(e)}
        />
      </label>
      <label>
        &nbsp;Duration (sec)&nbsp;
        <input
          name="volumeDuration"
          type="number"
          min={0}
          max={1000}
          value={effect.volumeDuration}
          onChange={(e) => handleChange(e)}
        />
      </label>
    </>
  );
}
