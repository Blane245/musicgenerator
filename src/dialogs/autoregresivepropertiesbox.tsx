import { ChangeEvent } from "react";
import { WienerType } from "types";

export interface AutoregressivePropertiesBoxProps {
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
export default function AutoregressivePropertiesBox(
  props: AutoregressivePropertiesBoxProps
) {
  const { name, values, min, max, step, valueSuffix, handleChange } = props;
  return (
    <div className="autoregressive">
      <div className="seedtitle">Seed</div>
      <div className="initialtitle">{"Initial Value "}</div>
      <div className="alphatitle">Alpha</div>
      <div className="sigmatitle">{"Dispersion"}</div>
      <div className="lotitle">{"Lo"}</div>
      <div className="hititle">{"Hi"}</div>
      <br />
      <div className="initialvalue">
        <input
          name={name.concat(".initialValue")}
          type="number"
          min={min}
          max={max}
          step={step}
          onChange={handleChange}
          value={values.initialValue}
        />
        <span style={{ fontSize: "small" }}>
          &nbsp;{valueSuffix(values.initialValue)}
        </span>
      </div>
      <div className="seed">
        <input
          name={name.concat(".seed")}
          type="string"
          onChange={handleChange}
          value={values.seed}
        />
      </div>
      <div className="alpha">
        <input
          name={name.concat(".alpha")}
          type="number"
          min={-1}
          max={1}
          step={step}
          onChange={handleChange}
          value={values.alpha}
        />
      </div>
      <div className="sigma">
        <input
          name={name.concat(".sigma")}
          type="number"
          min={0}
          max={100}
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
        <span style={{ fontSize: "small" }}>
          &nbsp;{valueSuffix(values.lo)}
        </span>
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
        <span style={{ fontSize: "small" }}>
          &nbsp;{valueSuffix(values.hi)}
        </span>
      </div>
    </div>
  );
}
