import { Algorithmic } from "classes/generators";
import { ChangeEvent, useEffect, useState } from "react";
import { getPresetNote } from "sfcomponents/getpresetnote";
import { Preset } from "sfcomponents/types";
import {
  bankPresettoName,
  precision,
  presetNameToPreset,
} from "sfcomponents/util";
import { SoundFont2 } from "soundfont2";
import { RawSourceData } from "types";
export interface PresetDialogProps {
  generator: Algorithmic;
  setViewPreset: Function;
}
export default function PresetDialog(props: PresetDialogProps): JSX.Element {
  const { generator, setViewPreset } = props;
  const [SFFile] = useState<SoundFont2 | undefined>(generator.soundFont);
  const [presetName, setPresetName] = useState<string>(generator.presetName);
  const [preset, setPreset] = useState<Preset | undefined>(generator.preset);
  const [presetMidi, setPresetMidi] = useState<number>(60);
  const [presetVel, setPresetVel] = useState<number>(63);
  const [presetInterval, setPresetInterval] = useState<number>(1);
  const [presetDuration, setPresetDuration] = useState<number>(100);
  const [presetVolume, setPresetVolume] = useState<number>(0);
  const [presetInfo, setPresetInfo] = useState<RawSourceData[] | null>(null);

  useEffect(() => {
    let midi: number = 60;
    if (generator.noteP) midi = generator.noteP.getCurrentValue(0);

    setPresetMidi(midi);
    let interval: number = 1;
    if (generator.speedP) {
      const value = generator.speedP.getCurrentValue(0);
      interval = value == 0? 1: 60.0 / value;
    }

    setPresetInterval(interval);
    let duration: number = 100;
    if (generator.durationP) duration = generator.durationP.getCurrentValue(0);

    setPresetDuration(duration);
    let volume: number = 0;
    if (generator.volumeP) volume = generator.volumeP.getCurrentValue(0);

    setPresetVolume(volume);

    const velocity: number = generator.velocity;
    setPresetVel(velocity);
    if (preset != undefined)
      getPresetData(preset, interval, duration, midi, velocity, volume);
  }, []);

  // given a preset, midi, and velocity, get the envelope data
  function getPresetData(
    preset: Preset,
    interval: number,
    duration: number,
    midi: number,
    vel: number,
    vol: number
  ) {
    const result: RawSourceData[] = getPresetNote(
      generator,
      preset,
      0,
      0,
      interval,
      (interval * duration) / 100.0,
      midi,
      vel,
      vol,
      0,
      0,
      0
    );
    if (result.length > 0) setPresetInfo(result);
    else setPresetInfo(null);
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
          preset,
          presetInterval,
          presetDuration,
          presetMidi,
          presetVel,
          presetVolume
        );
      }
    }
  }

  function handlePresetMidi(e: ChangeEvent) {
    const midi = e.target["value"];
    setPresetMidi(midi);
    if (preset)
      getPresetData(
        preset,
        presetInterval,
        presetDuration,
        midi,
        presetVel,
        presetVolume
      );
  }

  function handlePresetVel(e: ChangeEvent) {
    const vel = e.target["value"];
    setPresetVel(vel);
    if (preset)
      getPresetData(
        preset,
        presetInterval,
        presetDuration,
        presetMidi,
        vel,
        presetVolume
      );
  }

  function handlePresetDuration(e: ChangeEvent) {
    const duration = e.target["value"];
    setPresetDuration(duration);
    if (preset)
      getPresetData(
        preset,
        presetInterval,
        duration,
        presetMidi,
        presetVel,
        presetVolume
      );
  }

  function handlePresetInterval(e: ChangeEvent) {
    const interval = e.target["value"];
    setPresetInterval(interval);
    if (preset)
      getPresetData(
        preset,
        interval,
        presetDuration,
        presetMidi,
        presetVel,
        presetVolume
      );
  }

  function handlePresetVolume(e: ChangeEvent) {
    const volume = e.target["value"];
    setPresetVolume(volume);
    if (preset)
      getPresetData(
        preset,
        presetInterval,
        presetDuration,
        presetMidi,
        presetVel,
        volume
      );
  }

  function drawEnvelope(s: RawSourceData) {
    if (!s.instrument) return ;
    const canvas: HTMLCanvasElement | null = document.getElementById(s.instrument.name) as HTMLCanvasElement;
    if (!canvas) return ;
    const ctx:CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (!ctx) return ;
    const tScale: number = canvas.width / s.instrument.totalTime;
    const aScale: number =  canvas.height / s.instrument.volumeGain;
    // envelope points
    const times: number[] = [
      0, 
      s.instrument.delayEnd * tScale,
      s.instrument.attackEnd * tScale,
      s.instrument.holdEnd * tScale,
      s.instrument.decayEnd * tScale,
      s.instrument.noteEnd * tScale,
      s.instrument.releaseEnd * tScale,
    ]
    const gains: number[] = [
      0,
      0,
      s.instrument.volumeGain * aScale,
      s.instrument.volumeGain * aScale,
      s.instrument.sustainGain * aScale,
      s.instrument.noteEndGain * aScale,
      0,
    ]
    ctx.beginPath();
    ctx.moveTo(times[0],gains[0]);
    times.forEach((t, i) => {
      if (i != 0)
        ctx.lineTo(t, gains[i]);
    });
    ctx.fill();
    return
  }

  return (
    <>
      <div
        className="modal-content"
        style={{
          display: "block",
          top: 0,
          left: 0,
          width: "100em",
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
            &nbsp;Velocity:&nbsp;
            <input
              type="number"
              min={0}
              max={127}
              step={1}
              onChange={(e) => handlePresetVel(e)}
              value={presetVel}
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
              step={0.1}
              onChange={(e) => handlePresetVolume(e)}
              value={presetVolume}
            ></input>
            <span>&nbsp;(-10 - +10)</span>
          </label>
          <br />
          {presetInfo ? (
            <table>
              <tbody>
                <tr>
                  <td>name</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td key={'name-'+s.instrument?.name}>{s.instrument?.name}</td>
                  ))}
                </tr>
                <tr>
                  <td>loopStart</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.loopStart}</td>
                  ))}
                </tr>
                <tr>
                  <td>loopEnd</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.loopEnd}</td>
                  ))}
                </tr>
                <tr>
                  <td>loop</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.loop ? "true" : "false"}</td>
                  ))}
                </tr>
                <tr>
                  <td>rootKey</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.rootKey}</td>
                  ))}
                </tr>
                <tr>
                  <td>pitchCorrection</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.pitchCorrection}</td>
                  ))}
                </tr>
                <tr>
                  <td>fineTune</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.fineTune}</td>
                  ))}
                </tr>
                <tr>
                  <td>baseDetune</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.baseDetune}</td>
                  ))}
                </tr>
                <tr>
                  <td>cents</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.cents}</td>
                  ))}
                </tr>
                <tr>
                  <td>delayVolEnv</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.delayVolEnv}</td>
                  ))}
                </tr>
                <tr>
                  <td>attackVolEnv</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.attackVolEnv}</td>
                  ))}
                </tr>
                <tr>
                  <td>holdVolEnv</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.holdVolEnv}</td>
                  ))}
                </tr>
                <tr>
                  <td>decayVolEnv</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.decayVolEnv}</td>
                  ))}
                </tr>
                <tr>
                  <td>sustainVolEnv</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.sustainVolEnv}</td>
                  ))}
                </tr>
                <tr>
                  <td>releaseVolEnv</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.releaseVolEnv}</td>
                  ))}
                </tr>
                <tr>
                  <td>delayEnd</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.delayEnd}</td>
                  ))}
                </tr>
                <tr>
                  <td>attackEnd</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.attackEnd}</td>
                  ))}
                </tr>
                <tr>
                  <td>holdEnd</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.holdEnd}</td>
                  ))}
                </tr>
                <tr>
                  <td>decayEnd</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.decayEnd}</td>
                  ))}
                </tr>
                <tr>
                  <td>noteEnd</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.noteEnd}</td>
                  ))}
                </tr>
                <tr>
                  <td>interval</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.interval}</td>
                  ))}
                </tr>
                <tr>
                  <td>duration</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.duration}</td>
                  ))}
                </tr>
                <tr>
                  <td>releaseEnd</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.releaseEnd}</td>
                  ))}
                </tr>
                <tr>
                  <td>totalTime</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.totalTime}</td>
                  ))}
                </tr>
                <tr>
                  <td>sampleRate</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.source.sampleRate}</td>
                  ))}
                </tr>
                <tr>
                  <td>sampleLength</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.source.sample[0].length}</td>
                  ))}
                </tr>
                <tr>
                  <td>playbackRate</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{precision(s.source.playbackRate, 4)}</td>
                  ))}
                </tr>
                <tr>
                  <td>volumeValue</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.volumeValue}</td>
                  ))}
                </tr>
                <tr>
                  <td>volumeGain</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td>{s.instrument?.volumeGain}</td>
                  ))}
                </tr>
                <tr>
                  <td>attenuation</td>
                  {presetInfo.map((s: RawSourceData) => (
                    s.instrument? 
                    <td>{precision(s.instrument.attenuation, 3)}</td>
                    :<td>0</td>
                  ))}
                </tr>
                <tr>
                  <td>sustainGain</td>
                  {presetInfo.map((s: RawSourceData) => (
                    s.instrument?
                    <td>{precision(s.instrument.sustainGain, 3)}</td>
                    :<td>0</td>
                  ))}
                </tr>
                <tr>
                  <td>noteEndGain</td>
                  {presetInfo.map((s: RawSourceData) => (
                    s.instrument?
                    <td>{precision(s.instrument.noteEndGain, 3)}</td>
                    :<td>0</td>
                  ))}
                </tr>
                <tr>
                  <td>Envelope</td>
                  {presetInfo.map((s: RawSourceData) => (
                    s.instrument?
                    <td><svg height='100' width='300' xmlns="http://www.w3.org/2000/svg">
                      <path d={`M 0 100
                      L${s.instrument.delayEnd * 300 / s.instrument.totalTime} 100 
                      L${s.instrument.attackEnd * 300 / s.instrument.totalTime} 0 
                      L${s.instrument.holdEnd * 300 / s.instrument.totalTime} 0 
                      L${s.instrument.decayEnd * 300 / s.instrument.totalTime} ${100-s.instrument.noteEndGain*100}  
                      L${s.instrument.noteEnd * 300 / s.instrument.totalTime} ${100-s.instrument.noteEndGain*100} 
                      L${s.instrument.releaseEnd * 300 / s.instrument.totalTime} 100
                      Z`}
                      style={{fill:'black'}} />
                    </svg></td>
                    :<td>0</td>
                  ))}
                </tr>
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
