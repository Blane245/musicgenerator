import { ChangeEvent } from "react";
import { AutoregressiveType } from "types";
import { generateRandomString } from "utils/randomstring";

export interface AutoregressivePropertiesBoxProps {
  name: string;
  values: AutoregressiveType;
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
  function getSeed(): void {
    const newSeed: string = generateRandomString(15);
    const event: {} = {
      target: { name: name.concat(".seed"), value: newSeed, type: "string" },
    };
    handleChange(event as ChangeEvent<HTMLInputElement>);
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Seed</th>
          <th>Initial Value</th>
          <th>Alpha</th>
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
              &nbsp;{valueSuffix(values.initialValue)}
            </span>
          </td>
          <td>
            <input
              name={name.concat(".alpha")}
              type="number"
              min={-1}
              max={1}
              step={step}
              onChange={handleChange}
              value={values.alpha}
            />
            <span style={{ fontSize: "small" }}>
              &nbsp;{"(0-1)"}
            </span>
          </td>
          <td>
            <input
              name={name.concat(".sigma")}
              type="number"
              min={0}
              max={100}
              step={step}
              onChange={handleChange}
              value={values.sigma}
            />
            <span style={{ fontSize: "small" }}>
              &nbsp;{valueSuffix()}
            </span>
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
              &nbsp;{valueSuffix(values.lo)}
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
              &nbsp;{valueSuffix(values.hi)}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
