import { ChangeEvent } from "react";
import SFRG from "../classes/sfrg";
import { useCMGContext } from "../cmgcontext";
import { bankPresettoName, toNote } from "../sfcomponents/util";
import { AttributeRange, EPS, RandomSFTransitons } from "../types";

// provides the form fields and validators for the sfrandom generator
export type SFRGDialogDialogProps = {
  formData: SFRG;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
};
export default function SFRGDialog(props: SFRGDialogDialogProps): JSX.Element {
  const { formData, handleChange } = props;
  const { presets } = useCMGContext();

  type TransitionBoxProps = {
    title: string;
    units: string;
    name: string; // midiT, etc.
    startValueSuffix: Function;
    min: number;
    max: number;
    step: number;
    transitions: RandomSFTransitons;
  };
  function TransitionBox(props: TransitionBoxProps): JSX.Element {
    const {
      title,
      units,
      name,
      min,
      max,
      step,
      transitions,
      startValueSuffix,
    } = props;
    return (
      <div className="sfrg-table">
        <div className='border'><hr/></div>
        <div className="title">
          <h3>{title}</h3>
          <h4>{'('.concat(units).concat(')')}</h4>
        </div>
        <div className="start">
          <label>
            Start:&nbsp;
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
  return (
    <>
      <label>
        &nbsp;Random Seed:&nbsp;
        <input
          name="seed"
          type="text"
          onChange={handleChange}
          value={formData.seed}
        />
      </label>
      <label>
        &nbsp;Preset:&nbsp;
        <select
          name="presetName"
          onChange={handleChange}
          value={formData.presetName}
        >
          {presets
            .sort((a, b) => {
              if (a.header.bank < b.header.bank) return -1;
              if (a.header.bank > b.header.bank) return 1;
              return a.header.preset - b.header.preset;
            })
            .map((p) => {
              const pName = bankPresettoName(p);
              return (
                <option key={`preset-${pName}`} value={pName}>
                  {pName}
                </option>
              );
            })}
        </select>
      </label>
      <label>
        &nbsp;Looping?:&nbsp;
        <input
          name="isLooping"
          type="checkbox"
          checked={formData.isLooping ? true : false}
          onChange={handleChange}
        />
      </label>
      <TransitionBox
        title="Midi Transitions"
        units="midi"
        name="midiT"
        min={0}
        max={127}
        step={1}
        transitions={formData.midiT}
        startValueSuffix={(value: number) => {
          if (value < 0) return "";
          else return " ".concat(toNote(value));
        }}
      />
      <TransitionBox
        title="Speed Transitions"
        units="BPM"
        name="speedT"
        min={1}
        max={500}
        step={1}
        transitions={formData.speedT}
        startValueSuffix={() => ""}
      />
      <TransitionBox
        title="Volume Transitions"
        units="-20 to +20"
        name="volumeT"
        min={-20}
        max={20}
        step={0.1}
        transitions={formData.volumeT}
        startValueSuffix={() => ""}
      />
      <TransitionBox
        title="Pan Transitions"
        units="-1 (left) to +1 (right)"
        name="panT"
        min={-1}
        max={1}
        step={0.1}
        transitions={formData.panT}
        startValueSuffix={() => ""}
      />
    </>
  );
}

// validate the fields returning each error as a text entry in the array

export function validateSFRGValues(formData: SFRG): string[] {
  const result: string[] = [];

  function validateCumulatives(
    name: string,
    transition: RandomSFTransitons
  ): void {
    let cum: number = 0;
    cum = transition.same.same + transition.same.up + transition.same.down;
    if (cum > 1.0 + EPS || cum < 1.0 - EPS)
      result.push(
        `${name} transition same probabilities add up to ${cum} and should be 1`
      );
    cum = transition.up.same + transition.up.up + transition.up.down;
    if (cum > 1.0 + EPS || cum < 1.0 - EPS)
      result.push(
        `${name} transition up probabilities add up to ${cum} and should be 1`
      );
    cum = transition.down.same + transition.down.up + transition.down.down;
    if (cum > 1.0 + EPS || cum < 1.0 - EPS)
      result.push(
        `${name} transition down probabilities add up to ${cum} and should be 1`
      );
  }
  function validateRange(
    name: string,
    startValue: number,
    range: AttributeRange
  ): void {
    if (range.hi < range.lo)
      result.push(`${name} range lo must be less than or equal to range hi`);
    if (range.step > range.hi - range.lo)
      result.push(
        `${name} step size must not exceed the difference between range lo and range hi`
      );
    if (startValue < range.lo || startValue > range.hi)
      result.push(`${name} start value must be between range lo and range hi`);
  }

  function validateProbabiltiesRange(
    name: string,
    transition: RandomSFTransitons
  ): void {
    if (transition.same.same < 0 || transition.same.same > 1)
      result.push(
        `${name} same->same probabilty must be between 0 and 1 inclusive`
      );
    if (transition.same.up < 0 || transition.same.up > 1)
      result.push(
        `${name} same->up probabilty must be between 0 and 1 inclusive`
      );
    if (transition.same.down < 0 || transition.same.down > 1)
      result.push(
        `${name} same->same probabilty must be between 0 and 1 inclusive`
      );
    if (transition.up.same < 0 || transition.up.same > 1)
      result.push(
        `${name} up->same probabilty must be between 0 and 1 inclusive`
      );
    if (transition.up.up < 0 || transition.up.up > 1)
      result.push(
        `${name} up->up probabilty must be between 0 and 1 inclusive`
      );
    if (transition.up.down < 0 || transition.up.down > 1)
      result.push(
        `${name} up->same probabilty must be between 0 and 1 inclusive`
      );
    if (transition.down.same < 0 || transition.down.same > 1)
      result.push(
        `${name} down->same probabilty must be between 0 and 1 inclusive`
      );
    if (transition.down.up < 0 || transition.down.up > 1)
      result.push(
        `${name} down->up probabilty must be between 0 and 1 inclusive`
      );
    if (transition.down.down < 0 || transition.down.down > 1)
      result.push(
        `${name} down->same probabilty must be between 0 and 1 inclusive`
      );
  }
  if (formData.seed == "") result.push("Random seed must not be blank");
  if (!formData.presetName) result.push("PresetName must be specified");
  if (formData.midiT.startValue < 0 || formData.midiT.startValue > 127)
    result.push("Midi number must be between 0 and 127");

  validateRange("midi", formData.midiT.startValue, formData.midiT.range);
  validateRange("speed", formData.speedT.startValue, formData.speedT.range);
  validateRange("volume", formData.volumeT.startValue, formData.volumeT.range);
  validateRange("pan", formData.panT.startValue, formData.panT.range);

  validateCumulatives("midi", formData.midiT);
  validateCumulatives("speed", formData.speedT);
  validateCumulatives("volume", formData.volumeT);
  validateCumulatives("pan", formData.panT);

  validateProbabiltiesRange("midi", formData.midiT);
  validateProbabiltiesRange("speed", formData.speedT);
  validateProbabiltiesRange("volume", formData.volumeT);
  validateProbabiltiesRange("pan", formData.panT);
  return result;
}
