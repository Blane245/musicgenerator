import Algorithmic from "classes/generators/algorithmic";
import { useCMGContext } from "cmgcontext";
import ToolsMenu from "menus/toolsmenu";
import { ChangeEvent, useState } from "react";
import { bankPresettoName } from "sfcomponents/util";
import AlgorithmicTable from "./algorithmictable";
import MidiFrequencyDialog from "./midifrequencydialog";
import PresetDialog from "./presetdialog";
import { MODULATOR } from "types";

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
      <div className="algorithmic-preamble">
        <div className="soundfont">
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
          <button
            type="button"
            disabled={!formData.preset}
            style={{ fontSize: "12px", paddingLeft: "5px" }}
            onClick={() => setViewPreset(true)}
          >
            {"View Preset"}
          </button>
          <label style={{ paddingLeft: "5px" }}>
            Looping?:&nbsp;
            <input
              name="isLooping"
              type="checkbox"
              checked={formData.isLooping ? true : false}
              onChange={handleChange}
            />
          </label>
          <label style={{ paddingLeft: "5px" }}>
            Attack Enabled?:&nbsp;
            <input
              name="attackEnabled"
              type="checkbox"
              checked={formData.attackEnabled ? true : false}
              onChange={handleChange}
            />
          </label>
                  </div>
                  <div className="tremolo">
          <label>
            Tremolo Speed: (mHz)&nbsp;
            <input
              name="tremolo.speed"
              type="number"
              min={0}
              max={10000}
              step={1}
              value={formData.tremolo.values.speed}
              onChange={handleChange}
            />
          </label>
          <label>
            Tremolo Depth: (dB)&nbsp;
            <input
              name="tremolo.depth"
              type="number"
              min={0}
              max={10}
              step={0.1}
              value={formData.tremolo.values.depth}
              onChange={handleChange}
            />
          </label>
          <label>
            Tremolo Modulator:&nbsp;
            <select
              name="tremolo.waveform"
              value={formData.tremolo.values.waveForm}
              onChange={handleChange}
            >
              {Object.values(MODULATOR).map((mod: MODULATOR) => (
                <option key={`tremolo-waveform-${mod}`} value={mod}>
                  {mod}
                </option>
              ))}
            </select>
          </label>
          </div>
          <div className="vibrato">
          <label>
            Vibrato Speed: (mHz)&nbsp;
            <input
              name="vibrato.speed"
              type="number"
              min={0}
              max={10000}
              step={1}
              value={formData.vibrato.values.speed}
              onChange={handleChange}
            />
          </label>
          <label>
            Vibrato Depth: (cents)&nbsp;
            <input
              name="vibrato.depth"
              type="number"
              min={0}
              max={10000}
              step={1}
              value={formData.vibrato.values.depth}
              onChange={handleChange}
            />
          </label>
          <label>
            Vibrator Modulator:&nbsp;
            <select
              name="vibrato.waveform"
              value={formData.vibrato.values.waveForm}
              onChange={handleChange}
            >
              {Object.values(MODULATOR).map((mod: MODULATOR) => (
                <option key={`vibrator-waveform-${mod}`} value={mod}>
                  {mod}
                </option>
              ))}
            </select>
          </label>
          </div>
          <div className="tools">
          <div style={{ height: "21px", width: "100px" }}>
            <ToolsMenu />
          </div>
        </div>
        <div className="rhythm">
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
            On Beats:&nbsp;
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
            Beat Shift Amount:&nbsp;
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
            Notes in Octave:&nbsp;
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
            Note Shift Amount:&nbsp;
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
        </div>
        <div className="noise">
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
            Noise Frequency:&nbsp;
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
            Noise Level:&nbsp;
            <input
              name="noiseAmplitude"
              type="number"
              min={0}
              max={1}
              step={0.001}
              onChange={handleChange}
              value={formData.noiseAmplitude}
            />
            <span> (+-10 dB) </span>
          </label>
        </div>
        <div className="reverb">
          <label>
            Reverb Duration:&nbsp;
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
            Reverb Decay:&nbsp;
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
        </div>
      </div>
        <hr/>
      <AlgorithmicTable formData={formData} handleChange={handleChange} />
      {open ? <MidiFrequencyDialog setOpen={setOpen} /> : null}
      {viewPreset ? (
        <PresetDialog generator={formData} setViewPreset={setViewPreset} />
      ) : null}
    </>
  );
}
