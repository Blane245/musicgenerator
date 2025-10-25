import { Algorithmic } from "classes/generators";
import { useCMGContext } from "cmgcontext";
import ToolsMenu from "menus/toolsmenu";
import { ChangeEvent, useState } from "react";
import { bankPresettoName } from "sfcomponents/util";
import AlgorithmicTable from "./algorithmictable";
import MidiFrequencyDialog from "./midifrequencydialog";
import PresetDialog from "./presetdialog";

// provides the form fields and validators for the algorithmic generator

export interface AlgorithmicDialogProps {
  formData: Algorithmic;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}

export default function AlgorithmicDialog(
  props: AlgorithmicDialogProps
): JSX.Element {
  const { SFFileList } = useCMGContext();
  const { formData, handleChange } = props;
  const [open, setOpen] = useState<boolean>(false);
  const [viewPreset, setViewPreset] = useState<boolean>(false);
  return (
    <>
      <label>
        SoundFont File:&nbsp;
        <select
          name="soundfontfile"
          onChange={handleChange}
          value={formData.soundFontFile}
        >
          <option key="SF-none" value="None">
            None
          </option>
          {SFFileList.map((p) => {
            return (
              <option key={`SF-${p}`} value={p}>
                {p}
              </option>
            );
          })}
        </select>
      </label>
      <label>
        Preset:&nbsp;
        <select
          name="presetName"
          onChange={handleChange}
          value={formData.presetName}
        >
          {formData.presets.map((p) => {
            const pName = bankPresettoName(p);
            return (
              <option key={`preset-${pName}`} value={pName}>
                {pName}
              </option>
            );
          })}
        </select>
      </label>
      <label style={{ paddingLeft: "5px" }}>
        &nbsp;Looping?:&nbsp;
        <input
          name="isLooping"
          type="checkbox"
          checked={formData.isLooping ? true : false}
          onChange={handleChange}
        />
      </label>
      <button
        type="button"
        disabled={!formData.preset}
        style={{ fontSize: "12px", paddingLeft: "5px" }}
        onClick={() => setViewPreset(true)}
      >
        {"View Preset"}
      </button>
      <div style={{ height: "21px", width: "100px" }}>
        <ToolsMenu />
      </div>
      <br />
      <label>
        Measure Length:&nbsp;
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
        &nbsp;Beat Shift Amount:&nbsp;
        <input
          name="offsetSequence"
          type="number"
          min={0}
          max={formData.measureLength - 1}
          step={1}
          onChange={handleChange}
          value={formData.offsetSequence}
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
      <label>
        &nbsp;Note Shift Amount:&nbsp;
        <input
          name="offsetNotes"
          type="number"
          min={0}
          max={11}
          step={1}
          onChange={handleChange}
          value={formData.offsetNotes}
        />
      </label>
      <br />
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
        &nbsp;Noise Frequency:&nbsp;
        <input
          name="noiseFrequency"
          type="number"
          min={0}
          max={1000}
          step={0.001}
          onChange={handleChange}
          value={formData.noiseFrequency}
        />
        <span> (Hz) </span>
      </label>
      <label>
        &nbsp;Noise Level:&nbsp;
        <input
          name="noiseAmplitude"
          type="number"
          min={0}
          max={1000}
          step={0.001}
          onChange={handleChange}
          value={formData.noiseAmplitude}
        />
        <span> (gain) </span>
      </label>
      <label>
        &nbsp;Reverb Duration:&nbsp;
        <input
          name="reverbDuration"
          type="number"
          min={0}
          max={10}
          step={0.01}
          onChange={handleChange}
          value={formData.reverbDuration}
        />
        <span> (sec) </span>
      </label>
      <label>
        &nbsp;Reverb Decay:&nbsp;
        <input
          name="reverbDecay"
          type="number"
          min={0}
          max={10}
          step={0.01}
          onChange={handleChange}
          value={formData.reverbDecay}
        />
        <span> (sec) </span>
      </label>
      <hr />
      <AlgorithmicTable formData={formData} handleChange={handleChange} />
      {open ? <MidiFrequencyDialog setOpen={setOpen} /> : null}
      {viewPreset ? (
        <PresetDialog generator={formData} setViewPreset={setViewPreset} />
      ) : null}
    </>
  );
}
