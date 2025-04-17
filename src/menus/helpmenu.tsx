// The file menu handles creating new files, opening existing ones,

import { ChangeEvent, useState } from "react";
import { frequencyToMidi, midiToFrequency } from '../sfcomponents/util';

// saving current ones, and adding tracks to current ones
export default function HelpMenu() {
  const [open, setOpen] = useState<boolean>(false);
  const [about, setAbout] = useState<boolean>(false);
  const [midiFrequency, setMidiFrequency] = useState<number>(0);
  const [frequencyMidi, setFrequencyMidi] = useState<number>(0);

  // handle request to open a file.
  // if the current one is 'dirty' the user is asked to confirm over-write
  function handleGuide() {}

  function handleConverter() {
    setOpen(true);
  }
  function handleMenuSelect(action: string) {
    switch (action) {
      case "about":
        setAbout(true);
        break;
      case "guide":
        handleGuide();
        break;
      case "converter":
        handleConverter();
        break;
      default:
        break;
    }
  }

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
      <fieldset>
        <div className="navbar">
          <div className="dropdown">
            <div className="dropbtn">
              Help
              <i className="fa fa-caret-down"></i>
            </div>
            <div className="dropdown-one">
              <a className="dItem" onClick={() => handleMenuSelect("about")}>
                About CMG...
              </a>
              <a className="dItem" onClick={() => handleMenuSelect("guide")}>
                CMG User's Guide...
              </a>
              <a
                className="dItem"
                onClick={() => handleMenuSelect("converter")}
              >
                Midi/Frequency Converter...
              </a>
            </div>
          </div>
        </div>
      </fieldset>
      {open ? (
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
                ></input>
              </label>
              <text> {midiFrequency} (Hz)</text>
              <br />
              <label>
                Frequency (Hz)&nbsp;
                <input
                  type="number"
                  onChange={(e) => handleFrequencyChange(e)}
                ></input>
                <text> {frequencyMidi}</text>
              </label>
              <br />
              <button onClick={() => setOpen(false)}>Close</button>
            </div>
          </div>
        </>
      ) : null}
      {about ? (
        <>
          <div className="modal-content" style={{ display: "block" }}>
            <div className="modal-header">
              <h2>{"About Computer Music Generator (CMG)"}</h2>
            </div>
            <div className="modal-body">
              <table>
                <tbody>
                <tr>
                  <th>Version</th>
                  <td>{import.meta.env.PACKAGE_VERSION}</td>
                </tr>
                <tr>
                  <th>Author</th>
                  <td>{import.meta.env.AUTHOR.name}</td>
                </tr>
                <tr>
                  <th>Repository</th>
                  <td>{import.meta.env.REPOSITORY.url}</td>
                </tr>
                <tr>
                  <th>Build Date</th>
                  <td>{import.meta.env.VITE_BUILD_DATE}</td>
                </tr>
                </tbody>
              </table>
              <div className="modal-footer">
                <button onClick={() => setAbout(false)}>Close</button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
