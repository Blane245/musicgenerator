import { ChangeEvent } from "react";
import { WienerType } from "types";
import { generateRandomString } from "utils/randomstring";

export interface WienerPropertiesBoxProps {
  name: string;
  values: WienerType;
  min: number;
  max: number;
  step: number;
  valueSuffix: (value?:number | undefined)=>string;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}
export default function WienerPropertiesBox(props: WienerPropertiesBoxProps) {
  const { name, values, min, max, step, valueSuffix, handleChange } = props;
  function getSeed(): void {
    const newSeed: string = generateRandomString(15);
    const event = {
      target: { name: name.concat(".seed"), value: newSeed, type: "string" },
    };
    handleChange(event as ChangeEvent<HTMLInputElement>);
  }

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Seed</th>
            <th>Initial Value</th>
            <th>Trend</th>
            <th>Dispersion</th>
            <th>Lo</th>
            <th>Hi</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <button
                type="button"
                onClick={() => getSeed()}
                style={{ fontSize: "10px" }}
              >
                New Seed
              </button>
              <input
                name={name.concat(".seed")}
                type="string"
                onChange={handleChange}
                value={values.seed}
              />
            </td>
            <td>
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
                {valueSuffix(values.initialValue)}
              </span>
            </td>
            <td>
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
            </td>
            <td>
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
            </td>
            <td>
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
                {valueSuffix(values.lo)}
              </span>
            </td>
            <td>
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
                {valueSuffix(values.hi)}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}
