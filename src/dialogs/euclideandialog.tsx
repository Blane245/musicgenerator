import { ChangeEvent } from "react";
import Euclidean from "../classes/euclidean";
import { useCMGContext } from "../cmgcontext";
import { bankPresettoName, toNote } from "../sfcomponents/util";
import ModulationAttributeBox from "./modulationattributebox";

// provides the form fields andO wo validators for the sfrandom generator
export type EuclideanDialogDialogProps = {
  formData: Euclidean;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
};
export default function EudlideanDialog(
  props: EuclideanDialogDialogProps
): JSX.Element {
  const { formData, handleChange } = props;
  const { presets } = useCMGContext();

  return (
    <>
      <label>
        Random Seed:&nbsp;
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
      <hr />
      <label>
        Measure Length:&nbsp;
        <input
          name="measureLength"
          type="number"
          min={2}
          max={50}
          step={1}
          value={formData.measureLength}
          onChange={handleChange}
        />
        <span>&nbsp;(beats)</span>
      </label>
      <label>
        &nbsp;On Beats:&nbsp;
        <input
          name="beatCount"
          type="number"
          min={1}
          max={50}
          step={1}
          value={formData.beatCount}
          onChange={handleChange}
        />
        <span>&nbsp;(beats)</span>
      </label>
      <label>
        &nbsp;Scale Notes:&nbsp;
        <input
          name="noteCount"
          type="number"
          min={1}
          max={12}
          step={1}
          value={formData.noteCount}
          onChange={handleChange}
        />
        <span>&nbsp;(count)</span>
      </label>
      <div className="modulation-table">
        <div>Name</div>
        <div>Type</div>
        <div>Center</div>
        <div>Frequency</div>
        <div>Amplitude</div>
        <div>Phase</div>
        <ModulationAttributeBox
          title={"Note"}
          name={"noteM"}
          type={formData.noteM.type.toString()}
          center={{
            value: formData.noteM.center,
            lo: 0,
            hi: 127,
            step: 1,
            suffix: toNote(formData.noteM.center).concat(" (midi)"),
          }}
          frequency={{
            value: formData.noteM.frequency,
            lo: 0,
            hi: 1000000,
            step: 1,
            suffix: "(mHz)",
          }}
          amplitude={{
            value: formData.noteM.amplitude,
            lo: 0,
            hi: 127,
            step: 1,
            suffix: "(midi)",
          }}
          phase={{
            value: formData.noteM.phase,
            lo: -360,
            hi: 360,
            step: 1,
            suffix: "(degrees)",
          }}
          handleChange={handleChange}
        />
        <ModulationAttributeBox
          title={"Speed"}
          name={"speedM"}
          type={formData.speedM.type.toString()}
          center={{
            value: formData.speedM.center,
            lo: 1,
            hi: 500,
            step: 1,
            suffix: "(BPM)",
          }}
          frequency={{
            value: formData.speedM.frequency,
            lo: 0,
            hi: 1000000,
            step: 1,
            suffix: "(mHz)",
          }}
          amplitude={{
            value: formData.speedM.amplitude,
            lo: 0,
            hi: 1000,
            step: 1,
            suffix: "(BPM)",
          }}
          phase={{
            value: formData.speedM.phase,
            lo: -360,
            hi: 360,
            step: 1,
            suffix: "(degrees)",
          }}
          handleChange={handleChange}
        />
        <ModulationAttributeBox
          title={"Volume"}
          name={"volumeM"}
          type={formData.volumeM.type.toString()}
          center={{
            value: formData.volumeM.center,
            lo: -20,
            hi: 20,
            step: 1,
            suffix: "(-20 to +20 dB)",
          }}
          frequency={{
            value: formData.volumeM.frequency,
            lo: 0,
            hi: 1000000,
            step: 1,
            suffix: "(mHz)",
          }}
          amplitude={{
            value: formData.volumeM.amplitude,
            lo: 0,
            hi: 40,
            step: 1,
            suffix: "(0 - 20 dB)",
          }}
          phase={{
            value: formData.volumeM.phase,
            lo: -360,
            hi: 360,
            step: 1,
            suffix: "(degrees)",
          }}
          handleChange={handleChange}
        />
        <ModulationAttributeBox
          title={"Pan"}
          name={"panM"}
          type={formData.panM.type.toString()}
          center={{
            value: formData.panM.center,
            lo: -1,
            hi: +1,
            step: 0.1,
            suffix: "(-1 to +1)",
          }}
          frequency={{
            value: formData.panM.frequency,
            lo: 0,
            hi: 1000000,
            step: 1,
            suffix: "(mHz)",
          }}
          amplitude={{
            value: formData.panM.amplitude,
            lo: 0,
            hi: 2,
            step: 0.1,
            suffix: "(0 - 1)",
          }}
          phase={{
            value: formData.panM.phase,
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

// validate the fields returning each error as a text entry in the array

export function validateEuclideanValues(values: Euclidean): string[] {
  const result: string[] = [];
  if (values.seed == "") result.push("Random seed must not be blank");
  if (!values.presetName) result.push("PresetName must be specified");
  if (values.beatCount > values.measureLength)
    result.push(
      "The number of beats in a measure must not exceed the measurement length"
    );
  return result;
}
