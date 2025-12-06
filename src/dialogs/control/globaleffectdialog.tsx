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
        &nbsp;Enable Reverb:&nbsp;
        <input
          name="reverbEnable"
          type="checkbox"
          checked={effect.reverbEnable}
          onChange={(e) => handleChange(e)}
        />
      </label>
      <label>
        &nbsp;Enable Compressor:&nbsp;
        <input
          name="compressorEnable"
          type="checkbox"
          checked={effect.compressorEnable}
          onChange={(e) => handleChange(e)}
        />
      </label>
      <label>
        &nbsp;Enable Equalizer:&nbsp;
        <input
          name="equalizerEnable"
          type="checkbox"
          checked={effect.equalizerEnable}
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
