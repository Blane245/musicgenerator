import { ChangeEvent } from "react";
import { WienerType } from "types";
import { generateRandomString } from "utils/randomstring";

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
    function getSeed(): void {
      const newSeed:string = generateRandomString(15);
      const event:{} = {target: {name:name.concat(".seed"), value:newSeed, type:'string'}}
      handleChange(event as ChangeEvent<HTMLInputElement>);
    }
  
  return (
    <div className="wiener">
      <div className="seedtitle">Seed</div>
      <div className="initialtitle">Initial Value</div>
      <div className="trendtitle">Trend</div>
      <div className="dispersiontitle">Dispersion</div>
      <div className="lotitle">Lo</div>
      <div className="hititle">Hi</div>
      <br />
      <div className="seed">
        <button type="button" onClick={()=>getSeed()} style={{fontSize:'10px'}}>
          New Seed
        </button>
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
        <span style={{ fontSize: "small" }}>{valueSuffix(values.initialValue)}</span>
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
        <span style={{ fontSize: "small" }}>&nbsp;1/sec</span>
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
        <span style={{ fontSize: "small" }}>&nbsp;1/sqrt(sec)</span>
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
        <span style={{ fontSize: "small" }}>{valueSuffix(values.lo)}</span>
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
        <span style={{ fontSize: "small" }}>{valueSuffix(values.hi)}</span>
      </div>
    </div>
  );
}
