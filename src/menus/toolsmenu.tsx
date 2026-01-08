// various use tools

import { useCMGContext } from "cmgcontext";
import { GenAlignDialog, GenEqualDialog, GenStaggerDialog } from "dialogs/generator/generatortooldialogs";
import { ChangeEvent, useState } from "react";
import { frequencyToMidi, midiToFrequency, toNote } from "sfcomponents/util";

export default function ToolsMenu() {
  const [freqTool, setFreqTool] = useState<boolean>(false);
  const [measureTool, setMeasureTool] = useState<boolean>(false);
  const [oscTool, setOscTool] = useState<boolean>(false);
  const [genEqualTool, setGenEqualTool] = useState<boolean>(false);
  const [genStaggerTool, setGenStaggerTool] = useState<boolean>(false);
  const [genAlignTool, setGenAlignTool] = useState<boolean>(false);
  const {fileContents, setFileContents, timeLine} = useCMGContext();

  function handleMenuSelect(action: string) {
    switch (action) {
      case "freq":
        setFreqTool(true);
        break;
      case "editor":
        window.open(import.meta.env.SEQUENCEEDITORURL);
        break;
      case "measure":
        setMeasureTool(true);
        break;
      case "osc":
        setOscTool(true);
        break;
      case "genequal":
        setGenEqualTool(true);
        break;
      case "genstagger":
        setGenStaggerTool(true);
        break;
      case "genalign":
        setGenAlignTool(true);
        break;
      default:
        break;
    }
  }

  return (
    <>
      <div className="navbar">
        <div className="dropdown">
          <div className="dropbtn">
            Tools
            <i className="fa fa-caret-down"></i>
          </div>
          <div className="dropdown-one">
            <a className="dItem" onClick={() => handleMenuSelect("freq")}>
              Midi/Frequency Converter...
            </a>
            <a className="dItem" onClick={() => handleMenuSelect("editor")}>
              Start CMG Sequence Editor
            </a>
            <a className="dItem" onClick={() => handleMenuSelect("measure")}>
              Measure Duration Calculator...
            </a>
            <a className="dItem" onClick={() => handleMenuSelect("osc")}>
              Oscillator Frequency Calculator...
            </a>
            <a className="dItem" onClick={() => handleMenuSelect("genequal")}>
              Set Generators Duration Equal...
            </a>
            <a className="dItem" onClick={() => handleMenuSelect("genstagger")}>
              Stagger Generators Start Time...
            </a>
            <a className="dItem" onClick={() => handleMenuSelect("genalign")}>
              Align Generators...
            </a>
          </div>
        </div>
      </div>
      {freqTool ? <MidiFrequencyDialog setOpen={setFreqTool} /> : null}
      {measureTool ? <MeasureDurationDialog setOpen={setMeasureTool} /> : null}
      {oscTool ? <OscillatorFrequencyDialog setOpen={setOscTool} /> : null}
      {genEqualTool ? <GenEqualDialog 
      fileContents={fileContents}
      setFileContents={setFileContents}
      enabled={setGenEqualTool} 
      /> : null}
      {genStaggerTool ? <GenStaggerDialog 
      fileContents={fileContents}
      timeLine={timeLine}
      setFileContents={setFileContents}
      enabled={setGenStaggerTool} 
      /> : null}
      {genAlignTool ? <GenAlignDialog 
      fileContents={fileContents}
      setFileContents={setFileContents}
      enabled={setGenAlignTool} 
      /> : null}
    </>
  );
}

interface MidiFrequencyDialogProps {
  setOpen: Function;
}

function MidiFrequencyDialog(props: MidiFrequencyDialogProps): JSX.Element {
  const { setOpen } = props;
  const [midiFrequency, setMidiFrequency] = useState<number>(0);
  const [frequencyMidi, setFrequencyMidi] = useState<number>(0);
  function handleMidiChange(e: ChangeEvent<HTMLInputElement>) {
    const pitch: number = parseFloat(e.currentTarget.value);
    setMidiFrequency(midiToFrequency(pitch));
  }
  function handleFrequencyChange(e: ChangeEvent<HTMLInputElement>) {
    const frequency: number = parseFloat(e.currentTarget.value);
    setFrequencyMidi(frequencyToMidi(frequency));
  }

  return (
    <>
      <div className="modal-content" style={{ display: "block" }}>
        <div className="modal-header">
          <h2>{"Midi<->Frequency Converter"}</h2>
        </div>
        <div className="modal-body">
          <label>
            Midi{" "}
            <input
              type="number"
              onChange={(e) => handleMidiChange(e)}
              defaultValue={0}
            ></input>
          </label>
          <text> {midiFrequency.toFixed(3)} (Hz)</text>
          <br />
          <label>
            Frequency (Hz)&nbsp;
            <input
              type="number"
              onChange={(e) => handleFrequencyChange(e)}
              defaultValue={0}
            ></input>
            <text> {frequencyMidi.toFixed(3)}</text>
            <span>{" " + toNote(frequencyMidi)}</span>
          </label>
          <br />
        </div>
        <div className="modal-footer">
          <button onClick={() => setOpen(false)}>Close</button>
        </div>
      </div>
    </>
  );
}

interface MeasureDurationDialogProps {
  setOpen: Function;
}

function MeasureDurationDialog(props: MeasureDurationDialogProps): JSX.Element {
  const { setOpen } = props;
  const [beats, setBeats] = useState<number>(0);
  const [BPM, setBPM] = useState<number>(0);
  const [length, setLength] = useState<number>(0);

  function onBeatsChange(e: ChangeEvent<HTMLInputElement>) {
    const beats: number = parseFloat(e.currentTarget.value);
    if (BPM > 0) setLength((beats * 60) / BPM);
    else setLength(0);
    setBeats(beats);
  }
  function onBPMChange(e: ChangeEvent<HTMLInputElement>) {
    const BPM: number = parseFloat(e.currentTarget.value);
    if (BPM > 0) setLength((beats * 60) / BPM);
    else setLength(0);
    setBPM(BPM);
  }

  return (
    <div className="modal-content" style={{ display: "block" }}>
      <div className="header">
        <h2>{"Measure Duration Calculator"}</h2>
      </div>
      <div className="body">
        <label>
          Number of Beats:
          <input
            type="number"
            onChange={(e) => onBeatsChange(e)}
            defaultValue={0}
            min={0}
            step={1}
          ></input>
        </label>
        <br />
        <label>
          Beats/Minute:
          <input
            type="number"
            onChange={(e) => onBPMChange(e)}
            defaultValue={0}
            min={1}
            step={0.001}
          ></input>
        </label>
        <br />
        <label>
          Measure Duration
          <text> {length.toFixed(3)} (sec)</text>
        </label>
      </div>
      <div className="footer">
        <button onClick={() => setOpen(false)}>Close</button>
      </div>
    </div>
  );
}

interface OscillatorFrequencyDialogProps {
  setOpen: Function;
}

function OscillatorFrequencyDialog(
  props: OscillatorFrequencyDialogProps
): JSX.Element {
  const { setOpen } = props;
  const [amplitude, setAmplitude] = useState<number>(0);
  const [BPM, setBPM] = useState<number>(60);
  const [freq, setFreq] = useState<number>(0);

  function onAmplitudeChange(e: ChangeEvent<HTMLInputElement>) {
    const amplitude: number = parseFloat(e.currentTarget.value);
    if (amplitude > 0 && BPM > 0) setFreq(60000 / (BPM * amplitude));
    else setFreq(0);
    setAmplitude(amplitude);
  }
  function onBPMChange(e: ChangeEvent<HTMLInputElement>) {
    const BPM: number = parseFloat(e.currentTarget.value);
    if (amplitude > 0 && BPM > 0) setFreq(60000 / (BPM * amplitude));
    else setFreq(0);
    setBPM(BPM);
  }

  return (
    <div className="modal-content" style={{ display: "block" }}>
      <div className="header">
        <h2>{"Oscillator Frequency Calculator"}</h2>
      </div>
      <div className="body">
        <label>
          Amplitude:
          <input
            type="number"
            onChange={(e) => onAmplitudeChange(e)}
            defaultValue={0}
            min={0.001}
            step={0.001}
          ></input>
        </label>
        <br />
        <label>
          Beats/Minute:
          <input
            type="number"
            onChange={(e) => onBPMChange(e)}
            defaultValue={0}
            min={1}
            step={0.001}
          ></input>
        </label>
        <br />
        <label>
          Frequency to hit all values
          <text> {freq.toFixed(3)} (mHz)</text>
        </label>
      </div>
      <div className="footer">
        <button onClick={() => setOpen(false)}>Close</button>
      </div>
    </div>
  );
}
