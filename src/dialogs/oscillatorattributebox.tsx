import { ChangeEvent } from "react";
import { ModulationAttributeData, MODULATOR } from "../types";

type OscillatorAttributeBoxProps = {
  name: string;
  type: string;
  frequency: ModulationAttributeData;
  center: ModulationAttributeData;
  amplitude: ModulationAttributeData;
  phase: ModulationAttributeData;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
};

// build and manage the ui for oscillator attributes
export default function OscillatorAttributeBox(
  props: OscillatorAttributeBoxProps
): JSX.Element {
  const { name, type, center, frequency, amplitude, phase, handleChange } =
    props;
  return (
    <>
      <div className="oscillator">
        <div className="type">Type</div>
        <div className="center">Center</div>
        <div className="frequency">Frequency (mHz)</div>
        <div className="amplitude">Amplitude</div>
        <div className="phase">Phase (deg)</div>
        <br />
        <div className="type">
          <label>
            Type
            <select
              name={name.concat(".type")}
              onChange={handleChange}
              value={type}
            >
              {Object.keys(MODULATOR).map((t) => {
                if (!parseInt(t) && t != "0")
                  return (
                    <option key={name.concat("-").concat(t.toString())}>
                      {t}
                    </option>
                  );
              })}
            </select>
          </label>
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
          <span style={{ fontSize: "small" }}>&nbsp;{center.suffix}</span>
        </div>
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
        <span style={{ fontSize: "small" }}>&nbsp;{frequency.suffix}</span>
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
        <span style={{ fontSize: "small" }}>&nbsp;{phase.suffix}</span>
      </div>
    </>
  );
}
