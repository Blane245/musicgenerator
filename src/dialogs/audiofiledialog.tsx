//TODO refresh the dialog when the file is loaded.
//TODO loading file should set stopTime based on file duration and startTime
import { ChangeEvent, useEffect, useState } from "react";
import { AudioFile } from "../classes/generators";
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
  const [fileData, setFileData] = useState<{
    name: string | null;
    duration: number | null;
    sampleRate: number | null;
    length: number | null;
  }>({
    name: null,
    duration: null,
    sampleRate: null,
    length: null,
  });

  useEffect(() => {
    if (formData.fileName != "") {
      setFileData({
        name: formData.fileName,
        duration: formData.duration,
        sampleRate: formData.sampleRate,
        length: formData.samples.length,
      });
      console.log("file name", formData.fileName);
    } else
      setFileData({
        name: null,
        duration: null,
        sampleRate: null,
        length: null,
      });
  }, [formData.fileName]);

  // ask the user for an audio file
  // read the file
  // decode the audio
  // update the audiofile object
  function handleFileClick() {
    // tell the audiofile object to ask to load a file
    // and then decode it
    // formData.setAttribute("filename", "");
    handleChange({
      target: {
        name: "filename",
        value: "TBD",
      },
    } as ChangeEvent<HTMLInputElement>);
    if (formData.fileName != "") {
      setFileData({
        name: formData.fileName,
        duration: formData.duration,
        sampleRate: formData.sampleRate,
        length: formData.samples.length,
      });
      console.log("file name", formData.fileName);
    } else
      setFileData({
        name: null,
        duration: null,
        sampleRate: null,
        length: null,
      });
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
      {fileData.name &&
      fileData.duration &&
      fileData.sampleRate &&
      fileData.length ? (
        <>
          <span style={{ fontSize: "12pt" }}>
            &nbsp;Current Audio File: {fileData.name}
            &nbsp;Duration:
            {precision(fileData.duration, 1)} (sec), Sample Rate: &nbsp;
            {fileData.sampleRate} (bits/sec), Channel Count:&nbsp;{" "}
            {fileData.length}
          </span>
        </>
      ) : null}
    </>
  );
}
