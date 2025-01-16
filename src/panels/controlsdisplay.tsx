// file-level controls
// includes the soundfont file selector, record button, record format selector
// preview button, stop button
// timeline controls and timeline
import { ChangeEvent, useEffect, useState } from "react";
import { SoundFont2 } from "soundfont2";
import SFPG from "../classes/sfpg";
import SFRG from "../classes/sfrg";
import Track from "../classes/track";
import Wiener from "../classes/wiener";
import { useCMGContext } from "../cmgcontext";
import Generate from "../generation/generate";
import { Preset } from "../sfcomponents/types";
import { bankPresettoName } from "../sfcomponents/util";
import { CMGeneratorType, GENERATIONMODE, GENERATORTYPE } from "../types";
import { modifyGenerator, setSoundFont } from "../utils/cmfiletransactions";
import fetchData from "../utils/fetchdata";
import { loadSoundFont } from "../utils/loadsoundfont";
import TimeLineDisplay from "./timelinedisplay";

export default function ControlsDisplay() {
  const { fileContents, setFileContents, setStatus, playing } = useCMGContext();
  const [SFfiles, setSFFiles] = useState<string[]>([]);
  const [SFFileName, setSFFileName] = useState<string>("");
  const [readyGenerate, setReadyGenerate] = useState<boolean>(true);
  const [mode, setMode] = useState<GENERATIONMODE>(GENERATIONMODE.idle);
  const [showStop, setShowStop] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [recordFormat, setRecordFormat] = useState<string>("mp3");
  const [recordHandle, setRecordHandle] = useState<FileSystemFileHandle | null>(
    null
  );

  // load the soundfont file list from the server at start up
  useEffect(() => {
    async function getSFFileList() {
      const uri = "/soundfonts/list";
      const response = await fetchData(uri, "GET");
      if (!response.error) {
        const newList = response.list;
        newList.unshift("select a file");
        setSFFiles(newList);
      } else
        setStatus("controldisplay: error file reading soundfont file list");
    }
    getSFFileList();
  }, []);

  // show the stop button when playing
  useEffect(() => {
    setShowStop(playing.current);
  }, [playing.current]);

  // update the SF file name when the file contents file name changes
  useEffect(() => {
    if (fileContents) setSFFileName(fileContents.SFFileName);
  }, [fileContents.SFFileName]);

  // control the record and preview buttons
  // only enabled when a soundfont file is defined
  // and all SFPG and SFRG generators have presets and midi numbers assigned
  useEffect(() => {
    if (!fileContents) {
      setReadyGenerate(false);
      return;
    }
    if (fileContents.tracks.length == 0) {
      setReadyGenerate(false);
      return;
    }
    let goodGeneratorCount: number = 0;
    fileContents.tracks.forEach((t: Track) => {
      t.generators.forEach((g: CMGeneratorType) => {
        if (g.type != GENERATORTYPE.CMG) {
          if (
            g.type == GENERATORTYPE.SFPG &&
            (g as SFPG).presetName != "" &&
            (g as SFPG).preset &&
            (g as SFPG).midi >= 0 &&
            (g as SFPG).midi <= 127
          ) {
            goodGeneratorCount++;
          } else if (
            g.type == GENERATORTYPE.SFRG &&
            (g as SFRG).presetName != "" &&
            (g as SFRG).preset &&
            (g as SFRG).midiT.startValue >= 0 &&
            (g as SFRG).midiT.startValue <= 127
          ) {
            goodGeneratorCount++;
          } else if (g.type == GENERATORTYPE.Noise) {
            goodGeneratorCount++;
          } else if (g.type == GENERATORTYPE.AudioFile) {
            goodGeneratorCount++;
          } else if (g.type == GENERATORTYPE.Wiener&&
            (g as Wiener).presetName != "" &&
            (g as Wiener).preset &&
            (g as Wiener).pitch.initialValue >= 0 &&
            (g as Wiener).pitch.initialValue <= 127) {
            goodGeneratorCount++;
          }
        }
      });
    });
    if (goodGeneratorCount == 0) {
      setReadyGenerate(false);
      return;
    }
    setReadyGenerate(true);
  }, [fileContents]);

  // when the user selects a new SF file, read that file from the
  // the server and set it in the file contents
  async function handleFileNameChange(event: ChangeEvent<HTMLSelectElement>) {
    const fileName = event.target.value;
    if (fileName != "select a file") {
      try {
        const sf: SoundFont2 = await loadSoundFont(fileName);
        setSoundFont(fileName, sf, setFileContents);
        updatePresets(sf);
        setStatus(`Soundfont file '${fileName}' loaded`);
      } catch (e) {
        setStatus(
          `controlsdisplay: error file reading soundfont file '${fileName}':, ${e}`
        );
      }
    } else {
      // ignore default selection and restore to original selection
      setSFFileName(fileContents.SFFileName);
    }
  }

  function handleRecord() {
    setMode(GENERATIONMODE.record);
    const types: FilePickerAcceptType[] =
      recordFormat == "mp3"
        ? [{ description: "MP3 file", accept: { "audio/mp3": [".mp3"] } }]
        : [{ description: "WAV file", accept: { "audio/wav": [".wav"] } }];
    window.showSaveFilePicker({ types: types }).then((rh) => {
      setRecordHandle(rh);
      // console.log("setting record handle");
    });
  }

  return (
    <>
      <div className="page-control">
        <label htmlFor="SFfile-select">SoundFont File:&nbsp;</label>
        <select
          disabled={playing.current}
          name="SFfile-select"
          id="SFfile-select"
          value={SFFileName}
          onChange={(event) => handleFileNameChange(event)}
        >
          {SFfiles.map((f) => (
            <option key={"SF-" + f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <button
          style={{ marginLeft: "1em" }}
          disabled={!readyGenerate || playing.current}
          onClick={() => handleRecord()}
        >
          Record
        </button>
        <select
          disabled={!readyGenerate || playing.current}
          name="recordformat"
          id="recordformat"
          value={recordFormat}
          style={{ marginLeft: "5px" }}
          onChange={(event) => setRecordFormat(event.target.value)}
        >
          <option key={"r-mp3"} value="mp3">
            mp3
          </option>
          <option key={"r-wav"} value="wav">
            wav
          </option>
        </select>
        <button
          style={{ marginLeft: "1em" }}
          disabled={!readyGenerate || playing.current}
          onClick={() => setMode(GENERATIONMODE.preview)}
        >
          Preview
        </button>
        <button
          style={{ marginLeft: "1em" }}
          hidden={!showStop}
          onClick={() => (playing.current = false)}
        >
          Stop
        </button>
      </div>

      <TimeLineDisplay />
      <Generate
        mode={mode}
        setMode={setMode}
        recordFormat={recordFormat}
        recordHandle={recordHandle}
        generator={null}
      />
      <div
        className="modal-content"
        style={{ display: errors.length != 0 ? "block" : "none" }}
      >
        <div className="modal-header">
          h2 Errors while switching soundfont files
        </div>
        <div className="modal-body">
          {errors.map((e) => (
            <p>{e}</p>
          ))}
        </div>
        <div className="modal-footer">
          <button
            onClick={() => {
              setErrors([]);
            }}
          >
            OK
          </button>
        </div>
      </div>
    </>
  );

  // when the sf file name changes update the presets for any generator that is using one
  function updatePresets(sf: SoundFont2) {
    // locate each generator that is using a preset and rename the preset.
    const errors: string[] = [];
    fileContents.tracks.forEach((t: Track) => {
      t.generators.forEach((g: CMGeneratorType) => {
        let presetSplit: string[] = [];
        if (g.type == GENERATORTYPE.SFPG) {
          presetSplit = (g as SFPG).presetName.split(":");
        }
        if (g.type == GENERATORTYPE.SFRG) {
          presetSplit = (g as SFRG).presetName.split(":");
        }
        if (presetSplit.length == 3) {
          const bank: number = parseInt(presetSplit[0]);
          const channel: number = parseInt(presetSplit[1]);

          // find the present in the new soundfont file with this
          // back and channel number
          let newPreset: Preset | undefined = (sf.presets as Preset[]).find(
            (p) => bank == p.header.bank && channel == p.header.preset
          );
          let newPresetName: string = "";
          if (newPreset) {
            newPresetName = bankPresettoName(newPreset);
          } else {
            errors.push(
              `Track ${t.name}, generator ${g.name} has no preset for bank ${bank}, channel${channel}. Setting first preset`
            );
            newPreset = (sf.presets as Preset[])[0];
            newPresetName = bankPresettoName(newPreset);
          }
          const newG = g.copy();
          if (newG.type != "CMG") {
            (newG as SFPG | SFRG).presetName = newPresetName;
            (newG as SFPG | SFRG).preset = newPreset;
          }
          modifyGenerator(t, newG, g.name, setFileContents);
        }
      });
    });
    setErrors(errors);
  }
}
