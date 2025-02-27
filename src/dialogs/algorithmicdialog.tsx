import { ChangeEvent, useEffect } from "react";
import { ALGORITHMTYPE } from "../types";
import {
  MarkovianValues,
  OscillatorValues,
  WienerValues,
} from "../classes/algorithmvalues";
import { Algorithmic } from "../classes/generators";
import { useCMGContext } from "../cmgcontext";
import { bankPresettoName, toNote } from "../sfcomponents/util";
import MarkovianPropertiesBox from "./markovianpropertiesbox";
import OscillatorPropertiesBox from "./oscillatorpropertiesbox";
import WienerPropertiesBox from "./wienerpropertiesbox";
import { Preset } from "sfcomponents/types";
// provides the form fields and validators for the sfperiodic generator
export interface AlgorithmicDialogProps {
  formData: Algorithmic;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}
export default function AlgorithmicDialog(
  props: AlgorithmicDialogProps
): JSX.Element {
  const { formData, handleChange } = props;
  const { presets, fileContents } = useCMGContext();

  // initialize the preset when the soundFont changes
  useEffect(() => {
    if (!formData.preset && fileContents.SoundFont) {
      formData.preset = fileContents.SoundFont.presets[0] as Preset;
      formData.presetName = bankPresettoName(formData.preset);
    }
  }, [fileContents.SoundFont]);

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
        &nbsp;Measure Length:&nbsp;
        <input
          name="measureLength"
          type="number"
          min={2}
          max={100}
          step={1}
          onChange={handleChange}
          value={formData.measureLength}
        />
      </label>
      <label>
        &nbsp;On Beats:&nbsp;
        <input
          name="beatCount"
          type="number"
          min={2}
          max={100}
          step={1}
          onChange={handleChange}
          value={formData.beatCount}
        />
      </label>
      <label>
        &nbsp;Notes in Octave:&nbsp;
        <input
          name="noteCount"
          type="number"
          min={1}
          max={12}
          step={1}
          onChange={handleChange}
          value={formData.noteCount}
        />
      </label>
      <br/>
      <label>
        Noise Seed:&nbsp;
        <input
          name="noiseSeed"
          type="string"
          onChange={handleChange}
          value={formData.noiseSeed}
        />
      </label>
      <label>
        &nbsp;Noise Level:&nbsp;
        <input
          name="noiseAmplitude"
          type="number"
          min={0}
          max={10}
          step={.1}
          onChange={handleChange}
          value={formData.noiseAmplitude}
        />
        <span> </span>
      </label>
      <label>
        &nbsp;Dispersion:&nbsp;
        <input
          name="noiseDispersion"
          type="number"
          min={0}
          max={10}
          step={.01}
          onChange={handleChange}
          value={formData.noiseDispersion}
        />
        <span> (midi) </span>
      </label>
      <hr />
      <div className="algorithmic-table">
        <div className="attribute">Note (midi)</div>
        <div className="gentype">
          <label>
            Generator:&nbsp;
            <select
              name="noteP.algorithmType"
              onChange={handleChange}
              value={
                formData.noteP
                  ? formData.noteP.algorithmType
                  : ALGORITHMTYPE.None
              }
            >
              {Object.values(ALGORITHMTYPE).map((p) => {
                return (
                  <option key={`notePmodulator-${p}`} value={p}>
                    {p}
                  </option>
                );
              })}
            </select>
          </label>
        </div>
        <div className="parameters">
          {/* build oscillator, markovian, wiener, or euclidean box */}
          {formData.noteP &&
          formData.noteP.algorithmType == ALGORITHMTYPE.Oscillator ? (
            <OscillatorPropertiesBox
              name="noteP.oscillator.values"
              type={(formData.noteP as OscillatorValues).values.type}
              center={{
                value: (formData.noteP as OscillatorValues).values.center,
                lo: 0,
                hi: 127,
                step: 1,
                suffix: "(midi)",
              }}
              centerSuffix={(value: number) => {
                if (value < 0) return "";
                else return " ".concat(toNote(value));
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
          {formData.noteP &&
          formData.noteP.algorithmType == ALGORITHMTYPE.Markovian ? (
            <MarkovianPropertiesBox
              name="noteP.markovian.values"
              values={(formData.noteP as MarkovianValues).values}
              startValueSuffix={(value: number) => {
                if (value < 0) return "";
                else return " ".concat(toNote(value));
              }}
              min={0}
              max={127}
              step={1}
              handleChange={handleChange}
            />
          ) : null}
          {formData.noteP &&
          formData.noteP.algorithmType == ALGORITHMTYPE.Wiener ? (
            <WienerPropertiesBox
              name="noteP.wiener.values"
              values={(formData.noteP as WienerValues).values}
              handleChange={handleChange}
              min={0}
              max={127}
              step={1}
            />
          ) : null}
        </div>
      </div>
      <hr />
      <div className="algorithmic-table">
        <div className="attribute">Speed (BPM)</div>
        <div className="gentype">
          <label>
            Generator:&nbsp;
            <select
              name="speedP.algorithmType"
              onChange={handleChange}
              value={
                formData.speedP
                  ? formData.speedP.algorithmType
                  : ALGORITHMTYPE.None
              }
            >
              {Object.values(ALGORITHMTYPE).map((p) => {
                return (
                  <option key={`speedPmodulator-${p}`} value={p}>
                    {p}
                  </option>
                );
              })}
            </select>
          </label>
        </div>
        <div className="parameters">
          {formData.speedP &&
          formData.speedP.algorithmType == ALGORITHMTYPE.Oscillator ? (
            <OscillatorPropertiesBox
              name="speedP.oscillator.values"
              type={(formData.speedP as OscillatorValues).values.type}
              center={{
                value: (formData.speedP as OscillatorValues).values.center,
                lo: 1,
                hi: 1000,
                step: 1,
                suffix: "(BPM)",
              }}
              centerSuffix={() => "BPM"}
              frequency={{
                value: (formData.speedP as OscillatorValues).values.frequency,
                lo: 0,
                hi: 1000000,
                step: 1,
                suffix: "(mHz)",
              }}
              amplitude={{
                value: (formData.speedP as OscillatorValues).values.amplitude,
                lo: 0,
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
          {formData.speedP &&
          formData.speedP.algorithmType == ALGORITHMTYPE.Markovian ? (
            <MarkovianPropertiesBox
              name="speedP.markovian.values"
              startValueSuffix={() => {
                return "";
              }}
              values={(formData.speedP as MarkovianValues).values}
              min={1}
              max={1000}
              step={1}
              handleChange={handleChange}
            />
          ) : null}
          {formData.speedP &&
          formData.speedP.algorithmType == ALGORITHMTYPE.Wiener ? (
            <WienerPropertiesBox
              name="speedP.wiener.values"
              values={(formData.speedP as WienerValues).values}
              min={0}
              max={127}
              step={1}
              handleChange={handleChange}
            />
          ) : null}
        </div>
      </div>
      <hr />
      <div className="algorithmic-table">
        <div className="attribute">Volume (dB)</div>
        <div className="gentype">
          <label>
            Generator:&nbsp;
            <select
              name="volumeP.algorithmType"
              onChange={handleChange}
              value={
                formData.volumeP
                  ? formData.volumeP.algorithmType
                  : ALGORITHMTYPE.None
              }
            >
              {Object.values(ALGORITHMTYPE).map((p) => {
                return (
                  <option key={`volumePmodulator-${p}`} value={p}>
                    {p}
                  </option>
                );
              })}
            </select>
          </label>
        </div>
        <div className="parameters">
          {formData.volumeP &&
          formData.volumeP.algorithmType == ALGORITHMTYPE.Oscillator ? (
            <OscillatorPropertiesBox
              name="volumeP.oscillator.values"
              type={(formData.volumeP as OscillatorValues).values.type}
              center={{
                value: (formData.volumeP as OscillatorValues).values.center,
                lo: -50,
                hi: 50,
                step: 1,
                suffix: "(dB)",
              }}
              centerSuffix={() => "dB"}
              frequency={{
                value: (formData.volumeP as OscillatorValues).values.frequency,
                lo: 0,
                hi: 1000000,
                step: 1,
                suffix: "(mHz)",
              }}
              amplitude={{
                value: (formData.volumeP as OscillatorValues).values.amplitude,
                lo: 0,
                hi: 50,
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
          {formData.volumeP &&
          formData.volumeP.algorithmType == ALGORITHMTYPE.Markovian ? (
            <MarkovianPropertiesBox
              name="volumeP.markovian.values"
              startValueSuffix={() => {
                return "";
              }}
              values={(formData.volumeP as MarkovianValues).values}
              min={-50}
              max={50}
              step={1}
              handleChange={handleChange}
            />
          ) : null}
          {formData.volumeP &&
          formData.volumeP.algorithmType == ALGORITHMTYPE.Wiener ? (
            <WienerPropertiesBox
              name="volumeP.wiener.values"
              values={(formData.volumeP as WienerValues).values}
              min={-50}
              max={50}
              step={1}
              handleChange={handleChange}
            />
          ) : null}
        </div>
      </div>
      <hr />
      <div className="algorithmic-table">
        <div className="attribute">Pan</div>
        <div className="gentype">
          <label>
            Generator:&nbsp;
            <select
              name="panP.algorithmType"
              onChange={handleChange}
              value={
                formData.panP ? formData.panP.algorithmType : ALGORITHMTYPE.None
              }
            >
              {Object.values(ALGORITHMTYPE).map((p) => {
                return (
                  <option key={`volumePmodulator-${p}`} value={p}>
                    {p}
                  </option>
                );
              })}
            </select>
          </label>
        </div>
        <div className="parameters">
          {formData.panP &&
          formData.panP.algorithmType == ALGORITHMTYPE.Oscillator ? (
            <OscillatorPropertiesBox
              name="panP.oscillator.values"
              type={(formData.panP as OscillatorValues).values.type}
              center={{
                value: (formData.panP as OscillatorValues).values.center,
                lo: -1,
                hi: 1,
                step: 0.1,
                suffix: "[-1,1]",
              }}
              centerSuffix={() => "[-1,1]"}
              frequency={{
                value: (formData.panP as OscillatorValues).values.frequency,
                lo: 0,
                hi: 1000000,
                step: 1,
                suffix: "(mHz)",
              }}
              amplitude={{
                value: (formData.panP as OscillatorValues).values.amplitude,
                lo: 0,
                hi: 1,
                step: 0.1,
                suffix: "[0,1]",
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
          {formData.panP &&
          formData.panP.algorithmType == ALGORITHMTYPE.Markovian ? (
            <MarkovianPropertiesBox
              name="panP.markovian.values"
              startValueSuffix={() => {
                return "";
              }}
              values={(formData.panP as MarkovianValues).values}
              min={-1}
              max={1}
              step={0.1}
              handleChange={handleChange}
            />
          ) : null}
          {formData.panP &&
          formData.panP.algorithmType == ALGORITHMTYPE.Wiener ? (
            <WienerPropertiesBox
              name="panP.wiener.values"
              values={(formData.panP as WienerValues).values}
              handleChange={handleChange}
              min={-1}
              max={1}
              step={0.1}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
