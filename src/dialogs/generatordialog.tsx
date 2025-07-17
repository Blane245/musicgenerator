// provides CRUD for all types of generators
import { ChangeEvent, FormEvent, MouseEvent, useEffect, useState } from "react";
import { SoundFont2 } from "../soundfont2";
import { Algorithmic, AudioFile, Silent } from "../classes/generators";
import Track from "../classes/track";
import { useCMGContext } from "../cmgcontext";
import { SoundFontPool } from "../sfcomponents/soundfontpool";
import { Preset } from "../sfcomponents/types";
import { bankPresettoName, precision } from "../sfcomponents/util";
import { GENERATIONMODE, GeneratorType, GENERATORTYPE } from "../types";
import {
  addGenerator,
  // deleteGenerator,
  modifyGenerator,
} from "../utils/cmfiletransactions";
import { getGeneratorUID } from "../utils/getgeneratoruid";
import GeneratorTypeForm from "./generatortypeform";
import Preview from "../generation/preview";
import ReadyGenerate from "../generation/readygenerate";
import { buildSources } from "../generation/buildsources";

// The icon starts at the generator's start time and ends at the generators endtime
export interface GeneratorDialogProps {
  track: Track;
  generatorType: string;
  generatorIndex: number;
  setVisible: Function;
}

export default function GeneratorDialog(props: GeneratorDialogProps) {
  const { track, generatorType, generatorIndex, setVisible } = props;
  type SFDataType = {
    soundFont: SoundFont2 | undefined;
    presets: Preset[];
    preset: Preset | undefined;
    presetName: string;
  };

  const {
    fileContents,
    setFileContents,
    setStatus,
    timeInterval,
    playing,
    setTimeProgress,
    setGeneratorsPlaying,
    setSignalLevels,
    SFFileLocation,
    SFLocalURI,
    SFServerURI,
  } = useCMGContext();
  const [oldName, setOldName] = useState<string>("");
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [formData, setFormData] = useState<GeneratorType>(new Silent(0));
  const [soundFontData, setSoundFontData] = useState<SFDataType>({
    soundFont: undefined,
    presets: [],
    preset: undefined,
    presetName: "",
  });
  const [audioFileData, setAudioFileData] = useState<AudioFile>(
    new AudioFile(0)
  );
  const [locked, setLocked] = useState<boolean>(false);
  const [isPreview, setIsPreview] = useState<boolean>(false);

  useEffect(() => {
    // either get the generator from the track or build a new one if being added
    if (generatorIndex < 0) {
      // create a generator with a unique name
      let next = getGeneratorUID(fileContents.tracks);
      switch (generatorType) {
        case GENERATORTYPE.Silent:
          {
            const g = new Silent(next);
            setFormData(g);
            setOldName(g.name);
          }
          break;
        case GENERATORTYPE.Algorithmic:
          {
            const g = new Algorithmic(next);
            setFormData(g);
            setOldName(g.name);
          }
          break;
        case GENERATORTYPE.AudioFile:
          {
            const g = new AudioFile(next);
            setFormData(g);
            setOldName(g.name);
          }
          break;
      }
    } else {
      setFormData(track.generators[generatorIndex]);
      if (track.generators[generatorIndex].type == GENERATORTYPE.Algorithmic) {
        const g = track.generators[generatorIndex] as Algorithmic;
        setSoundFontData({
          soundFont: g.soundFont,
          presets: g.presets,
          preset: g.preset,
          presetName: g.presetName,
        });
      }
      setOldName(track.generators[generatorIndex].name);
    }
    setErrorMessages([]);
  }, [generatorIndex]);

  // when the soundfont data has been loaded, update the algorithmic generator form
  useEffect(() => {
    setFormData((prev: GeneratorType) => {
      const n: Algorithmic = (prev as Algorithmic).copy();
      n.soundFont = soundFontData.soundFont;
      n.preset = soundFontData.preset;
      n.presetName = soundFontData.presetName;
      n.presets = soundFontData.presets;
      setLocked(false);
      return n;
    });
  }, [soundFontData]);

  // when the audio file is loaded, update the form to reveal its properties
  useEffect(() => {
    setFormData((prev: GeneratorType) => {
      const n: AudioFile = (prev as AudioFile).copy();
      return n;
    });
    setLocked(false);
  }, [audioFileData]);

  // when playing stops take down the stop preview popup
  useEffect(() => {
    if (!playing.current) setIsPreview(false);
  }, [playing.current]);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void {
    // update the form with the new attribute value
    setFormData((prev: GeneratorType) => {
      const eventName: string | null = event.target["name"];
      const eventValue: string =
        event.target["type"] != "checkbox"
          ? event.target["value"]
          : event.target.checked.toString();

      if (!eventName || !eventValue) return prev;

      // select the proper generator type
      switch (formData.type) {
        case GENERATORTYPE.Silent: {
          const newFormData: Silent = (prev as Silent).copy();
          newFormData.setAttribute(eventName, eventValue);
          return newFormData;
        }
        case GENERATORTYPE.Algorithmic: {
          const newFormData: Algorithmic = (prev as Algorithmic).copy();
          newFormData.setAttribute(eventName, eventValue);

          // when the soundfont filename changes, load the new soundfont and presets
          if (eventName == "soundfontfile") {
            loadSoundFontandUpdate(eventValue);
          }
          return newFormData;
        }
        case GENERATORTYPE.AudioFile: {
          const newFormData: AudioFile = (prev as AudioFile).copy();
          newFormData.setAttribute(eventName, eventValue);
          // when the filename is given, the stop time will been to update
          if (newFormData.fileName != "") {
            setAudioFileData(newFormData);
          }
          return newFormData;
        }
        default:
          console.log(
            `generator dialog: improper generator type ${formData.type}`
          );
          return prev as Silent;
      }
    });
  }

  function validate(formData: GeneratorType): string[] {
    const msgs: string[] = [];
    switch (formData.type) {
      case GENERATORTYPE.Silent:
        {
          const newMessages = Silent.validate(
            formData as Silent,
            fileContents,
            oldName
          );
          msgs.push(...newMessages);
          setErrorMessages(msgs);
        }
        break;
      case GENERATORTYPE.Algorithmic:
        {
          const newMessages = Algorithmic.validate(
            formData as Algorithmic,
            fileContents,
            oldName
          );
          msgs.push(...newMessages);
          setErrorMessages(msgs);
        }
        break;
      case GENERATORTYPE.AudioFile:
        {
          const newMessages = AudioFile.validate(
            formData as AudioFile,
            fileContents,
            oldName
          );
          msgs.push(...newMessages);
          setErrorMessages(msgs);
        }
        break;
      default: {
        msgs.push(`Invalid generator type ${formData.type}`);
        setErrorMessages(msgs);
      }
    }
    return msgs;
  }
  function handleSubmit(event: FormEvent<Element>): void {
    event.preventDefault();

    const msgs: string[] = validate(formData);
    if (msgs.length == 0) {
      if (generatorIndex < 0) {
        // add a new generator to the current track
        addGenerator(track, formData, setFileContents);
        setStatus(
          `Generator '${formData.name}' added to track '${track.name}'`
        );
      } else {
        // this is a modify. change the generator on the active track
        modifyGenerator(track, formData, oldName, setFileContents);
        setStatus(
          `Generator '${formData.name}' modified on track '${track.name}'`
        );
      }
      setVisible(false);
    }
  }

  function handlePreview() {
    const msgs: string[] = validate(formData);
    if (msgs.length != 0) return;
    const {
      AlgorithmicGenerators,
      AudioFileGenerators,
      SilentGenerators,
      playbackLength,
      offsetTime,
      error,
    } = ReadyGenerate({
      mode: GENERATIONMODE.solo,
      generator: formData,
      fileContents,
      timeInterval,
    });
    if (error != "") {
      setStatus(`Error occurred while getting ready to preview: ${error}`);
      return;
    }
    const { sources: builtSourceData, error: buildError } = buildSources({
      AlgorithmicGenerators,
      AudioFileGenerators,
      SilentGenerators,
    });
    if (buildError != "") {
      setStatus(
        `Error occurred while building source to preview: ${buildError}`
      );
      return;
    }
    playing.current = true;
    setIsPreview(true);
    Preview({
      fileContents,
      playbackLength,
      offsetTime,
      sourceData: builtSourceData,
      setMode: () => {},
      playing,
      setTimeProgress,
      setGeneratorsPlaying,
      setStatus,
      setSignalLevels,
    });
  }

  function handleCancelClick(event: MouseEvent<Element>) {
    event.preventDefault();
    setVisible(false);
    setStatus("");
  }

  return (
    <>
      <fieldset disabled={playing.current || locked}>
        <div
          className="generator-content"
          aria-modal="true"
          style={{ display: "block" }}
        >
          <div className="generator-header">
            <span className="close" onClick={handleCancelClick}>
              &times;
            </span>
            <span>
              {generatorIndex < 0
                ? "  Add " + formData.type + " Generator"
                : "  Generator: " + formData.name}
            </span>
          </div>
          <div className="generator-body">
            <form
              name="generator_CRUD"
              id="generator_CRUD"
              onSubmit={handleSubmit}
            >
              <label>
                Name:&nbsp;
                <input
                  name="name"
                  type="text"
                  onChange={handleChange}
                  value={formData.name}
                />
              </label>
              <label>
                &nbsp;Start Time:&nbsp;
                <input
                  name="startTime"
                  type="number"
                  min={0}
                  step={0.1}
                  onChange={handleChange}
                  value={precision(formData.startTime, 1)}
                />
                <span> (sec) </span>
              </label>
              <label>
                &nbsp;Stop Time:&nbsp;
                <input
                  name="stopTime"
                  type="number"
                  min={0}
                  step={0.1}
                  onChange={handleChange}
                  value={precision(formData.stopTime, 1)}
                />
                <span> (sec) </span>
              </label>
              <br />
              <GeneratorTypeForm
                formData={formData}
                handleChange={handleChange}
              />
              <hr />
              <input
                type="submit"
                value={generatorIndex < 0 ? "Add" : "Modify"}
              />
            </form>
          </div>
          <div className="generator-footer">
            <button
              type="button"
              id={"generator-preview:" + formData.name}
              onClick={handlePreview}
            >
              Preview
            </button>
            <button
              id={"generator-update:" + formData.name}
              onClick={handleCancelClick}
            >
              Cancel
            </button>
            {errorMessages.map((m, i) => (
              <h3 color="red" key={`error-${i}`}>
                {m}
              </h3>
            ))}
          </div>
        </div>
      </fieldset>
      <div
        className="modal-content"
        style={{ display: isPreview ? "block" : "none" }}
      >
        <div className="modal-header">
          <span className="close">&times;</span>
          Preview In Progress
        </div>
        <div className="modal-body">
          <p>Click Stop to Exit Preview</p>
        </div>
        <div className="modal-footer">
          <button
            onClick={() => {
              setIsPreview(false);
              playing.current = false;
            }}
          >
            Stop
          </button>
        </div>
      </div>
    </>
  );

  function loadSoundFontandUpdate(fileName: string) {
    setLocked(true);
    // load the soundfont file and set the presets
    async function LoadFile(fileName: string) {
      const { soundFont } = await SoundFontPool(
        fileName,
        SFFileLocation,
        SFLocalURI,
        SFServerURI
      );
      setSoundFontData(() => {
        const presets: Preset[] = (soundFont.presets as Preset[]).sort(
          (a, b) => {
            if (a.header.bank < b.header.bank) return -1;
            if (a.header.bank > b.header.bank) return 1;
            return a.header.preset - b.header.preset;
          }
        );
        const preset: Preset = presets[0] as Preset;
        const presetName: string = bankPresettoName(preset);
        const newSoundFontData: SFDataType = {
          soundFont: soundFont,
          presets: presets,
          preset: preset,
          presetName: presetName,
        };
        return newSoundFontData;
      });
    }
    LoadFile(fileName);
  }
}
