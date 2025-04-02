// provides CRUD for all types of generators
import { ChangeEvent, FormEvent, MouseEvent, useEffect, useState } from "react";
import { SoundFont2 } from "soundfont2";
import { Algorithmic, AudioFile, CMG } from "../classes/generators";
import Track from "../classes/track";
import { useCMGContext } from "../cmgcontext";
import { SoundFontPool } from "../sfcomponents/soundfontpool";
import { Preset } from "../sfcomponents/types";
import { bankPresettoName, precision } from "../sfcomponents/util";
import { GeneratorType, GENERATORTYPE } from "../types";
import {
  addGenerator,
  // deleteGenerator,
  modifyGenerator,
} from "../utils/cmfiletransactions";
import { getGeneratorUID } from "../utils/getgeneratoruid";
import GeneratorTypeForm from "./generatortypeform";

// The icon starts at the generator's start time and ends at the generators endtime
export interface GeneratorDialogProps {
  track: Track;
  generatorIndex: number;
  setGeneratorIndex: Function;
  closeTrackGenerator: Function;
  open: boolean;
  setOpen: Function;
}

export default function GeneratorDialog(props: GeneratorDialogProps) {
  const { track, generatorIndex, closeTrackGenerator, open, setOpen } = props;
  type SFDataType = {
    soundFont: SoundFont2 | undefined;
    presets: Preset[];
    preset: Preset | undefined;
    presetName: string;
  };

  const { fileContents, setFileContents, setStatus } = useCMGContext();
  const [showModal, setShowModal] = useState<boolean>(false);
  // const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [oldName, setOldName] = useState<string>("");
  // const [generatorName, setGeneratorName] = useState<string>("");
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [formData, setFormData] = useState<GeneratorType>(new CMG(0));
  const [soundFontData, setSoundFontData] = useState<SFDataType>({
    soundFont: undefined,
    presets: [],
    preset: undefined,
    presetName: "",
  });
  const [audioFileData] = useState<AudioFile>(
    new AudioFile(0)
  );
  const [locked, setLocked] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      // either get the generator from the track or build a new one if being added
      if (generatorIndex < 0) {
        // create a generator with a unique name
        let next = getGeneratorUID(fileContents.tracks);
        const g = new CMG(next);
        setFormData(g);
        setOldName(g.name);
      } else {
        setFormData(track.generators[generatorIndex]);
        setOldName(track.generators[generatorIndex].name);
      }
      setShowModal(true);
    }
    setErrorMessages([]);
  }, [open]);

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

  useEffect(() => {
    setFormData((prev: GeneratorType) => {
      const n: AudioFile = (prev as AudioFile).copy();
      return n;
    });
    setLocked(false);
  }, [audioFileData]);

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
        case GENERATORTYPE.CMG: {
          const newFormData: CMG = (prev as CMG).copy();
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
          // if (eventName == "filename") {
          //   loadAudioFileandUpdate();
          // }
          return newFormData;
        }
        default:
          console.log(
            `generator dialog: improper generator type ${formData.type}`
          );
          return prev as CMG;
      }
    });
  }

  // copies the basic data and change the type of the form data
  function handleTypeChange(event: ChangeEvent<HTMLSelectElement>): void {
    const newType: GENERATORTYPE = event.target["value"] as GENERATORTYPE;

    // switching generator type - copy the CMG values
    setFormData((prev: GeneratorType) => {
      switch (newType) {
        case GENERATORTYPE.CMG: {
          const newF = new CMG(0);
          newF.name = prev.name;
          newF.startTime = prev.startTime;
          newF.stopTime = prev.startTime;
          newF.mute = prev.mute;
          newF.position = prev.position;
          return newF;
        }
        case GENERATORTYPE.Algorithmic: {
          const newF = new Algorithmic(0);
          newF.name = prev.name;
          newF.startTime = prev.startTime;
          newF.stopTime = prev.startTime;
          newF.mute = prev.mute;
          newF.position = prev.position;
          return newF;
        }
        case GENERATORTYPE.AudioFile: {
          const newF = new AudioFile(0);
          newF.name = prev.name;
          newF.startTime = prev.startTime;
          newF.stopTime = prev.startTime;
          newF.mute = prev.mute;
          newF.position = prev.position;
          return newF;
        }
        default:
          return prev;
      }
    });
  }

  function handleSubmit(event: FormEvent<Element>): void {
    event.preventDefault();
    const msgs: string[] = [];
    switch (formData.type) {
      case GENERATORTYPE.CMG:
        {
          const newMessages = CMG.validate(
            formData as CMG,
            fileContents,
            oldName
          );
          msgs.push(...newMessages);
          setErrorMessages(msgs);
          if (msgs.length > 0) return;
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
          if (msgs.length > 0) return;
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
          if (msgs.length > 0) return;
        }
        break;
      default: {
        msgs.push(`Invalid generator type ${formData.type}`);
        setErrorMessages(msgs);
        return;
      }
    }

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

      setShowModal(false);
      setOpen(false);
      closeTrackGenerator();
    }
  }

  function handleCancelClick(event: MouseEvent<Element>) {
    event.preventDefault();
    setShowModal(false);
    setOpen(false);
    closeTrackGenerator();
    setStatus("");
  }

  return (
    <fieldset disabled={locked}>
      {open ? (
        <>
          <div
            aria-modal="true"
            style={{ display: showModal ? "block" : "none" }}
            className="generator-content"
          >
            <div className="generator-header">
              <span className="close" onClick={handleCancelClick}>
                &times;
              </span>
              <span>
                {generatorIndex < 0
                  ? "  New Generator"
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
                  &nbsp;Type:&nbsp;
                  <select
                    name="type"
                    onChange={handleTypeChange}
                    value={formData.type}
                  >
                    {Object.keys(GENERATORTYPE).map((t, i) => {
                      if (!parseInt(t) && t != "0")
                        return (
                          <option key={`GT-${i}`} value={t}>
                            {t}
                          </option>
                        );
                    })}
                  </select>
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
              {/* <button
                hidden={generatorIndex < 0}
                id={"generator-delete:" + formData.name}
                onClick={handleDeleteClick}
              >
                Delete
              </button> */}
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
        </>
      ) : null}
    </fieldset>
  );

  function loadSoundFontandUpdate(fileName: string) {
    setLocked(true);
    // load the soundfont file and set the presets
    async function LoadFile(fileName: string) {
      const { soundFont } = await SoundFontPool(fileName);
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

  // function loadAudioFileandUpdate() {
  //   // load the data from the file selected by the user
  //   if (!filePicker.current) {
  //     filePicker.current = true;
  //     setLocked(true);
  //     try {
  //       window
  //         .showOpenFilePicker({
  //           multiple: false,
  //           types: [
  //             {
  //               description: "Audio Files",
  //               accept: { "audio/*": [".mp3", ".wav"] },
  //             },
  //           ],
  //         })
  //         .then((rhs: FileSystemFileHandle[]) => {
  //           rhs[0].getFile().then((file: File) => {
  //             file.arrayBuffer().then((buffer: ArrayBuffer) => {
  //               const context: AudioContext = new AudioContext();
  //               context.decodeAudioData(buffer).then((audio: AudioBuffer) => {
  //                 setAudioFileData((prev: AudioFile) => {
  //                   const n = prev.copy();
  //                   n.fileName = file.name;
  //                   n.sampleRate = audio.sampleRate;
  //                   n.duration = precision(audio.duration, 1);
  //                   n.stopTime = n.startTime + n.duration;
  //                   n.samples = [];
  //                   for (let i = 0; i < audio.numberOfChannels; i++) {
  //                     const channelData: Float32Array = audio.getChannelData(i);
  //                     n.samples.push(channelData);
  //                   }
  //                   return n;
  //                 });
  //                 filePicker.current = false;
  //               });
  //             });
  //           });
  //         });
  //     } catch (e) {
  //     } finally {
  //       filePicker.current = false;
  //     }
  //   }
  // }
}
