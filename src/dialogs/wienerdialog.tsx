import { ChangeEvent, ChangeEventHandler } from "react";
import Wiener from "../classes/wiener";
import { useCMGContext } from "../cmgcontext";
import { bankPresettoName } from "../sfcomponents/util";
import { WienerParameters } from "types";

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
          name="seed"
          type="text"
          onChange={handleChange}
          value={formData.seed}
        />
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
      <div className="wiener-table">
        <div className="param">&nbsp;</div>
        <div className="param">Initial Value</div>
        <div className="param">Trend (1/sec)</div>
        <div className="param">Dispersion (1/sqrt(sec))</div>
        <div className="param">Low</div>
        <div className="param">High</div>
        <WienerInput
          name={"pitch"}
          parameters={formData.pitch}
          min={0}
          max={127}
          step={0.01}
          handleChange={handleChange}
        />
        <WienerInput
          name={"speed"}
          parameters={formData.speed}
          min={1}
          max={1000}
          step={1}
          handleChange={handleChange}
        />
        <WienerInput
          name={"volume"}
          parameters={formData.volume}
          min={-5}
          max={5}
          step={.1}
          handleChange={handleChange}
        />
        <WienerInput
          name={"pan"}
          parameters={formData.pan}
          min={-1}
          max={1}
          step={0.01}
          handleChange={handleChange}
        />
      </div>
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
  if (values.volume.lo < -5 || values.volume.hi <= values.volume.lo)
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

interface WienerInputProps {
  name: string;
  parameters: WienerParameters;
  min: number;
  max: number;
  step?: number;
  handleChange: ChangeEventHandler<HTMLInputElement>;
}
function WienerInput(props: WienerInputProps) {
  const { name, parameters, min, max, step, handleChange } = props;
  return (
    <>
      <div className="param">{name.toUpperCase()}</div>
      <div className="param">
        <input
          name={name.concat(".initialValue")}
          size={INPUTSIZE}
          type="number"
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          value={parameters.initialValue}
        />
      </div>
      <div className="param">
        <input
          name={name.concat(".alpha")}
          size={INPUTSIZE}
          type="number"
          onChange={handleChange}
          value={parameters.alpha}
        />
      </div>
      <div className="param">
        <input
          name={name.concat(".sigma")}
          size={INPUTSIZE}
          type="number"
          step={step}
          onChange={handleChange}
          value={parameters.sigma}
        />
      </div>
      <div className="param">
        <input
          name={name.concat(".lo")}
          size={INPUTSIZE}
          type="number"
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          value={parameters.lo}
        />
      </div>
      <div className="param">
        <input
          name={name.concat(".hi")}
          size={INPUTSIZE}
          type="number"
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          value={parameters.hi}
        />
      </div>
    </>
  );
}
