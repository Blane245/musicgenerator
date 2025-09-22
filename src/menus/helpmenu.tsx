// The file menu handles creating new files, opening existing ones,

import { useCMGContext } from "cmgcontext";
import MidiFrequencyDialog from "dialogs/midifrequencydialog";
import { useState } from "react";

// saving current ones, and adding tracks to current ones
export default function HelpMenu() {
  const { playing } = useCMGContext();
  const [open, setOpen] = useState<boolean>(false);
  const [about, setAbout] = useState<boolean>(false);

  function handleConverter() {
    setOpen(true);
  }
  function handleMenuSelect(action: string) {
    if (playing.current) return;
    switch (action) {
      case "about":
        setAbout(true);
        break;
      case "converter":
        handleConverter();
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
            Help
            <i className="fa fa-caret-down"></i>
          </div>
          <div className="dropdown-one">
            <a className="dItem" onClick={() => handleMenuSelect("about")}>
              About CMG...
            </a>
            {/* <a className="dItem" onClick={() => {window.open("CMG User Manual.pdf"); return false;}}> */}
            <a className="dItem" download={"CMG User Manual.pdf"} href="/src/assets/CMG User Manual.pdf">
              Download CMG User's Manual...
            </a>
            <a className="dItem" onClick={() => handleMenuSelect("converter")}>
              Midi/Frequency Converter...
            </a>
          </div>
        </div>
      </div>
      {open ? <MidiFrequencyDialog setOpen={setOpen} /> : null}
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
                    <td>{import.meta.env.VERSION}</td>
                  </tr>
                  <tr>
                    <th>Author</th>
                    <td>{import.meta.env.AUTHOR.name}</td>
                  </tr>
                  <tr>
                    <th>Home Page</th>
                    <td>
                      <a href={import.meta.env.HOMEPAGE}>
                        {import.meta.env.HOMEPAGE}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <th>Repository</th>
                    <td>
                      <a href={import.meta.env.REPOSITORY.url}>
                        {import.meta.env.REPOSITORY.url}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <th>Build Date</th>
                    <td>{import.meta.env.BUILD_DATE}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button onClick={() => setAbout(false)}>Close</button>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
