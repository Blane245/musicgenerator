import { ChangeEvent } from "react";
import { WienerType } from "../types";

export interface WienerPropertiesBoxProps {
  name: string;
  values: WienerType;
  min: number;
  max: number;
  step: number;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}
export default function WienerPropertiesBox(props: WienerPropertiesBoxProps) {
  const { name, values, min, max, step, handleChange } = props;
  return (
    <div className="wiener">
      <div className="seed">Seed</div>
      <div className="initial">Initial Value</div>
      <div className="trend">Trend (1/sec)</div>
      <div className="dispersion">Dispersion (1/sqrt(sec))</div>
      <div className="lo">Lo</div>
      <div className="hi">Hi</div>
      <br />
      <div className="seed">
        <input
          name={name.concat(".seed")}
          type="string"
          onChange={handleChange}
          value={values.seed}
        />
      </div>
      <div className="initial">
        <input
          name={name.concat(".initialValue")}
          type="number"
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          value={values.initialValue}
        />
      </div>
      <div className="trend">
        <input
          name={name.concat(".alpha")}
          type="number"
          onChange={handleChange}
          value={values.alpha}
        />
      </div>
      <div className="dispersion">
        <input
          name={name.concat(".sigma")}
          type="number"
          min={0}
          max={10000}
          step={step}
          onChange={handleChange}
          value={values.sigma}
        />
      </div>
      <div className="lo">
        <input
          name={name.concat(".lo")}
          type="number"
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          value={values.lo}
        />
      </div>
      <div className="hi">
        <input
          name={name.concat(".hi")}
          type="number"
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          value={values.hi}
        />
      </div>
    </div>
  );
}
