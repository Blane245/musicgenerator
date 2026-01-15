import Algorithmic from "classes/generators/algorithmic";
import { useCMGContext } from "cmgcontext";
import ToolsMenu from "menus/toolsmenu";
import { ChangeEvent, useState } from "react";
import { bankPresettoName } from "sfcomponents/util";
import { MODULATOR } from "types";
import { generateRandomString } from "utils/randomstring";
import MidiFrequencyDialog from "../midifrequencydialog";
import AlgorithmicTable from "./algorithmictable";
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
  function getSeed(): void {
    const newSeed: string = generateRandomString(15);
    const event = {
      target: { name: "noiseSeed", value: newSeed, type: "string" },
    };
    handleChange(event as ChangeEvent<HTMLInputElement>);
  }
  return (
    <>
      {/* <div className="algorithmic-preamble"> */}
        <table style={{width:'100%'}}>
          <thead>
            <th>Sound Font File</th>
            <th>Preset</th>
            <th>Looping?</th>
            <th>Attack Enabled?</th>
            <th>Generator Tools</th>
            <th>Noise Seed</th>
            <th>Noise Frequency (Hz)</th>
            <th>Noise Amplitude (+-10dB)</th>
          </thead>
          <tbody>
            <td>
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
            </td>
            <td>
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
            </td>
            <td>
              <input
                name="isLooping"
                type="checkbox"
                checked={formData.isLooping ? true : false}
                onChange={handleChange}
              />
            </td>
            <td>
              <input
                name="attackEnabled"
                type="checkbox"
                checked={formData.attackEnabled ? true : false}
                onChange={handleChange}
              />
            </td>
            <td>
              <ToolsMenu />
            </td>
            <td>
              <button
                type="button"
                onClick={() => getSeed()}
                style={{ fontSize: "10px" }}
              >
                New Seed
              </button>
              <input
                name="noiseSeed"
                type="string"
                onChange={handleChange}
                value={formData.noiseSeed}
              />
            </td>
            <td>
              <input
                name="noiseFrequency"
                type="number"
                min={0}
                max={1000}
                step={0.001}
                onChange={handleChange}
                value={formData.noiseFrequency}
              />
            </td>
            <td>
              <input
                name="noiseAmplitude"
                type="number"
                min={-10}
                max={10}
                step={1}
                onChange={handleChange}
                value={formData.noiseAmplitude}
              />
            </td>
          </tbody>
          <thead>
            <th colSpan={2}>Reverb</th>
            <th colSpan={3}>Tremelo</th>
            <th colSpan={3}>Vibrato</th>
          </thead>
          <tbody>
            <td colSpan={2}>
              <label>
                Duration (sec):&nbsp;
                <input
                                style={{width:'50px'}}

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
                &nbsp;Decay (sec):&nbsp;
                <input
                                style={{width:'50px'}}

                  name="reverbDecay"
                  type="number"
                  min={0}
                  max={10}
                  step={0.01}
                  onChange={handleChange}
                  value={formData.reverbDecay}
                />
              </label>
            </td>
            <td colSpan={3}>
              <label>
                Speed: (mHz)&nbsp;
                <input
                                style={{width:'50px'}}

                  name="tremolo.speed"
                  type="number"
                  min={0}
                  max={100000}
                  step={1}
                  value={formData.tremolo.values.speed}
                  onChange={handleChange}
                />
              </label>
              <label>
                &nbsp;Depth: (dB)&nbsp;
                <input
                style={{width:'50px'}}
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
                &nbsp;Modulator:&nbsp;
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
            </td>
            <td colSpan={3}>
              <label>
                Speed (mHz):&nbsp;
                <input
                style={{width:'50px'}}
                  name="vibrato.speed"
                  type="number"
                  min={0}
                  step={1}
                  value={formData.vibrato.values.speed}
                  onChange={handleChange}
                />
              </label>
              <label>
                Depth (cents):&nbsp;
                <input
                style={{width:'50px'}}
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
                Modulator:&nbsp;
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
            </td>
          </tbody>
          <thead>
            <th>Measure Length (beats)</th>
            <th>On Beats (beats) </th>
            <th>Beat Shift (beats)</th>
            <th>Notes in Octave (1-12)</th>
            <th>Note Shift (tones)</th>
          </thead>
          <tbody>
            <td>
              <input
                name="measureLength"
                type="number"
                min={2}
                max={100}
                step={1}
                onChange={handleChange}
                value={formData.measureLength}
              />
            </td>
            <td>
              <input
                name="beatCount"
                type="number"
                min={2}
                max={100}
                step={1}
                onChange={handleChange}
                value={formData.beatCount}
              />
            </td>
            <td>
              <input
                name="offsetSequence"
                type="number"
                min={0}
                max={formData.measureLength - 1}
                step={1}
                onChange={handleChange}
                value={formData.offsetSequence}
              />
            </td>
            <td>
              <input
                name="noteCount"
                type="number"
                min={1}
                max={12}
                step={1}
                onChange={handleChange}
                value={formData.noteCount}
              />
            </td>
            <td>
              <input
                name="offsetNotes"
                type="number"
                min={0}
                max={11}
                step={1}
                onChange={handleChange}
                value={formData.offsetNotes}
              />
            </td>
          </tbody>
        </table>
      {/* </div> */}
      <hr />
      <AlgorithmicTable formData={formData} handleChange={handleChange} />
      {open ? <MidiFrequencyDialog setOpen={setOpen} /> : null}
      {viewPreset ? (
        <PresetDialog generator={formData} setViewPreset={setViewPreset} />
      ) : null}
    </>
  );
}
