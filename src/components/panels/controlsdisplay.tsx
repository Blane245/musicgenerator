import { ChangeEvent, useEffect, useState } from "react";
import { SoundFont2 } from "soundfont2";
import SFPG from "../../classes/sfpg";
import SFRG from "../../classes/sfrg";
import Track from "../../classes/track";
import Generate from "../../components/generation/generate";
import { useCMGContext } from "../../contexts/cmgcontext";
import { Preset } from "../../types/soundfonttypes";
import {
  CMGeneratorType,
  GENERATIONMODE,
  GENERATORTYPE,
} from "../../types/types";
import { modifyGenerator, setSoundFont } from "../../utils/cmfiletransactions";
import fetchData from "../../utils/fetchdata";
import { bankPresettoName } from "../../utils/util";
import TimeLineDisplay from "./timelinedisplay";
import { loadSoundFont } from "../../utils/loadsoundfont";

// display of the CGM file, its contents, and controls
// main controls
// SF File, Tempo, time Signature, Snap, Snap type, play buttons (reverse, fast forward, start, pause)
// time line

export default function ControlsDisplay() {
  const { fileContents, setFileContents, setStatus, playing } = useCMGContext();

  const [SFfiles, setSFFiles] = useState<string[]>([]);
  const [SFFileName, setSFFileName] = useState<string>("");
  const [readyGenerate, setReadyGenerate] = useState<boolean>(true);
  const [mode, setMode] = useState<GENERATIONMODE>(GENERATIONMODE.idle);
  const [showStop, setShowStop] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  // load the soundfont file list from the server at start up
  useEffect(() => {
    // const SFFiles = import.meta.glob("/src/soundfonts/*.(SF@|sf2)");
    // const fileList: string[] = Object.keys(SFFiles);
    // fileList.unshift("select a file"); // add select a file to the start of the list
    // setSFFiles(fileList);
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

  // disable inputs when playing
  useEffect(() => {
    if (playing.current) {
      setShowStop(playing.current.on);
    }
  }, [playing.current?.on]);

  // update the SF file name when the file contents file name changes
  useEffect(() => {
    if (fileContents) setSFFileName(fileContents.SFFileName);
  }, [fileContents.SFFileName]);

  // control the record and preview buttons
  // only enabled when a soundfont file is defined and all generators have presets and midi numbers assigned
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
            (g as SFPG).midi <= 255
          ) {
            goodGeneratorCount++;
          } else if (
            g.type == GENERATORTYPE.SFRG &&
            (g as SFRG).presetName != "" &&
            (g as SFRG).preset &&
            (g as SFRG).midiT.startValue >= 0 &&
            (g as SFRG).midiT.startValue <= 255
          ) {
            goodGeneratorCount++;
          } else if (g.type == GENERATORTYPE.Noise) goodGeneratorCount++;
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
          `controlsdisplay: error file reading soundfont file '${fileName}'`
        );
      }
    }
  }
  // load the SF when one is selected

  // async function handleFileNameChange(event: ChangeEvent<HTMLSelectElement>) {
  //   const fileName: string = event.target.value;
  //   if (
  //     fileName !== "" &&
  //     fileName !== "select a file" &&
  //     fileName != fileContents.SFFileName
  //   ) {
  //     setSFFileName(fileName);
  //     const sf = await loadSoundFont(fileName);
  //     setSoundFont(fileName, sf, setFileContents);

  //     // we need to update the preset names if any generators are using presets
  //     // they will change to the ones that match teh bak and channel number of
  //     // the old file. If there is no match, first preset
  //     updatePresets(sf);
  //     setStatus(`Soundfont file '${fileName}' loaded`);
  //   }
  // }

  return (
    <>
      <div className="page-control">
        <label htmlFor="SFfile-select">SoundFont File:</label>
        <select
          disabled={playing.current?.on}
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
          disabled={!readyGenerate || playing.current?.on}
          onClick={() => setMode(GENERATIONMODE.record)}
        >
          Record
        </button>
        <button
          disabled={!readyGenerate || playing.current?.on}
          onClick={() => setMode(GENERATIONMODE.preview)}
        >
          Preview
        </button>
        <button
          hidden={!showStop}
          onClick={() => {
            if (playing.current) playing.current.on = false;
          }}
        >
          Stop
        </button>
      </div>

      <TimeLineDisplay />
      <Generate mode={mode} setMode={setMode} generator={null} />
      {/* error popup */}
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
