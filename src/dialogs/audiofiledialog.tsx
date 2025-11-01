import { AudioFile } from "classes/generators/audiofile";
import { ChangeEvent, useEffect, useState } from "react";
import { precision } from "sfcomponents/util";

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
  async function handleFileClick() {
    try {
      const handles: FileSystemFileHandle[] | void =
        await window.showOpenFilePicker({
          multiple: false,
          types: [
            {
              description: "Audio Files",
              accept: { "audio/*": [".mp3", ".wav"] },
            },
          ],
        });
      if (!handles) return;
      const file: File = await handles[0].getFile();
      const buffer: ArrayBuffer = await file.arrayBuffer();
      const context: AudioContext = new AudioContext();
      const audio: AudioBuffer = await context.decodeAudioData(buffer);
      formData.fileName = file.name;
      formData.sampleRate = audio.sampleRate;
      formData.duration = precision(audio.duration, 1);
      formData.stopTime = formData.startTime + formData.duration;
      formData.samples = [];
      for (let i = 0; i < audio.numberOfChannels; i++) {
        const channelData: Float32Array = audio.getChannelData(i);
        formData.samples.push(channelData);
      }
      setFileData({
        name: formData.fileName,
        duration: formData.duration,
        sampleRate: formData.sampleRate,
        length: formData.samples.length,
      });
      console.log("file name", formData.fileName);
      handleChange({
        target: { name: "filename", value: formData.fileName },
      } as ChangeEvent<HTMLInputElement>);
    } catch {
      // user aborted opening the file
      formData.fileName = "";
      setFileData({
        name: null,
        duration: null,
        sampleRate: null,
        length: null,
      });
    }
  }

  return (
    <>
      <label>
        Volume:&nbsp;
        <input
          name="volume"
          type="number"
          onChange={handleChange}
          min={-10}
          max={10}
          step={1}
          value={formData.volume}
        />
        <span> (-10 to +10dB) </span>
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
