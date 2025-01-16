import { ChangeEvent } from "react";
import Wiener from "../classes/wiener";
import { useCMGContext } from "../cmgcontext";
import { bankPresettoName, toNote } from "../sfcomponents/util";

// provides the form fields and validators for the sfperiodic generator
export interface WienerDialogProps {
  formData: Wiener;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}
const INPUTSIZE: number = 6;

export default function WienerDialog(props: WienerDialogProps): JSX.Element {
  const { formData, handleChange } = props;
  const { presets } = useCMGContext();

  return (
    <>
    <label>
      Random Seed:&nbsp;
      <input 
      name='seed'
      type='text'
      onChange={handleChange}
      value={formData.seed}/>
    </label>
      <label htmlFor="presetName">&nbsp;Preset:&nbsp;</label>
      <select
        name="presetName"
        onChange={handleChange}
        value={formData.presetName}
      >
        {presets
          .sort((a, b) => {
            if (a.header.bank < b.header.bank) return -1;
            if (a.header.bank > b.header.bank) return 1;
            return a.header.preset - b.header.preset;
          })
          .map((p) => {
            const pName = bankPresettoName(p);
            return (
              <option key={`preset-${pName}`} value={pName}>
                {pName}
              </option>
            );
          })}
      </select>
      <label>
        &nbsp;Looping?:&nbsp;
        <input
          name="isLooping"
          type="checkbox"
          checked={formData.isLooping ? true : false}
          onChange={handleChange}
        />
      </label>
      <hr />
      <label>
        Pitch - Initial Value:&nbsp;
        <input
          name="pitch.initialValue"
          size={INPUTSIZE}
          type="number"
          min={0}
          max={127}
          onChange={handleChange}
          value={formData.pitch.initialValue}
        />
        <span>
          {" "}
          {formData.pitch.initialValue > 0
            ? '('.concat(toNote(formData.pitch.initialValue)).concat(')')
            : null}
        </span>
      </label>
      <label>
        &nbsp;Alpha:&nbsp;
        <input
          name="pitch.alpha"
          size={INPUTSIZE}
          type="number"
          onChange={handleChange}
          value={formData.pitch.alpha}
        />
        <span> (midi/sec) </span>
      </label>
      <label>
        &nbsp;Sigma:&nbsp;
        <input
          name="pitch.sigma"
          size={INPUTSIZE}
          type="number"
          onChange={handleChange}
          value={formData.pitch.sigma}
        />
        <span> (midi/sqrt(sec)) </span>
      </label>
      <label>
        &nbsp;Low:&nbsp;
        <input
          name="pitch.lo"
          size={INPUTSIZE}
          type="number"
          min={0}
          max={127}
          onChange={handleChange}
          value={formData.pitch.lo}
        />
        <span>
          {" "}
          {formData.pitch.lo >= 0 ? '('.concat(toNote(formData.pitch.lo)).concat(')') : null}
        </span>
      </label>
      <label>
        &nbsp;High:&nbsp;
        <input
          name="pitch.hi"
          size={INPUTSIZE}
          type="number"
          min={0}
          max={127}
          onChange={handleChange}
          value={formData.pitch.hi}
        />
        <span>
          {" "}
          {formData.pitch.lo >= 0 ? '('.concat(toNote(formData.pitch.hi)).concat(')') : null}
        </span>
      </label>
      <br />
      <label>
        Speed - Initial Value:&nbsp;
        <input
          name="speed.initialValue"
          size={INPUTSIZE}
          type="number"
          min={1}
          max={1000}
          onChange={handleChange}
          value={formData.speed.initialValue}
        />
        <span> (BPM)</span>
      </label>
      <label>
        &nbsp;Alpha:&nbsp;
        <input
          name="speed.alpha"
          size={INPUTSIZE}
          type="number"
          onChange={handleChange}
          value={formData.speed.alpha}
        />
        <span> (BPM/sec) </span>
      </label>
      <label>
        &nbsp;Sigma:&nbsp;
        <input
          name="speed.sigma"
          size={INPUTSIZE}
          type="number"
          onChange={handleChange}
          value={formData.speed.sigma}
        />
        <span> (BPM/sqrt(sec)) </span>
      </label>
      <label>
        &nbsp;Low:&nbsp;
        <input
          name="speed.lo"
          size={INPUTSIZE}
          type="number"
          min={1}
          max={1000}
          onChange={handleChange}
          value={formData.speed.lo}
        />
        <span> (BPM) </span>
      </label>
      <label>
        &nbsp;High:&nbsp;
        <input
          name="speed.hi"
          size={INPUTSIZE}
          type="number"
          min={1}
          max={1000}
          onChange={handleChange}
          value={formData.speed.hi}
        />
        <span> (BPM) </span>
      </label>
      <br />
      <label>
        Volume - Initial Value:&nbsp;
        <input
          name="volume.initialValue"
          size={INPUTSIZE}
          type="number"
          min={0}
          max={10}
          onChange={handleChange}
          value={formData.volume.initialValue}
        />
        <span> (1-10) </span>
      </label>
      <label>
        &nbsp;Alpha:&nbsp;
        <input
          name="volume.alpha"
          size={INPUTSIZE}
          type="number"
          onChange={handleChange}
          value={formData.volume.alpha}
        />
        <span> (1/sec) </span>
      </label>
      <label>
        &nbsp;Sigma:&nbsp;
        <input
          name="volume.sigma"
          size={INPUTSIZE}
          type="number"
          onChange={handleChange}
          value={formData.volume.sigma}
        />
        <span> (1/sqrt(sec)) </span>
      </label>
      <label>
        &nbsp;Low:&nbsp;
        <input
          name="volume.lo"
          size={INPUTSIZE}
          type="number"
          min={0}
          max={10}
          onChange={handleChange}
          value={formData.volume.lo}
        />
        <span> (1-10) </span>
      </label>
      <label>
        &nbsp;High:&nbsp;
        <input
          name="volume.hi"
          size={INPUTSIZE}
          type="number"
          min={0}
          max={10}
          onChange={handleChange}
          value={formData.volume.hi}
        />
        <span> (1-10) </span>
      </label>
      <br />
      <label>
        Pan - Initial Value:&nbsp;
        <input
          name="pan.initialValue"
          size={INPUTSIZE}
          type="number"
          min={-1}
          max={1}
          step={0.1}
          onChange={handleChange}
          value={formData.pan.initialValue}
        />
        <span> (-1 - 1) </span>
      </label>
      <label>
        &nbsp;Alpha:&nbsp;
        <input
          name="pan.alpha"
          size={INPUTSIZE}
          type="number"
          onChange={handleChange}
          value={formData.pan.alpha}
        />
        <span> (1/sec) </span>
      </label>
      <label>
        &nbsp;Sigma:&nbsp;
        <input
          name="pan.sigma"
          size={INPUTSIZE}
          type="number"
          onChange={handleChange}
          value={formData.pan.sigma}
        />
        <span> (1/sqrt(sec)) </span>
      </label>
      <label>
        &nbsp;Low:&nbsp;
        <input
          name="pan.lo"
          size={INPUTSIZE}
          type="number"
          min={-1}
          max={1}
          step={0.1}
          onChange={handleChange}
          value={formData.pan.lo}
        />
        <span> (-1 - 1) </span>
      </label>
      <label>
        &nbsp;High:&nbsp;
        <input
          name="pan.hi"
          size={INPUTSIZE}
          type="number"
          min={-1}
          max={1}
          step={0.1}
          onChange={handleChange}
          value={formData.pan.hi}
        />
        <span> (-1 - 1) </span>
      </label>
    </>
  );
}

export function validateWienerValues(values: Wiener): string[] {
  const result: string[] = [];
  if (!values.presetName) result.push("PresetName must be specified");
  if (values.pitch.sigma < 0) result.push("Pitch sigma must be nonnegative");
  if (values.pitch.lo < 0 || values.pitch.hi <= values.pitch.lo)
    result.push(
      "Pitch low must be nonnegative and pitch high must be greater than pitch low"
    );
  if (values.speed.sigma < 0) result.push("Speed sigma must be nonnegative");
  if (values.speed.lo < 0 || values.speed.hi <= values.speed.lo)
    result.push(
      "Speed low must be nonnegative and speed high must be greater than speed low"
    );
  if (values.volume.sigma < 0) result.push("Volume sigma must be nonnegative");
  if (values.volume.lo < 0 || values.volume.hi <= values.volume.lo)
    result.push(
      "Volume low must be nonnegative and volume high must be greater than volume low"
    );
  if (values.pan.sigma < 0) result.push("pan sigma must be nonnegative");
  if (values.pan.lo < -1 || values.pan.hi <= values.pan.lo)
    result.push(
      "pan low must greater than or equal to -1 and pan high must be greater than pan low"
    );

  return result;
}
