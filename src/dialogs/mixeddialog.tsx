import { ChangeEvent } from "react";
import Mixed from "../classes/mixed";
import { useCMGContext } from "../cmgcontext";
import { bankPresettoName, toNote } from "../sfcomponents/util";
import { PARAMETERMODULATOR } from "types";
import OscillatorAttributeBox from "./oscillatorattributebox";
import {
  EuclideanValues,
  MarkovianValues,
  OscillatorValues,
  WienerValues,
} from "../classes/parametervalues";
import MarkovianAttributeBox from "./markovianattributebox";
import WienerAttributeBox from "./wienerattributebox";
import EuclideanAttributeBox from "./euclideanattributebox";

// provides the form fields and validators for the sfperiodic generator
export interface MixedDialogProps {
  formData: Mixed;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}
export default function MixedDialog(props: MixedDialogProps): JSX.Element {
  const { formData, handleChange } = props;
  const { presets} = useCMGContext();

  return (
    <>
      <label htmlFor="presetName">Preset:&nbsp;</label>
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
      <label>
        &nbsp;Looping?:&nbsp;
        <input
          name="isLooping"
          type="checkbox"
          checked={formData.isLooping ? true : false}
          onChange={handleChange}
        />
      </label>
      <label>
        &nbsp;Interval:&nbsp;
        <input
          name="duration"
          value={formData.duration}
          onChange={handleChange}
          type="number"
          min={0.1}
          max={100}
          step={0.1}
        />
        <span> (s)</span>
      </label>
      <hr />
      <div className="mixed-table">
        <div className="attribute">Note (midi)</div>
        <div className="gentype">
          <label>
            Generator:&nbsp;
            <select
              name="noteP.parameterType"
              onChange={handleChange}
              value={formData.noteP.parameterType}
            >
              {Object.values(PARAMETERMODULATOR).map((p) => {
                return (
                  <option key={`notePmodulator-${p}`} value={p}>
                    {p}
                  </option>
                );
              })}
            </select>
          </label>
        </div>
        <div className="parameters"></div>
        {/* build oscillator, markovian, wiener, or euclidean box */}
        {formData.noteP.parameterType == PARAMETERMODULATOR.Oscillator ? (
          <OscillatorAttributeBox
            name="noteP.values"
            type={(formData.noteP as OscillatorValues).values.type}
            center={{
              value: (formData.noteP as OscillatorValues).values.center,
              lo: 0,
              hi: 127,
              step: 1,
              suffix: "(0 to 127)",
            }}
            frequency={{
              value: (formData.noteP as OscillatorValues).values.frequency,
              lo: 0,
              hi: 1000000,
              step: 1,
              suffix: "(mHz)",
            }}
            amplitude={{
              value: (formData.noteP as OscillatorValues).values.amplitude,
              lo: 0,
              hi: 127,
              step: 1,
              suffix: "(midi)",
            }}
            phase={{
              value: (formData.noteP as OscillatorValues).values.phase,
              lo: -360,
              hi: 360,
              step: 1,
              suffix: "(degrees)",
            }}
            handleChange={handleChange}
          />
        ) : null}
        {formData.noteP.parameterType == PARAMETERMODULATOR.Markovian ? (
          <MarkovianAttributeBox
            name="noteP.values"
            startValueSuffix={(value: number) => {
              if (value < 0) return "";
              else return " ".concat(toNote(value));
            }}
            seed={(formData.noteP as MarkovianValues).seed}
            handleChange={handleChange}
            min={0}
            max={127}
            step={1}
            transitions={(formData.noteP as MarkovianValues).values}
          />
        ) : null}
        {formData.noteP.parameterType == PARAMETERMODULATOR.Wiener ? (
          <WienerAttributeBox
            name="noteP.values"
            seed={(formData.noteP as WienerValues).seed}
            parameters={(formData.noteP as WienerValues).values}
            handleChange={handleChange}
            min={0}
            max={127}
            step={1}
          />
        ) : null}
        {formData.noteP.parameterType == PARAMETERMODULATOR.Euclidean ? (
          <EuclideanAttributeBox
            name="noteP.values"
            parameter={(formData.noteP as EuclideanValues).parameter}
            handleChange={handleChange}
          />
        ) : null}
      </div>
      <hr/>
      <div className="mixed-table">
        <div className="attribute">Speed (BPM)</div>
        <div className="gentype">
          <label>
            Generator:&nbsp;
            <select
              name="speedP.parameterType"
              onChange={handleChange}
              value={formData.speedP.parameterType}
            >
              {Object.values(PARAMETERMODULATOR).map((p) => {
                if (p != PARAMETERMODULATOR.Euclidean)
                return (
                  <option key={`speedPmodulator-${p}`} value={p}>
                    {p}
                  </option>
                );
              })}
            </select>
          </label>
        </div>
        <div className="parameters"></div>
        {formData.speedP.parameterType == PARAMETERMODULATOR.Oscillator ? (
          <OscillatorAttributeBox
            name="speedP.values"
            type={(formData.speedP as OscillatorValues).values.type}
            center={{
              value: (formData.speedP as OscillatorValues).values.center,
              lo: 1,
              hi: 1000,
              step: 1,
              suffix: "(BPM)",
            }}
            frequency={{
              value: (formData.speedP as OscillatorValues).values.frequency,
              lo: 0,
              hi: 1000000,
              step: 1,
              suffix: "(mHz)",
            }}
            amplitude={{
              value: (formData.speedP as OscillatorValues).values.amplitude,
              lo: 1,
              hi: 1000,
              step: 1,
              suffix: "(BPM)",
            }}
            phase={{
              value: (formData.speedP as OscillatorValues).values.phase,
              lo: -360,
              hi: 360,
              step: 1,
              suffix: "(degrees)",
            }}
            handleChange={handleChange}
          />
        ) : null}
        {formData.speedP.parameterType == PARAMETERMODULATOR.Markovian ? (
          <MarkovianAttributeBox
            name="speedP.values"
            startValueSuffix={() => {return ""}}
            seed={(formData.speedP as MarkovianValues).seed}
            handleChange={handleChange}
            min={1}
            max={1000}
            step={1}
            transitions={(formData.speedP as MarkovianValues).values}
          />
        ) : null}
        {formData.speedP.parameterType == PARAMETERMODULATOR.Wiener ? (
          <WienerAttributeBox
            name="speedP.values"
            seed={(formData.speedP as WienerValues).seed}
            parameters={(formData.speedP as WienerValues).values}
            handleChange={handleChange}
            min={0}
            max={127}
            step={1}
          />
        ) : null}
      </div>
      <hr/>
      <div className="mixed-table">
        <div className="attribute">Volume (dB)</div>
        <div className="gentype">
          <label>
            Generator:&nbsp;
            <select
              name="volumeP.parameterType"
              onChange={handleChange}
              value={formData.volumeP.parameterType}
            >
              {Object.values(PARAMETERMODULATOR).map((p) => {
                if (p != PARAMETERMODULATOR.Euclidean)
                return (
                  <option key={`volumePmodulator-${p}`} value={p}>
                    {p}
                  </option>
                );
              })}
            </select>
          </label>
        </div>
        <div className="parameters"></div>
        {formData.volumeP.parameterType == PARAMETERMODULATOR.Oscillator ? (
          <OscillatorAttributeBox
            name="volumeP.values"
            type={(formData.volumeP as OscillatorValues).values.type}
            center={{
              value: (formData.volumeP as OscillatorValues).values.center,
              lo: -20,
              hi: 20,
              step: 1,
              suffix: "(dB)",
            }}
            frequency={{
              value: (formData.volumeP as OscillatorValues).values.frequency,
              lo: 0,
              hi: 1000000,
              step: 1,
              suffix: "(mHz)",
            }}
            amplitude={{
              value: (formData.volumeP as OscillatorValues).values.amplitude,
              lo: -20,
              hi: 20,
              step: 1,
              suffix: "(dB)",
            }}
            phase={{
              value: (formData.volumeP as OscillatorValues).values.phase,
              lo: -360,
              hi: 360,
              step: 1,
              suffix: "(degrees)",
            }}
            handleChange={handleChange}
          />
        ) : null}
        {formData.volumeP.parameterType == PARAMETERMODULATOR.Markovian ? (
          <MarkovianAttributeBox
            name="volumeP.values"
            startValueSuffix={() => {return ""}}
            seed={(formData.volumeP as MarkovianValues).seed}
            handleChange={handleChange}
            min={-20}
            max={20}
            step={1}
            transitions={(formData.volumeP as MarkovianValues).values}
          />
        ) : null}
        {formData.volumeP.parameterType == PARAMETERMODULATOR.Wiener ? (
          <WienerAttributeBox
            name="volumeP.values"
            seed={(formData.volumeP as WienerValues).seed}
            parameters={(formData.volumeP as WienerValues).values}
            handleChange={handleChange}
            min={-20}
            max={20}
            step={1}
          />
        ) : null}
      </div>
      <hr/>
      <div className="mixed-table">
        <div className="attribute">Pan</div>
        <div className="gentype">
          <label>
            Generator:&nbsp;
            <select
              name="panP.parameterType"
              onChange={handleChange}
              value={formData.panP.parameterType}
            >
              {Object.values(PARAMETERMODULATOR).map((p) => {
                if (p != PARAMETERMODULATOR.Euclidean)
                return (
                  <option key={`volumePmodulator-${p}`} value={p}>
                    {p}
                  </option>
                );
              })}
            </select>
          </label>
        </div>
        <div className="parameters"></div>
        {formData.panP.parameterType == PARAMETERMODULATOR.Oscillator ? (
          <OscillatorAttributeBox
            name="panP.values"
            type={(formData.panP as OscillatorValues).values.type}
            center={{
              value: (formData.panP as OscillatorValues).values.center,
              lo: -1,
              hi: 1,
              step: .1,
              suffix: "(dB)",
            }}
            frequency={{
              value: (formData.panP as OscillatorValues).values.frequency,
              lo: 0,
              hi: 1000000,
              step: 1,
              suffix: "(mHz)",
            }}
            amplitude={{
              value: (formData.panP as OscillatorValues).values.amplitude,
              lo: -1,
              hi: 1,
              step: .1,
              suffix: "(dB)",
            }}
            phase={{
              value: (formData.panP as OscillatorValues).values.phase,
              lo: -360,
              hi: 360,
              step: 1,
              suffix: "(degrees)",
            }}
            handleChange={handleChange}
          />
        ) : null}
        {formData.panP.parameterType == PARAMETERMODULATOR.Markovian ? (
          <MarkovianAttributeBox
            name="panP.values"
            startValueSuffix={() => {return ""}}
            seed={(formData.panP as MarkovianValues).seed}
            handleChange={handleChange}
            min={-1}
            max={1}
            step={.1}
            transitions={(formData.panP as MarkovianValues).values}
          />
        ) : null}
        {formData.panP.parameterType == PARAMETERMODULATOR.Wiener ? (
          <WienerAttributeBox
            name="panP.values"
            seed={(formData.panP as WienerValues).seed}
            parameters={(formData.panP as WienerValues).values}
            handleChange={handleChange}
            min={-1}
            max={1}
            step={.1}
          />
        ) : null}
      </div>
      <hr/>
    </>
  );
}

export function validateEuclideanValues(values: EuclideanValues): string[] {
  const result: string[] = [];
  // if (!values.presetName) result.push("PresetName must be specified");
  return result;
}
