import { ChangeEvent } from "react";
import SFPG from "../classes/sfpg";
import { useCMGContext } from "../cmgcontext";
import { bankPresettoName, toNote } from "../sfcomponents/util";
import { MODULATOR } from "../types";
import ModulationAttributeBox from "./modulationattributebox";

// provides the form fields and validators for the sfperiodic generator
export interface SFPGDialogProps {
  formData: SFPG;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}
const INPUTSIZE: number = 6;

export default function SFPGDialog(props: SFPGDialogProps): JSX.Element {
  const { formData, handleChange } = props;
  const { presets } = useCMGContext();

  return (
    <>
      <label htmlFor="presetName">Preset:</label>
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
      <label htmlFor="midi"> Midi Number:</label>
      <input
        name="midi"
        size={INPUTSIZE}
        type="number"
        min={0}
        max={127}
        step={1}
        onChange={handleChange}
        value={formData.midi}
      />
      <span> {formData.midi > 0 ? toNote(formData.midi) : null}</span>
      <hr />
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
      <div className="modulation-table">
      <div >Name</div>
      <div >Type</div>
      <div >Center</div>
        <div >Frequency</div>
        <div >Amplitude</div>
        <div >Phase</div>

        <ModulationAttributeBox
          title={"Tone"}
          name={"FM"}
          type={formData.FMType}
          center={null}
          frequency={{
            value: formData.FMFrequency,
            lo: 0,
            hi: 1000000,
            step: 1,
            suffix: "(mHz)",
          }}
          amplitude={{
            value: formData.FMAmplitude,
            lo: 0,
            hi: 127,
            step: 1,
            suffix: "(midi)",
          }}
          phase={{
            value: formData.FMPhase,
            lo: -360,
            hi: 360,
            step: 1,
            suffix: "(degrees)",
          }}
          handleChange={handleChange}
        />
        <ModulationAttributeBox
          title={"Volume"}
          name={"VM"}
          type={formData.VMType}
          center={{
            value: formData.VMCenter,
            lo: -20,
            hi: 20,
            step: 0.1,
            suffix: "(-20 to +20dB)",
          }}
          frequency={{
            value: formData.VMFrequency,
            lo: 0,
            hi: 1000000,
            step: 1,
            suffix: "(mHz)",
          }}
          amplitude={{
            value: formData.VMAmplitude,
            lo: 0,
            hi: 10,
            step: .1,
            suffix: "(0-10dB)",
          }}
          phase={{
            value: formData.VMPhase,
            lo: -360,
            hi: 360,
            step: 1,
            suffix: "(degrees)",
          }}
          handleChange={handleChange}
        />
        <ModulationAttributeBox
          title={"Pan"}
          name={"PM"}
          type={formData.PMType}
          center={{
            value: formData.PMCenter,
            lo: -1,
            hi: 1,
            step: 0.1,
            suffix: "(-1 to +1)",
          }}
          frequency={{
            value: formData.PMFrequency,
            lo: 0,
            hi: 1000000,
            step: 1,
            suffix: "(mHz)",
          }}
          amplitude={{
            value: formData.PMAmplitude,
            lo: 0,
            hi: 1,
            step: 0.1,
            suffix: "(0-1)",
          }}
          phase={{
            value: formData.PMPhase,
            lo: -360,
            hi: 360,
            step: 1,
            suffix: "(degrees)",
          }}
          handleChange={handleChange}
        />
      </div>
    </>
  );
}

export function validateSFPGValues(values: SFPG): string[] {
  const result: string[] = [];
  if (!values.presetName) result.push("PresetName must be specified");
  return result;
}
