//TODO refresh the dialog when the file is loaded.
//TODO loading file should set stopTime based on file duration and startTime
import { ChangeEvent } from "react";
import {AudioFile} from "../classes/generators";
import { precision } from "../sfcomponents/util";

// provides the form fields and validators for the sfperiodic generator
export interface AudioFileDialogProps {
  formData: AudioFile;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}
export default function AudioFileDialog(
  props: AudioFileDialogProps
): JSX.Element {
  const { formData, handleChange } = props;

  // ask the user for an audio file
  // read the file
  // decode the audio
  // update the audiofile object
  function handleFileClick() {
    // tell the audiofile object to ask to load a file
    // and then decode it
    formData.setAttribute("fileName", "");
  }

  return (
    <>
      <label>
        Volume:&nbsp;
        <input
          name="volume"
          type="number"
          onChange={handleChange}
          min={-20}
          max={20}
          step={1}
          value={formData.volume}
        />
        <span> (-20 to +20dB) </span>
      </label>
      &nbsp;
      <input
        type="button"
        name="audiofilebutton"
        id="audiofilebutton"
        onClick={handleFileClick}
        style={{ fontSize: "12pt" }}
        value="Audio File..."
      />
      {formData.fileName != "" ? (
        <>
          <span style={{ fontSize: "12pt" }}>
            &nbsp;Current Audio File: {formData.fileName}
          </span>
          <br />
          <span style={{ fontSize: "12pt" }}>
            Duration:
            {precision(formData.duration, 1)} (sec), Sample Rate: &nbsp;
            {formData.sampleRate} (bits/sec), Channel Count:&nbsp;{" "}
            {formData.samples.length}
          </span>
        </>
      ) : null}
    </>
  );
}
