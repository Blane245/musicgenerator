import { ChangeEvent } from "react";
import { MarkovianType } from "types";
import { generateRandomString } from "utils/randomstring";

export type MarkovianPropertiesBoxProps = {
  name: string;
  values: MarkovianType;
  valueSuffix: Function;
  min: number;
  max: number;
  step: number;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
};

export default function MarkovianPropertiesBox(
  props: MarkovianPropertiesBoxProps
): JSX.Element {
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
          <th>Start</th>
          <th>Lo</th>
          <th>Hi</th>
          <th>Step</th>
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
              type="text"
              onChange={handleChange}
              value={values.seed}
            />
          </td>
          <td>
            <input
              name={name.concat(".startValue")}
              type="number"
              min={min}
              max={max}
              step={step}
              onChange={handleChange}
              value={values.startValue}
            />
            <span style={{ fontSize: "small" }}>
              {valueSuffix(values.startValue)}
            </span>
          </td>
          <td>
            <input
              name={name.concat(".range-lo")}
              type="number"
              min={min}
              max={max}
              step={step}
              onChange={handleChange}
              value={values.range.lo}
            />
            <span style={{ fontSize: "small" }}>
              {valueSuffix(values.range.lo)}
            </span>
          </td>
          <td>
            <input
              name={name.concat(".range-hi")}
              type="number"
              min={min}
              max={max}
              step={step}
              onChange={handleChange}
              value={values.range.hi}
            />
            <span style={{ fontSize: "small" }}>
              {valueSuffix(values.range.hi)}
            </span>
          </td>
          <td>
            <input
              name={name.concat(".range-step")}
              type="number"
              min={min}
              max={max}
              step={step}
              onChange={handleChange}
              value={values.range.step}
            />
            <span style={{ fontSize: "small" }}>
              {valueSuffix(values.range.step)}
            </span>
          </td>
        </tr>
      </tbody>
      <thead>
        <tr>
          <th>from/to</th>
          <th>Same</th>
          <th>Up</th>
          <th>Down</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>Same</th>
          <td>
            <input
              name={name.concat(".same-same")}
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={values.same.same}
              onChange={handleChange}
            />
          </td>
          <td>
            <input
              name={name.concat(".same-up")}
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={values.same.up}
              onChange={handleChange}
            />
          </td>
          <td>
            <input
              name={name.concat(".same-down")}
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={values.same.down}
              onChange={handleChange}
            />
          </td>
        </tr>
        <tr>
          <th>Up</th>
          <td>
            <input
              name={name.concat(".up-same")}
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={values.up.same}
              onChange={handleChange}
            />
          </td>
          <td>
            <input
              name={name.concat(".up-up")}
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={values.up.up}
              onChange={handleChange}
            />
          </td>
          <td>
            <input
              name={name.concat(".up-down")}
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={values.up.down}
              onChange={handleChange}
            />
          </td>
        </tr>
        <tr>
          <th>Down</th>
          <td>
            <input
              name={name.concat(".down-same")}
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={values.down.same}
              onChange={handleChange}
            />
          </td>
          <td>
            <input
              name={name.concat(".down-up")}
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={values.down.up}
              onChange={handleChange}
            />
          </td>
          <td>
            <input
              name={name.concat(".down-down")}
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={values.down.down}
              onChange={handleChange}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
}
