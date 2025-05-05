import { ChangeEvent } from "react";
import { ModulatorAttributeData, MODULATOR } from "../types";

type OscillatorProperitesBoxProps = {
  name: string;
  type: string;
  frequency: ModulatorAttributeData;
  center: ModulatorAttributeData;
  centerSuffix: Function;
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
  const { name, type, center, centerSuffix, frequency, amplitude, phase, handleChange } =
    props;
  return (
    <div className="oscillator">
      <div className="typetitle">Modulator</div>
      <div className="centertitle">Center</div>
      <div className="frequencytitle">Frequency (mHz)</div>
      <div className="amplitudetitle">Amplitude</div>
      <div className="phasetitle">Phase (deg)</div>
      <div className="type">
        <select
          name={name.concat(".type")}
          onChange={handleChange}
          value={type}
        >
          {Object.keys(MODULATOR).map((t) => {
            return (
              <option key={name.concat("-").concat(t.toString())}>{t}</option>
            );
          })}
        </select>
      </div>
      <div className="center">
        <input
          name={name.concat(".center")}
          type="number"
          min={center.lo}
          max={center.hi}
          step={center.step}
          onChange={handleChange}
          value={center.value}
        />
        <span style={{ fontSize: "small" }}>&nbsp;{centerSuffix(center.value)}</span>
      </div>
      <div className="frequency">
        <input
          name={name.concat(".frequency")}
          type="number"
          min={frequency.lo}
          max={frequency.hi}
          step={frequency.step}
          onChange={handleChange}
          value={frequency.value}
        />
        {/* <span style={{ fontSize: "small" }}>&nbsp;{frequency.suffix}</span> */}
      </div>
      <div className="amplitude">
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
      </div>
      <div className="phase">
        <input
          name={name.concat(".phase")}
          type="number"
          min={phase.lo}
          max={phase.hi}
          step={phase.step}
          onChange={handleChange}
          value={phase.value}
        />
        {/* <span style={{ fontSize: "small" }}>&nbsp;{phase.suffix}</span> */}
      </div>
    </div>
  );
}
