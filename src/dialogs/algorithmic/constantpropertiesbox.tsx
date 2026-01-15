import { ChangeEvent } from "react";
import { ConstantType } from "types";

export interface ConstantBoxProps {
  name: string;
  values: ConstantType;
  min: number;
  max: number;
  step: number;
  valueSuffix: (value?:number | undefined)=>string;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}
export default function ConstantPropertiesBox(props: ConstantBoxProps) {
  const { name, values, min, max, step, valueSuffix, handleChange } = props;
  return (
    <table>
      <thead>
        <tr>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <input
              name={name.concat(".value")}
              type="number"
              min={min}
              max={max}
              step={step}
              onChange={handleChange}
              value={values.value}
            />
            <span style={{ fontSize: "small" }}>
              &nbsp;{valueSuffix(values.value)}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
