import { GeneratorControl } from "classes/control";
import Track from "classes/track";
import { ChangeEvent } from "react";

export interface GeneratorControlDialogProps {
  control: GeneratorControl;
  list: string[];
  tracks: Track[];
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleListChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}

export default function GeneratorControlDialog(
  props: GeneratorControlDialogProps
): JSX.Element {
  const { control, list, tracks, handleChange, handleListChange } = props;
  return (
    <>
      <label style={{ display: "inline-grid" }}>
        &nbsp;Generator List&nbsp;
        <select
          name="list"
          multiple
          size={5}
          value={list}
          onChange={(e) => handleListChange(e)}
        >
          {tracks.map((t) =>
            t.generators.map((g) => (
              <option key={`generators-${g.name}`} value={g.name}>
                {g.name}
              </option>
            ))
          )}
        </select>
      </label>
      <label>
        &nbsp;Enable Noise&nbsp;
        <input
          name="noiseEnable"
          type="checkbox"
          checked={control.values.noiseEnable}
          onChange={(e) => handleChange(e)}
        />
      </label>
      <label>
        &nbsp;Enable Reverb&nbsp;
        <input
          name="reverbEnable"
          type="checkbox"
          checked={control.values.reverbEnable}
          onChange={(e) => handleChange(e)}
        />
      </label>
      <label>
        &nbsp;Enable Tremolo&nbsp;
        <input
          name="tremoloEnable"
          type="checkbox"
          checked={control.values.tremoloEnable}
          onChange={(e) => handleChange(e)}
        />
      </label>
      <label>
        &nbsp;Enable Vibrato&nbsp;
        <input
          name="vibratoEnable"
          type="checkbox"
          checked={control.values.vibratoEnable}
          onChange={(e) => handleChange(e)}
        />
      </label>
    </>
  );
}
