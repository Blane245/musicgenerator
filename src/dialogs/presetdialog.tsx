import { ChangeEvent, useEffect, useState } from "react";
import { getPresetNote } from "playfunctions/presetProcessing/getpresetnote";
import { Preset } from "sfcomponents/types";
import {
  bankPresettoName,
  precisionString,
  presetNameToPreset,
} from "sfcomponents/util";
import { SoundFont2 } from "soundfont2";
import { RawSourceData } from "types";
import CMGFile from "classes/cmgfile";
import { useCMGContext } from "cmgcontext";
import { signalLevel } from "utils/signallevel";
import { Algorithmic } from "classes/generators/algorithmic";
export interface PresetDialogProps {
  generator: Algorithmic;
  setViewPreset: Function;
}
export default function PresetDialog(props: PresetDialogProps): JSX.Element {
  const { generator, setViewPreset } = props;
  const { fileContents } = useCMGContext();
  const [SFFile] = useState<SoundFont2 | undefined>(generator.soundFont);
  const [presetName, setPresetName] = useState<string>(generator.presetName);
  const [preset, setPreset] = useState<Preset | undefined>(generator.preset);
  const [presetMidi, setPresetMidi] = useState<number>(60);
  const [presetAttack, setPresetAttack] = useState<number>(63);
  const [presetInterval, setPresetInterval] = useState<number>(1);
  const [presetDuration, setPresetDuration] = useState<number>(100);
  const [presetVolume, setPresetVolume] = useState<number>(0);
  const [presetAttackEnabled, setPresetAttackEnabled] = useState<boolean>(
    generator.attackEnabled
  );
  const [presetInfo, setPresetInfo] = useState<RawSourceData[]>([]);

  useEffect(() => {
    const pitch: number = (generator as Algorithmic).noteP.getCurrentValue(0, 1);
    setPresetMidi(pitch);
    const speed = generator.speedP.getCurrentValue(0, 0);
    const interval: number = speed == 0 ? 1 : 60.0 / speed;
    setPresetInterval(interval);
    const duration: number = generator.durationP.getCurrentValue(0, 0);
    setPresetDuration(duration);
    const volume: number = generator.volumeP.getCurrentValue(0, 1);
    setPresetVolume(volume);
    const attack: number = generator.attackP.getCurrentValue(0, 1);
    setPresetAttack(attack);
    const attackEnabled: boolean = generator.attackEnabled;
    setPresetAttackEnabled(attackEnabled);

    if (preset)
      getPresetData(
        fileContents,
        preset,
        interval,
        duration,
        pitch,
        attack,
        volume,
        attackEnabled
      );
  }, []);

  // given a preset, pitch, and velocity, get the envelope data
  function getPresetData(
    fileContents: CMGFile,
    preset: Preset,
    interval: number,
    duration: number,
    pitch: number,
    vel: number,
    vol: number,
    attackEnabled: boolean
  ) {
    const aGen: Algorithmic = generator.copy();
    aGen.attackEnabled = attackEnabled;
    const result: RawSourceData[] = getPresetNote(
      fileContents,
      aGen,
      preset,
      0,
      0,
      interval,
      (interval * duration) / 100.0,
      pitch,
      vel,
      vol,
      0,
      0,
      0
    );
    if (result.length > 0) setPresetInfo(result);
    else setPresetInfo([]);
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
        getPresetData(
          fileContents,
          preset,
          presetInterval,
          presetDuration,
          presetMidi,
          presetAttack,
          presetVolume,
          presetAttackEnabled
        );
      }
    }
  }

  function handlePresetMidi(e: ChangeEvent) {
    const pitch = parseFloat(e.target["value"]);
    setPresetMidi(pitch);
    if (preset)
      getPresetData(
        fileContents,
        preset,
        presetInterval,
        presetDuration,
        pitch,
        presetAttack,
        presetVolume,
        presetAttackEnabled
      );
  }

  function handlepresetAttack(e: ChangeEvent) {
    const attack = parseFloat(e.target["value"]);
    setPresetAttack(attack);
    if (preset)
      getPresetData(
        fileContents,
        preset,
        presetInterval,
        presetDuration,
        presetMidi,
        attack,
        presetVolume,
        presetAttackEnabled
      );
  }

  function handlePresetDuration(e: ChangeEvent) {
    const duration = parseFloat(e.target["value"]);
    setPresetDuration(duration);
    if (preset)
      getPresetData(
        fileContents,
        preset,
        presetInterval,
        duration,
        presetMidi,
        presetAttack,
        presetVolume,
        presetAttackEnabled
      );
  }

  function handlePresetInterval(e: ChangeEvent) {
    const interval = parseFloat(e.target["value"]);
    setPresetInterval(interval);
    if (preset)
      getPresetData(
        fileContents,
        preset,
        interval,
        presetDuration,
        presetMidi,
        presetAttack,
        presetVolume,
        presetAttackEnabled
      );
  }

  function handlePresetVolume(e: ChangeEvent) {
    const volume = parseInt(e.target["value"]);
    setPresetVolume(volume);
    if (preset)
      getPresetData(
        fileContents,
        preset,
        presetInterval,
        presetDuration,
        presetMidi,
        presetAttack,
        volume,
        presetAttackEnabled
      );
  }

  function handlePresetAttackEnabled(e: ChangeEvent<HTMLInputElement>) {
    const attackEnabled = e.target.checked;
    setPresetAttackEnabled(attackEnabled);
    if (preset)
      getPresetData(
        fileContents,
        preset,
        presetInterval,
        presetDuration,
        presetMidi,
        presetAttack,
        presetVolume,
        attackEnabled
      );
  }

  const DISPLAYWIDTH: number = 1700;
  const ENVHEIGHT: number = 50;

  function drawEnvelopes(pI: RawSourceData[]): JSX.Element[] {
    const result: JSX.Element[] = [];

    // get the longest total time of all of the instruments for scaling
    let maxTime: number = 0;
    const xWidth: number = DISPLAYWIDTH - 100;
    pI.forEach((p) => {
      if (p.instrument) maxTime = Math.max(p.instrument.totalTime, maxTime);
    });
    if (maxTime == 0 || pI.length == 0)
      return [<div>No Signal Envelopes to Display</div>];
    const xScale: number = xWidth / maxTime;
    const yScale: number = ENVHEIGHT / 1;
    const lineTo = (x: number, y: number): string => {
      return `L${x * xScale} ${yScale * (1 - y)} `;
    };
    result.push(<div>Signal Envelopes</div>);
    pI.forEach((p, i) => {
      if (p.instrument) {
        let path: string = "";
        path += `M0 ${ENVHEIGHT} `;
        p.instrument.envelope.forEach((e: { t: number; g: number }) => {
          path += lineTo(e.t, e.g);
        });
        path += "Z";
        result.push(
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height={ENVHEIGHT.toString()}
            width={xWidth.toString()}
            fill="black"
            key={`envelope-${i}`}
          >
            <path d={path} fill="black" />
          </svg>
        );
        result.push(<br />);
      }
    });
    return result;
  }

  const numberCell = (
    i: number,
    object: object | undefined,
    value: string,
    precision: number
  ): JSX.Element => {
    if (object == undefined || object[value] == undefined)
      return (
        <td key={`${value}-${i}`} style={{ textAlign: "right" }}>
          0
        </td>
      );
    return (
      <td key={`${value}-${i}`} style={{ textAlign: "right" }}>
        {precisionString(object[value], precision)}
      </td>
    );
  };
  const lengthCell = (
    i: number,
    object: object | undefined,
    array: string,
    dimension: number,
    precision: number
  ): JSX.Element => {
    if (object == undefined || object[array] == undefined)
      return (
        <td key={`${array}-${i}`} style={{ textAlign: "right" }}>
          0
        </td>
      );
    const value: number = object[array][dimension].length;
    return (
      <td style={{ textAlign: "right" }}>
        {precisionString(value, precision)}
      </td>
    );
  };
  return (
    <>
      <div
        className="modal-content"
        style={{
          display: "block",
          top: 0,
          left: 0,
          width: DISPLAYWIDTH.toString() + "px",
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
            &nbsp;Midi:&nbsp;
            <input
              type="number"
              min={0}
              max={127}
              step={0.001}
              onChange={(e) => handlePresetMidi(e)}
              value={presetMidi}
            />
            <span>&nbsp;(0 - 127)</span>
          </label>
          <label>
            &nbsp;Attack:&nbsp;
            <input
              type="number"
              min={0}
              max={127}
              step={1}
              onChange={(e) => handlepresetAttack(e)}
              value={presetAttack}
            ></input>
            <span>&nbsp;(0 - 127)</span>
          </label>
          <label>
            &nbsp;Interval:&nbsp;
            <input
              type="number"
              min={0.1}
              max={100}
              step={0.001}
              onChange={(e) => handlePresetInterval(e)}
              value={presetInterval}
            ></input>
            <span>&nbsp;sec (0.1 - 100)</span>
          </label>
          <label>
            &nbsp;Duration:&nbsp;
            <input
              type="number"
              min={1}
              max={100}
              step={0.001}
              onChange={(e) => handlePresetDuration(e)}
              value={presetDuration}
            ></input>
            <span>&nbsp;(%)</span>
          </label>
          <label>
            &nbsp;Volume:&nbsp;
            <input
              type="number"
              min={-10}
              max={10}
              step={1}
              onChange={(e) => handlePresetVolume(e)}
              value={presetVolume}
            ></input>
            <span>&nbsp;(-10 - +10)</span>
          </label>
          <label>
            &nbsp;Attack Enabled:&nbsp;
            <input
              type="checkbox"
              onChange={(e) => handlePresetAttackEnabled(e)}
              checked={presetAttackEnabled}
            ></input>
          </label>
          <br />
          {presetInfo ? (
            <table>
              <tbody>
                <tr key="name">
                  <td>Instrument Name</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td
                      style={{ textAlign: "right" }}
                      key={"name-" + s.instrument?.name}
                    >
                      {s.instrument?.name}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Sample Rate (samples/sec)</td>
                  {presetInfo.map((s: RawSourceData, i) =>
                    numberCell(i, s.source, "sampleRate", 0)
                  )}
                </tr>
                <tr>
                  <td>Sample Count</td>
                  {presetInfo.map((s: RawSourceData, i) =>
                    lengthCell(i, s.source, "sample", 0, 0)
                  )}
                </tr>
                <tr>
                  <td>Looping?</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td style={{ textAlign: "right" }}>
                      {s.instrument?.loop ? "true" : "false"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Root Key (pitch)</td>
                  {presetInfo.map((s: RawSourceData, i) =>
                    numberCell(i, s.instrument, "rootKey", 0)
                  )}
                </tr>
                <tr>
                  <td>Pitch Correction (cents)</td>
                  {presetInfo.map((s: RawSourceData, i) =>
                    numberCell(i, s.instrument, "cents", 0)
                  )}
                </tr>
                <tr>
                  <td>Playback Rate</td>
                  {presetInfo.map((s: RawSourceData, i) =>
                    numberCell(i, s.source, "playbackRate", 6)
                  )}
                </tr>
                <tr>
                  <td style={{ fontWeight: "bold" }}>Envelope Controls</td>
                </tr>
                <tr>
                  <td>Attack Enabled?</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td style={{ textAlign: "right" }}>
                      {s.instrument?.attackEnabled ? "true" : "false"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Interval Length</td>
                  {presetInfo.map((s: RawSourceData, i) =>
                    numberCell(i, s.instrument, "interval", 3)
                  )}
                </tr>
                <tr>
                  <td>Note Duration</td>
                  {presetInfo.map((s: RawSourceData, i) =>
                    numberCell(i, s.instrument, "duration", 3)
                  )}
                </tr>
                <tr>
                  <td style={{ fontWeight: "bold" }}>Envelope (sec)</td>
                </tr>
                {!!presetAttackEnabled && (
                  <>
                    <tr>
                      <td>Delay</td>
                      {presetInfo.map((s: RawSourceData, i) =>
                        numberCell(i, s.instrument, "delayEnd", 3)
                      )}
                    </tr>
                    <tr>
                      <td>Attack</td>
                      {presetInfo.map((s: RawSourceData, i) =>
                        numberCell(i, s.instrument, "attackEnd", 3)
                      )}
                    </tr>
                  </>
                )}
                <tr>
                  <td>Hold</td>
                  {presetInfo.map((s: RawSourceData, i) =>
                    numberCell(i, s.instrument, "holdEnd", 3)
                  )}
                </tr>
                <tr>
                  <td>Decay</td>
                  {presetInfo.map((s: RawSourceData, i) =>
                    numberCell(i, s.instrument, "decayEnd", 3)
                  )}
                </tr>
                <tr>
                  <td>End</td>
                  {presetInfo.map((s: RawSourceData, i) =>
                    numberCell(i, s.instrument, "noteEnd", 3)
                  )}
                </tr>
                <tr>
                  <td>Release</td>
                  {presetInfo.map((s: RawSourceData, i) =>
                    numberCell(i, s.instrument, "releaseEnd", 3)
                  )}
                </tr>
                <tr>
                  <td>Total Duration (sec)</td>
                  {presetInfo.map((s: RawSourceData, i) =>
                    numberCell(i, s.instrument, "totalTime", 3)
                  )}
                </tr>
                <tr>
                  <td>Volume Gain</td>
                  {presetInfo.map((s: RawSourceData, i) =>
                    numberCell(i, s.instrument, "volumeGain", 3)
                  )}
                </tr>
                <tr>
                  <td>Attenuation Gain</td>
                  {presetInfo.map((s: RawSourceData, i) =>
                    numberCell(i, s.instrument, "attenuation", 3)
                  )}
                </tr>
                <tr>
                  <td>Sustain Gain</td>
                  {presetInfo.map((s: RawSourceData, i) =>
                    numberCell(i, s.instrument, "sustainGain", 3)
                  )}
                </tr>
                <tr>
                  <td>End Gain</td>
                  {presetInfo.map((s: RawSourceData, i) =>
                    numberCell(i, s.instrument, "noteEndGain", 3)
                  )}
                </tr>
                <tr>
                  <td>Average Signal Level</td>
                  {presetInfo.map((s: RawSourceData, i) => (
                    <td key={`signallevel-${i}`} style={{ textAlign: "right" }}>
                      {precisionString(signalLevel(s.source.sample[0]), 5)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          ) : null}
          <div id="drawenvelopes">
            <>{drawEnvelopes(presetInfo)}</>
          </div>
          {/* draw all of the envelopes across the bottom xmin is 0, xmax max(totalTime), ymin is 0, ymax is attenuation for each
          each is stacked with height of 50
            */}
        </div>
        <div className="modal-footer">
          <button onClick={() => setViewPreset(false)}>Done</button>
        </div>
      </div>
    </>
  );
}
