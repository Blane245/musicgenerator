import { ChangeEvent, useState } from "react";
import { Algorithmic } from "../classes/generators";
import { getPresetNote } from "../sfcomponents/loadpresetnote";
import { Preset } from "../sfcomponents/types";
import { bankPresettoName, presetNameToPreset } from "../sfcomponents/util";
import { SoundFont2 } from "../soundfont2";
import { RawSourceData } from "../types";
export interface PresetDialogProps {
  generator: Algorithmic;
  setViewPreset: Function;
}
export default function PresetDialog(props: PresetDialogProps): JSX.Element {
  const { generator, setViewPreset } = props;
  const [SFFile] = useState<SoundFont2 | undefined>(
    generator.soundFont
  );
  const [presetName, setPresetName] = useState<string>(generator.presetName);
  const [preset, setPreset] = useState<Preset | undefined>(generator.preset);
  const [presetMidi, setPresetMidi] = useState<number>(0);
  const [presetVel, setPresetVel] = useState<number>(0);
  const [presetInfo, setPresetInfo] = useState<RawSourceData[] | null>(null);

  // given a preset, midi, and velocity, get the envelope data
  function getPresetData(preset: Preset, midi: number, vel: number) {
    if (preset && midi > 0 && vel > 0) {
      const result: RawSourceData[] = getPresetNote(
        generator,
        preset,
        0,
        0,
        1,
        midi,
        vel,
        0,
        0,
        0
      );
      if (result.length > 0) setPresetInfo(result);
      else setPresetInfo(null);
    } else setPresetInfo(null);
  }

  function handlePresetName(e: ChangeEvent) {
    const presetName = e.target["value"];
    if (SFFile) {
      const { preset } = presetNameToPreset(
        presetName,
        SFFile.presets as Preset[]
      );
      if (preset) {
        setPresetName(presetName);
        setPreset(preset);
        getPresetData(preset, presetMidi, presetVel);
      }
    }
  }

  function handlePresetMidi(e: ChangeEvent) {
    const midi = e.target["value"];
    setPresetMidi(midi);
    if (preset)
     getPresetData(preset as Preset, midi, presetVel);
  }

  function handlePresetVel(e: ChangeEvent) {
    const vel = e.target["value"];
    setPresetVel(vel);
    if (preset) getPresetData(preset, presetMidi, vel);
  }

  return (
    <>
      <div
        className="modal-content"
        style={{
          display: "block",
          top: 0,
          left: 0,
          width: "50em",
        }}
      >
        <div className="modal-header">
          <h2>{"Preset Properties"}</h2>
        </div>
        <div className="modal-body">
          <label>
            Preset:&nbsp;
            <select
              name="presetName"
              onChange={(e) => handlePresetName(e)}
              value={presetName}
            >
              {SFFile
                ? (SFFile.presets as Preset[]).map((p) => {
                    const pName = bankPresettoName(p);
                    return (
                      <option key={`preset-${pName}`} value={pName}>
                        {pName}
                      </option>
                    );
                  })
                : null}
            </select>
          </label>
          <label>
            Midi
            <input
              type="number"
              min={0}
              max={127}
              onChange={(e) => handlePresetMidi(e)}
              value={presetMidi}
            ></input>
          </label>
          <label>
            Velocity
            <input
              type="number"
              min={0}
              max={127}
              onChange={(e) => handlePresetVel(e)}
              value={presetVel}
            ></input>
          </label>
          <br />
          {presetInfo ? (
            <table>
              <thead>
                <tr>
                  <th>Sample Count</th>
                  <th>
                    Playback
                    <br />
                    Rate (Hz)
                  </th>
                  <th>
                    Delay
                    <br />
                    (sec)
                  </th>
                  <th>
                    Attack
                    <br />
                    (sec)
                  </th>
                  <th>
                    Hold
                    <br />
                    (sec)
                  </th>
                  <th>
                    Decay
                    <br />
                    (sec)
                  </th>
                  <th>
                    Sustain
                    <br />
                    (sec)
                  </th>
                  <th>
                    Sustain
                    <br />
                    Level
                  </th>
                  <th>
                    Release
                    <br />
                    (sec)
                  </th>
                  <th>
                    Attenuation
                    <br />
                    (dB)
                  </th>
                </tr>
              </thead>
              <tbody>
                {presetInfo.map((s: RawSourceData) => (
                  <tr>
                    <td>{s.source.sample[0].length}</td>
                    <td>{s.source.playbackRate.toFixed(3)}</td>
                    <td>{s.vol.delayInterval.toFixed(3)}</td>
                    <td>{s.vol.attackInterval.toFixed(3)}</td>
                    <td>{s.vol.holdInterval.toFixed(3)}</td>
                    <td>{s.vol.decayInterval.toFixed(3)}</td>
                    <td>{s.vol.sustainInterval.toFixed(3)}</td>
                    <td>{s.vol.sustainLevel.toFixed(3)}</td>
                    <td>{s.vol.releaseInterval.toFixed(3)}</td>
                    <td>{(s.vol.initialAttenuation/100).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
        <div className="modal-footer">
          <button onClick={() => setViewPreset(false)}>Done</button>
        </div>
      </div>
    </>
  );
}
