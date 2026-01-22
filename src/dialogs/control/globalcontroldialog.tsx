import { GlobalControl } from "classes/control";
import { ChangeEvent } from "react";

export interface GlobalControlDialogProps {
  control: GlobalControl;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}

export default function GlobalControlDialog(
  props: GlobalControlDialogProps
): JSX.Element {
  const { control, handleChange } = props;
  return (
    <>
      <label>
        &nbsp;Enable Reverb:&nbsp;
        <input
          name="reverbEnable"
          type="checkbox"
          checked={control.values.reverbEnable}
          onChange={(e) => handleChange(e)}
        />
      </label>
      <label>
        &nbsp;Enable Compressor:&nbsp;
        <input
          name="compressorEnable"
          type="checkbox"
          checked={control.values.compressorEnable}
          onChange={(e) => handleChange(e)}
        />
      </label>
      <label>
        &nbsp;Enable Equalizer:&nbsp;
        <input
          name="equalizerEnable"
          type="checkbox"
          checked={control.values.equalizerEnable}
          onChange={(e) => handleChange(e)}
        />
      </label>
      <label>
        &nbsp;Start Volume(dB):&nbsp;
        <input
          name="volumeStart"
          type="number"
          min={-10}
          max={10}
          value={control.values.volumeStart}
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
          value={control.values.volumeStop}
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
          value={control.values.volumeDuration}
          onChange={(e) => handleChange(e)}
        />
      </label>
    </>
  );
}
