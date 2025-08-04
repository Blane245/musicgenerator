import { ChangeEvent, useState } from "react";
import { frequencyToMidi, midiToFrequency } from "sfcomponents/util";

export interface MidiFrequencyDialogProps {
  setOpen: Function;
}

export default function MidiFrequencyDialog(
  props: MidiFrequencyDialogProps
): JSX.Element {
  const { setOpen } = props;
  const [midiFrequency, setMidiFrequency] = useState<number>(0);
  const [frequencyMidi, setFrequencyMidi] = useState<number>(0);
  function handleMidiChange(e: ChangeEvent<HTMLInputElement>) {
    const midi: number = parseFloat(e.currentTarget.value);
    setMidiFrequency(midiToFrequency(midi));
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
          </label>
          <br />
          <button onClick={() => setOpen(false)}>Close</button>
        </div>
      </div>
    </>
  );
}
