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
      <label style={{ display: "inline-block", textAlign: "center" }}>
        Track List
        <select
          id={"tracklist"}
          name="list"
          multiple={true}
          value={list}
          onChange={(e) => handleListChange(e)}
          style={{ display: "inline-block" }}
        >
          {tracks.map((t) => (
            <option key={`tracks-${t.name}`} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        &nbsp;Volume Ramp (dB/sec) &nbsp;
        <input
          name="volumeRamp"
          type="number"
          value={effect.volumeRamp}
          onChange={(e) => handleChange(e)}
        />
      </label>
      <label>
        &nbsp;Volume Limit (dB)&nbsp;
        <input
          name="volumeLimit"
          type="number"
          min={-10}
          max={10}
          value={effect.volumeLimit}
          onChange={(e) => handleChange(e)}
        />
      </label>
    </>
  );
}
