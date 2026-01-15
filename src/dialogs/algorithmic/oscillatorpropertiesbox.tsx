import { ChangeEvent } from "react";
import { MODULATOR, ModulatorAttributeData } from "types";

type OscillatorProperitesBoxProps = {
  name: string;
  type: string;
  frequency: ModulatorAttributeData;
  center: ModulatorAttributeData;
  centerSuffix: (value?:number | undefined)=>string;
  amplitude: ModulatorAttributeData;
  phase: ModulatorAttributeData;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
};

// build and manage the ui for oscillator attributes
export default function OscillatorPropertiesBox(
  props: OscillatorProperitesBoxProps
): JSX.Element {
  const {
    name,
    type,
    center,
    centerSuffix,
    frequency,
    amplitude,
    phase,
    handleChange,
  } = props;
  return (
    <table>
      <thead>
        <tr>
          <th>Modulator</th>
          <th>Center</th>
          <th>Frequency</th>
          <th>Amplitude</th>
          <th>Phase</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <select
              name={name.concat(".type")}
              onChange={handleChange}
              value={type}
            >
              {Object.keys(MODULATOR).map((t) => {
                return (
                  <option key={name.concat("-").concat(t.toString())}>
                    {t}
                  </option>
                );
              })}
            </select>
          </td>
          <td>
            <input
              name={name.concat(".center")}
              type="number"
              min={center.lo}
              max={center.hi}
              step={center.step}
              onChange={handleChange}
              value={center.value}
            />
            <span style={{ fontSize: "small" }}>
              &nbsp;{centerSuffix(center.value)}
            </span>
          </td>
          <td>
            <input
              name={name.concat(".frequency")}
              type="number"
              min={frequency.lo}
              max={frequency.hi}
              step={frequency.step}
              onChange={handleChange}
              value={frequency.value}
            />
            <span style={{ fontSize: "small" }}>&nbsp;{frequency.suffix}</span>
          </td>
          <td>
            <input
              name={name.concat(".amplitude")}
              type="number"
              min={amplitude.lo}
              max={amplitude.hi}
              step={amplitude.step}
              onChange={handleChange}
              value={amplitude.value}
            />
            <span style={{ fontSize: "small" }}>&nbsp;{amplitude.suffix}</span>
          </td>
          <td>
            <input
              name={name.concat(".phase")}
              type="number"
              min={phase.lo}
              max={phase.hi}
              step={phase.step}
              onChange={handleChange}
              value={phase.value}
            />
            <span style={{ fontSize: "small" }}>&nbsp;{phase.suffix}</span>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
