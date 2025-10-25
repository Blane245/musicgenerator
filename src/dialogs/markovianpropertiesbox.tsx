import { ChangeEvent } from "react";
import { MarkovianType } from "types";

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
  const { name, values, min, max, step, valueSuffix, handleChange } =
    props;
  return (
    <div className="markovian">
      <div className="seed">
        <label>
          Seed:&nbsp;
          <input
            name={name.concat(".seed")}
            type="string"
            onChange={handleChange}
            value={values.seed}
          />
        </label>
      </div>
      <div className="start">
        <label>
          &nbsp;Start:&nbsp;
          <input
            name={name.concat(".startValue")}
            type="number"
            min={min}
            max={max}
            step={step}
            onChange={handleChange}
            value={values.startValue}
          />
          <span style={{ fontSize: "small" }}>{valueSuffix(values.startValue)}</span>
        </label>
      </div>
      <div className="lo">
        <label>
          &nbsp;Lo:&nbsp;
          <input
            name={name.concat(".range-lo")}
            type="number"
            min={min}
            max={max}
            step={step}
            onChange={handleChange}
            value={values.range.lo}
          />
          <span style={{ fontSize: "small" }}>{valueSuffix(values.range.lo)}</span>
          </label>
      </div>
      <div className="hi">
        <label>
          &nbsp;Hi:&nbsp;
          <input
            name={name.concat(".range-hi")}
            type="number"
            min={min}
            max={max}
            step={step}
            onChange={handleChange}
            value={values.range.hi}
          />
          <span style={{ fontSize: "small" }}>{valueSuffix(values.range.hi)}</span>
          </label>
      </div>
      <div className="step">
        <label>
          &nbsp;Step:&nbsp;
          <input
            name={name.concat(".range-step")}
            type="number"
            min={min}
            max={max}
            step={step}
            onChange={handleChange}
            value={values.range.step}
          />
        </label>
      </div>
      <div className="transition">{"from/to"}</div>
      <div className="tosame">same</div>
      <div className="toup">up</div>
      <div className="todown">down</div>
      <div className="fromsame">same</div>
      <div className="fromup">up</div>
      <div className="fromdown">down</div>
      <div className="ss">
        <input
          name={name.concat(".same-same")}
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={values.same.same}
          onChange={handleChange}
        />
      </div>
      <div className="su">
        <input
          name={name.concat(".same-up")}
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={values.same.up}
          onChange={handleChange}
        />
      </div>
      <div className="sd">
        <input
          name={name.concat(".same-down")}
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={values.same.down}
          onChange={handleChange}
        />
      </div>
      <div className="us">
        <input
          name={name.concat(".up-same")}
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={values.up.same}
          onChange={handleChange}
        />
      </div>
      <div className="uu">
        <input
          name={name.concat(".up-up")}
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={values.up.up}
          onChange={handleChange}
        />
      </div>
      <div className="ud">
        <input
          name={name.concat(".up-down")}
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={values.up.down}
          onChange={handleChange}
        />
      </div>
      <div className="ds">
        <input
          name={name.concat(".down-same")}
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={values.down.same}
          onChange={handleChange}
        />
      </div>
      <div className="du">
        <input
          name={name.concat(".down-up")}
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={values.down.up}
          onChange={handleChange}
        />
      </div>
      <div className="dd">
        <input
          name={name.concat(".down-down")}
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={values.down.down}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
