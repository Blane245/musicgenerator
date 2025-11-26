import { GeneratorEffect } from "classes/control";
import Track from "classes/track";
import { ChangeEvent } from "react";
import { toNote } from "sfcomponents/util";

export interface GeneratorEffectDialogProps {
  effect: GeneratorEffect;
  list: string[];
  tracks: Track[];
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleListChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}

export default function GeneratorEffectDialog(
  props: GeneratorEffectDialogProps
): JSX.Element {
  const { effect, list, tracks, handleChange, handleListChange } = props;
  return (
             <>
                  <label>
                    &nbsp;Generator List&nbsp;
                    <select
                      name="list"
                      multiple
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
                    checked={effect.noiseEnable}
                    onChange={(e) => handleChange(e)}
                  />
                </label>
                <label>
                  &nbsp;Enable Reverb&nbsp;
                  <input
                    name="reverbEnable"
                    type="checkbox"
                    checked={effect.reverbEnable}
                    onChange={(e) => handleChange(e)}
                  />
                </label>
                <label>
                  &nbsp;Enable Tremelo&nbsp;
                  <input
                    name="tremoloEnable"
                    type="checkbox"
                    checked={effect.tremoloEnable}
                    onChange={(e) => handleChange(e)}
                  />
                </label>
                <label>
                  &nbsp;Enable Vibrato&nbsp;
                  <input
                    name="vibratoEnable"
                    type="checkbox"
                    checked={effect.vibratoEnable}
                    onChange={(e) => handleChange(e)}
                  />
                </label>
                <label>
                  &nbsp;Enable Reverse Sequence&nbsp;
                  <input
                    name="reverseSequence"
                    type="checkbox"
                    checked={
                      effect.reverseSequence
                    }
                    onChange={(e) => handleChange(e)}
                  />
                </label>
                <label>
                  &nbsp;Enable Reflect Sequence&nbsp;
                  <input
                    name="reflectSequence"
                    type="checkbox"
                    checked={
                      effect.reflectSequence
                    }
                    onChange={(e) => handleChange(e)}
                  />
                </label>
                <label>
                  &nbsp;Reflection Pitch&nbsp;
                  <input
                    name="reflectPitch"
                    type="number"
                    min={0}
                    max={127}
                    step={0.01}
                    value={effect.reflectPitch}
                    onChange={(e) => handleChange(e)}
                  />
                  <span>
                    &nbsp;
                    {toNote(effect.reflectPitch)}
                  </span>
                </label>
              </>
  );
}
