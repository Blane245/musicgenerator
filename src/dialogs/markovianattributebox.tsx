import { ChangeEvent } from "react";
import { MarkovianTransitons } from "../types";

export type MarkovianAttributeBoxProps = {
    name: string;
    startValueSuffix: Function;
    seed: string;
    min: number;
    max: number;
    step: number;
    transitions: MarkovianTransitons;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  };

export default function MarkovianAttributeBox(props: MarkovianAttributeBoxProps): JSX.Element {
    const {
      name,
      min,
      max,
      step,
      transitions,
      startValueSuffix,
      seed,
      handleChange,
    } = props;
    return (
      <div className="markovian">
        <div className='border'><hr/></div>
        <div className="seed">
          <label>
            Seed:&nbsp;
            <input
              name={name.concat(".seed")}
              type="string"
              onChange={handleChange}
              value={seed}
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
              value={transitions.startValue}
            />
            <span>{startValueSuffix(transitions.startValue)}</span>
          </label>
        </div>
        <div className="lo">
          <label>
            &nbsp;Lo:&nbsp;
            <input
              name={name.concat(".range.lo")}
              type="number"
              min={min}
              max={max}
              step={step}
              onChange={handleChange}
              value={transitions.range.lo}
            />
          </label>
        </div>
        <div className="hi">
          <label>
            &nbsp;Hi:&nbsp;
            <input
              name={name.concat(".range.hi")}
              type="number"
              min={min}
              max={max}
              step={step}
              onChange={handleChange}
              value={transitions.range.hi}
            />
          </label>
        </div>
        <div className="step">
          <label>
            &nbsp;Step:&nbsp;
            <input
              name={name.concat(".range.step")}
              type="number"
              min={min}
              max={max}
              step={step}
              onChange={handleChange}
              value={transitions.range.step}
            />
          </label>
        </div>
        <div className="transition">from\to</div>
        <div className="tosame">same</div>
        <div className="toup">up</div>
        <div className="todown">down</div>
        <div className="fromsame">same</div>
        <div className="fromup">up</div>
        <div className="fromdown">down</div>
        <div className="ss">
          <input
            name={name.concat(".same.same")}
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={transitions.same.same}
            onChange={handleChange}
          />
        </div>
        <div className="su">
          <input
            name={name.concat(".same.up")}
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={transitions.same.up}
            onChange={handleChange}
          />
        </div>
        <div className="sd">
          <input
            name={name.concat(".same.down")}
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={transitions.same.down}
            onChange={handleChange}
          />
        </div>
        <div className="us">
          <input
            name={name.concat(".up.same")}
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={transitions.up.same}
            onChange={handleChange}
          />
        </div>
        <div className="uu">
          <input
            name={name.concat(".up.up")}
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={transitions.up.up}
            onChange={handleChange}
          />
        </div>
        <div className="ud">
          <input
            name={name.concat(".up.down")}
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={transitions.up.down}
            onChange={handleChange}
          />
        </div>
        <div className="ds">
          <input
            name={name.concat(".down.same")}
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={transitions.down.same}
            onChange={handleChange}
          />
        </div>
        <div className="du">
          <input
            name={name.concat(".down.up")}
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={transitions.down.up}
            onChange={handleChange}
          />
        </div>
        <div className="dd">
          <input
            name={name.concat(".down.down")}
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={transitions.down.down}
            onChange={handleChange}
          />
        </div>
      </div>
    );
  }
