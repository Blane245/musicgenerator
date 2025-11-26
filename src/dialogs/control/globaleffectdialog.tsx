import { GlobalEffect } from "classes/control";
import { ChangeEvent } from "react";

export interface GlobalEffectDialogProps {
  effect: GlobalEffect;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}

export default function GlobalEffectDialog(
  props: GlobalEffectDialogProps
): JSX.Element {
  const { effect, handleChange } = props;
  return (
    <>
      <label>
        &nbsp;Enable Reverb&nbsp;
        <input
          name="reverbEnable"
          type="checkbox"
          checked={(effect as GlobalEffect).reverbEnable}
          onChange={(e) => handleChange(e)}
        />
      </label>
      <label>
        &nbsp;Enable Compressor&nbsp;
        <input
          name="compressorEnable"
          type="checkbox"
          checked={(effect as GlobalEffect).compressorEnable}
          onChange={(e) => handleChange(e)}
        />
      </label>
      <label>
        &nbsp;Enable Equalizer&nbsp;
        <input
          name="equalizerEnable"
          type="checkbox"
          checked={(effect as GlobalEffect).equalizerEnable}
          onChange={(e) => handleChange(e)}
        />
      </label>
      <label>
        &nbsp;Volume Ramp (dB/sec) &nbsp;
        <input
          name="volumeRamp"
          type="number"
          value={(effect as GlobalEffect).volumeRamp}
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
          value={(effect as GlobalEffect).volumeLimit}
          onChange={(e) => handleChange(e)}
        />
      </label>
    </>
  );
}
