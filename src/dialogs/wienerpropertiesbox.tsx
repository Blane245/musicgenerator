import { ChangeEvent } from "react";
import { WienerType } from "../types";

export interface WienerPropertiesBoxProps {
  name: string;
  values: WienerType;
  min: number;
  max: number;
  step: number;
  valueSuffix: Function;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}
export default function WienerPropertiesBox(props: WienerPropertiesBoxProps) {
  const { name, values, min, max, step, valueSuffix, handleChange } = props;
  return (
    <div className="wiener">
      <div className="seedtitle">Seed</div>
      <div className="initialtitle">Initial Value</div>
      <div className="trendtitle">Trend (1/sec)</div>
      <div className="dispersiontitle">Dispersion (1/sqrt(sec))</div>
      <div className="lotitle">Lo</div>
      <div className="hititle">Hi</div>
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
          <span>{valueSuffix(values.initialValue)}</span>
          </div>
      <div className="trend">
        <input
          name={name.concat(".alpha")}
          type="number"
          min={-1000}
          max={1000}
          step={step}
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
