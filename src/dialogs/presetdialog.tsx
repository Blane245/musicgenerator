import { Algorithmic } from "classes/generators";
import { ChangeEvent, useEffect, useState } from "react";
import { getPresetNote } from "sfcomponents/getpresetnote";
import { Preset } from "sfcomponents/types";
import {
  bankPresettoName,
  precisionString,
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
  const [presetAttack, setPresetAttack] = useState<number>(63);
  const [presetInterval, setPresetInterval] = useState<number>(1);
  const [presetDuration, setPresetDuration] = useState<number>(100);
  const [presetVolume, setPresetVolume] = useState<number>(0);
  const [presetInfo, setPresetInfo] = useState<RawSourceData[]>([]);

  useEffect(() => {
    let midi: number = 60;
    if (generator.noteP) midi = generator.noteP.getCurrentValue(0);

    setPresetMidi(midi);
    let interval: number = 1;
    if (generator.speedP) {
      const value = generator.speedP.getCurrentValue(0);
      interval = value == 0 ? 1 : 60.0 / value;
    }

    setPresetInterval(interval);
    let duration: number = 100;
    if (generator.durationP) duration = generator.durationP.getCurrentValue(0);

    setPresetDuration(duration);
    let volume: number = 0;
    if (generator.volumeP) volume = generator.volumeP.getCurrentValue(0);

    setPresetVolume(volume);

    let attack: number = 63;
    if (generator.attackP) attack = generator.attackP.getCurrentValue(0);

    setPresetAttack(attack);

    if (preset)
      getPresetData(preset, interval, duration, midi, attack, volume);
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
          preset,
          presetInterval,
          presetDuration,
          presetMidi,
          presetAttack,
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
        presetAttack,
        presetVolume
      );
  }

  function handlepresetAttack(e: ChangeEvent) {
    const attack = e.target["value"];
    setPresetAttack(attack);
    if (preset)
      getPresetData(
        preset,
        presetInterval,
        presetDuration,
        presetMidi,
        attack,
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
        presetAttack,
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
        presetAttack,
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
        presetAttack,
        volume
      );
  }

  function signalLevel(sample: Float32Array): number {
    let level: number = 0;
    sample.forEach((s) => {
      level += Math.abs(s);
    });
    return sample.length == 0 ? 0 : level / sample.length;
  }

  const DISPLAYWIDTH: number = 1500;
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
    pI.forEach((p) => {
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
          >
            <path d={path} fill="black" />
          </svg>
        );
        result.push(<br />);
      }
    });
    return result;
  }

  const numberCell = (object: object | undefined, value: string, precision: number): JSX.Element => {
    if (object == undefined || object[value] == undefined) return <td style={{textAlign:'right'}}>0</td>;
    return (
      <td style={{ textAlign: "right" }}>
        {precisionString(object[value], precision)}
      </td>
    );
  };
  const lengthCell = (object: object | undefined, array: string, dimension: number, precision: number): JSX.Element => {
    if (object == undefined || object[array] == undefined) return <td style={{textAlign:'right'}}>0</td>;
    const value: number = dimension < 0? object[array].length: object[array][dimension].length;
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
          width: DISPLAYWIDTH.toString()+'px',
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
                <tr key='name'>
                  <td>name</td>
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
                  <td>sampleRate</td>
                  {presetInfo.map((s: RawSourceData) => (
                    numberCell(s.source, 'sampleRate', 0)
                  ))}
                </tr>
                <tr>
                  <td>loopStart</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td style={{ textAlign: "right" }}>
                      {s.instrument?.loopStart}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>loopEnd</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td style={{ textAlign: "right" }}>
                      {s.instrument?.loopEnd}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>loop</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td style={{ textAlign: "right" }}>
                      {s.instrument?.loop ? "true" : "false"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>rootKey</td>
                  {presetInfo.map((s: RawSourceData) => (
                    numberCell(s.instrument, 'rootKey', 0)
                  ))}
                </tr>
                <tr>
                  <td>pitchCorrection</td>
                  {presetInfo.map((s: RawSourceData) => (
                    numberCell(s.instrument, 'pitchCorrection', 0)
                  ))}
                </tr>
                <tr>
                  <td>fineTune</td>
                  {presetInfo.map((s: RawSourceData) => (
                    numberCell(s.instrument, 'fineTune', 0)
                  ))}
                </tr>
                <tr>
                  <td>baseDetune</td>
                  {presetInfo.map((s: RawSourceData) => (
                    numberCell(s.instrument, 'baseDetune', 0)
                  ))}
                </tr>
                <tr>
                  <td>cents</td>
                  {presetInfo.map((s: RawSourceData) =>
                    numberCell(s.instrument, 'cents', 0)
                  )}
                </tr>
                <tr>
                  <td>delayVolEnv</td>
                  {presetInfo.map((s: RawSourceData) => (
                    numberCell(s.instrument, 'delayVolEnv', 0)
                  ))}
                </tr>
                <tr>
                  <td>attackVolEnv</td>
                  {presetInfo.map((s: RawSourceData) => (
                    numberCell(s.instrument, 'attackVolEnv', 0)
                  ))}
                </tr>
                <tr>
                  <td>holdVolEnv</td>
                  {presetInfo.map((s: RawSourceData) => (
                    numberCell(s.instrument, 'holdVolEnv', 0)
                  ))}
                </tr>
                <tr>
                  <td>decayVolEnv</td>
                  {presetInfo.map((s: RawSourceData) => (
                    numberCell(s.instrument, 'delayVolEnv', 0)
                  ))}
                </tr>
                <tr>
                  <td>sustainVolEnv</td>
                  {presetInfo.map((s: RawSourceData) => (
                    numberCell(s.instrument, 'sustainVolEnv', 0)
                  ))}
                </tr>
                <tr>
                  <td>releaseVolEnv</td>
                  {presetInfo.map((s: RawSourceData) => (
                    numberCell(s.instrument, 'releaseVolEnv', 0)
                  ))}
                </tr>
                <tr>
                  <td>delayEnd</td>
                  {presetInfo.map((s: RawSourceData) => (
                    numberCell(s.instrument, 'delayEnd', 3)
                  ))}
                </tr>
                <tr>
                  <td>attackEnd</td>
                  {presetInfo.map((s: RawSourceData) => (
                    numberCell(s.instrument, 'attackEnd', 3)
                    )
                  )}
                </tr>
                <tr>
                  <td>holdEnd</td>
                  {presetInfo.map((s: RawSourceData) => (
                    numberCell(s.instrument, 'holdEnd', 3)
                    )
                  )}
                </tr>
                <tr>
                  <td>decayEnd</td>
                  {presetInfo.map((s: RawSourceData) =>(
                    numberCell(s.instrument, 'decayEnd', 3)
                    )
                  )}
                </tr>
                <tr>
                  <td>noteEnd</td>
                  {presetInfo.map((s: RawSourceData) =>(
                    numberCell(s.instrument, 'noteEnd', 3)
                    )
                  )}
                </tr>
                <tr>
                  <td>interval</td>
                  {presetInfo.map((s: RawSourceData) =>(
                    numberCell(s.instrument, 'interval', 3)
                    )
                  )}
                </tr>
                <tr>
                  <td>duration</td>
                  {presetInfo.map((s: RawSourceData) =>(
                    numberCell(s.instrument, 'duration', 3)
                    )
                  )}
                </tr>
                <tr>
                  <td>releaseEnd</td>
                  {presetInfo.map((s: RawSourceData) =>(
                    numberCell(s.instrument, 'releaseEnd', 3)
                    )
                  )}
                </tr>
                <tr>
                  <td>instrumentSampleRate</td>
                  {presetInfo.map((s: RawSourceData) => (
                    numberCell(s.instrument, 'sampleRate', 0)
                    )
                    )}
                </tr>
                <tr>
                  <td>instrumentSampleLength</td>
                  {presetInfo.map((s: RawSourceData) => (
                    lengthCell(s.instrument, 'sample', -1, 0)
                    )
                    )}
                </tr>
                <tr>
                  <td>sampleLength</td>
                  {presetInfo.map((s: RawSourceData) => (
                    lengthCell(s.source, 'sample', 0, 0)
                    )
                    )}
                </tr>
                <tr>
                  <td>playbackRate</td>
                  {presetInfo.map((s: RawSourceData) => (
                    numberCell(s.source, 'playbackRate', 4)
                    )
                    )}
                </tr>
                <tr>
                  <td>volumeValue</td>
                  {presetInfo.map((s: RawSourceData) => (
                    numberCell(s.instrument, 'volumeValue', 1)
                    )
                    )}
                </tr>
                <tr>
                  <td>volumeGain</td>
                  {presetInfo.map((s: RawSourceData) => (
                    numberCell(s.instrument, 'volumeGain', 3)
                    )
                )}
                </tr>
                <tr>
                  <td>attenuationdB</td>
                  {presetInfo.map((s: RawSourceData) =>(
                    numberCell(s.instrument, 'initialAttenuation', 3)
                    )
                  )}
                </tr>
                <tr>
                  <td>attenuationGain</td>
                  {presetInfo.map((s: RawSourceData) =>(
                    numberCell(s.instrument, 'attenuation', 3)
                    )
                  )}
                </tr>
                <tr>
                  <td>sustainGain</td>
                  {presetInfo.map((s: RawSourceData) =>(
                    numberCell(s.instrument, 'sustainGain', 3)
                    )
                  )}
                </tr>
                <tr>
                  <td>noteEndGain</td>
                  {presetInfo.map((s: RawSourceData) =>(
                    numberCell(s.instrument, 'noteEndGain', 3)
                    )
                  )}
                </tr>
                <tr>
                  <td>signalLevel</td>
                  {presetInfo.map((s: RawSourceData) => (
                    <td style={{ textAlign: "right" }}>
                      {precisionString(signalLevel(s.source.sample[0]), 3)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>totalTime</td>
                  {presetInfo.map((s: RawSourceData) =>(
                    numberCell(s.instrument, 'totalTime', 3)
                    )
                  )}
                </tr>
                {/* <tr>
                  <td>Envelope</td>
                  {presetInfo.map((s: RawSourceData) =>
                    s.instrument ? (
                      <td>
                        <svg
                          height="100"
                          width="300"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d={`M 0 100
                      L${
                        (s.instrument.delayEnd * 300) / s.instrument.totalTime
                      } 100 
                      L${
                        (s.instrument.attackEnd * 300) / s.instrument.totalTime
                      } 0 
                      L${
                        (s.instrument.holdEnd * 300) / s.instrument.totalTime
                      } 0 
                      L${Math.min(
                        (s.instrument.decayEnd * 300) / s.instrument.totalTime,
                        (s.instrument.noteEnd * 300) / s.instrument.totalTime
                      )} ${100 - s.instrument.noteEndGain * 100}  
                      L${
                        (s.instrument.noteEnd * 300) / s.instrument.totalTime
                      } ${100 - s.instrument.noteEndGain * 100} 
                      L${
                        (s.instrument.releaseEnd * 300) / s.instrument.totalTime
                      } 100
                      Z`}
                            style={{ fill: "black" }}
                          />
                        </svg>
                      </td>
                    ) : (
                      <td>{"_"}</td>
                    )
                  )}
                </tr> */}
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
