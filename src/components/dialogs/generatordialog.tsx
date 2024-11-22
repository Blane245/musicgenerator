// provides CRUD for all types of generators
import { ChangeEvent, FormEvent, MouseEvent, useEffect, useState } from "react";
import { Preset } from "../../types/soundfonttypes";
import CMG from "../../classes/cmg";
import Noise from "../../classes/noise";
import SFPG from "../../classes/sfpg";
import SFRG from "../../classes/sfrg";
import Track from "../../classes/track";
import { useCMGContext } from "../../contexts/cmgcontext";
import { CMGeneratorType, GENERATORTYPE } from "../../types/types";
import {
  addGenerator,
  deleteGenerator,
  modifyGenerator,
} from "../../utils/cmfiletransactions";
import GeneratorTypeForm from "./generatortypeform";
import { validateNoiseValues } from "./noisedialog";
import { validateSFPGValues } from "./sfpgdialog";
import { validateSFRGValues } from "./sfrgdialog";
import { bankPresettoName, getGeneratorUID } from "../../utils/util";

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
  const {
    track,
    generatorIndex,
    setGeneratorIndex,
    closeTrackGenerator,
    open,
    setOpen,
  } = props;
  const { fileContents, setFileContents, presets, setStatus } = useCMGContext();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [oldName, setOldName] = useState<string>("");
  const [generatorName, setGeneratorName] = useState<string>("");
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [formData, setFormData] = useState<CMG | SFPG | SFRG | Noise>(
    new CMG(0)
  );
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

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void {
    // update the form with the new attribute value
    setFormData((prev: CMGeneratorType) => {
      const eventName: string | null = event.target["name"];
      const eventValue: string | null = event.target["value"];
      
      // this code is for reverb implementation
      // const eventType: string | null = event.target["type"].valueOf();
      // const eventValue: string | null =
      //   eventType == "checkbox"
      //     ? event.target.getAttribute("checked")?.value
      //     : event.target["value"];

      if (!eventName || !eventValue) return prev;

      // select the proper generator type
      switch (formData.type) {
        case GENERATORTYPE.CMG: {
          const newFormData: CMG = (prev as CMG).copy();
          newFormData.setAttribute(eventName, eventValue);
          return newFormData;
        }
        case GENERATORTYPE.SFPG: {
          const newFormData: SFPG = (prev as SFPG).copy();
          newFormData.setAttribute(eventName, eventValue);
          return newFormData;
        }
        case GENERATORTYPE.SFRG: {
          const newFormData: SFRG = (prev as SFRG).copy();
          newFormData.setAttribute(eventName, eventValue);
          return newFormData;
        }
        case GENERATORTYPE.Noise: {
          const newFormData: Noise = (prev as Noise).copy();
          newFormData.setAttribute(eventName, eventValue);
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

    // switching generator type - copy the CMG values and default the preset name
    setFormData((prev: CMGeneratorType) => {
      switch (newType) {
        case GENERATORTYPE.CMG: {
          const newF = new CMG(0);
          newF.name = prev.name;
          newF.startTime = prev.startTime;
          newF.stopTime = prev.stopTime;
          newF.mute = prev.mute;
          newF.solo = prev.solo;
          newF.position = prev.position;
          newF.reverb = prev.reverb.copy();
          return newF;
        }
        case GENERATORTYPE.SFPG: {
          const newF = new SFPG(0);
          newF.name = prev.name;
          newF.startTime = prev.startTime;
          newF.stopTime = prev.stopTime;
          newF.mute = prev.mute;
          newF.solo = prev.solo;
          newF.position = prev.position;
          newF.reverb = prev.reverb.copy();
          if (presets.length > 0) {
            newF.preset = presets[0];
            newF.presetName = bankPresettoName(newF.preset);
          }
          return newF;
        }
        case GENERATORTYPE.SFRG: {
          const newF = new SFRG(0);
          newF.name = prev.name;
          newF.startTime = prev.startTime;
          newF.stopTime = prev.stopTime;
          newF.mute = prev.mute;
          newF.solo = prev.solo;
          newF.position = prev.position;
          newF.reverb = prev.reverb.copy();
          if (presets.length > 0) {
            newF.preset = presets[0];
            newF.presetName = bankPresettoName(newF.preset);
          }
          return newF;
        }
        case GENERATORTYPE.Noise: {
          const newF = new Noise(0);
          newF.name = prev.name;
          newF.startTime = prev.startTime;
          newF.stopTime = prev.stopTime;
          newF.mute = prev.mute;
          newF.solo = prev.solo;
          newF.position = prev.position;
          newF.reverb = prev.reverb.copy();
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
          const newMessages = validateCMGValues(formData as CMG);
          msgs.push(...newMessages);
          if (msgs.length > 0) {
            setErrorMessages(msgs);
            return;
          }
        }
        break;
      case GENERATORTYPE.SFPG:
        {
          let newMessages = validateCMGValues(formData as CMG);
          msgs.push(...newMessages);
          newMessages = validateSFPGValues(formData as SFPG);
          msgs.push(...newMessages);
          if (msgs.length > 0) {
            setErrorMessages(msgs);
            return;
          }
          const pn: string = (formData as SFPG).presetName.split(":")[2];
          (formData as SFPG).preset = presets.find(
            (p: Preset) => pn == p.header.name
          );
          if (!(formData as SFPG).preset)
            console.log(`generator dialog: can't find preset nammed ${pn}`);
        }
        break;
      case GENERATORTYPE.SFRG:
        {
          let newMessages = validateCMGValues(formData as CMG);
          msgs.push(...newMessages);
          newMessages = validateSFRGValues(formData as SFRG);
          msgs.push(...newMessages);
          if (msgs.length > 0) {
            setErrorMessages(msgs);
            return;
          }
          const pn: string = (formData as SFRG).presetName.split(":")[2];
          (formData as SFPG).preset = presets.find(
            (p: Preset) => pn == p.header.name
          );
          if (!(formData as SFPG).preset)
            console.log(`generator dialog: can't find preset nammed ${pn}`);
        }
        break;
      case GENERATORTYPE.Noise:
        {
          let newMessages = validateCMGValues(formData as CMG);
          msgs.push(...newMessages);
          newMessages = validateNoiseValues(formData as Noise);
          msgs.push(...newMessages);
          if (msgs.length > 0) {
            setErrorMessages(msgs);
            return;
          }
        }
        break;
      default: {
        msgs.push(`Invalid generator type ${formData.type}`);
        setErrorMessages(msgs);
        return;
      }
    }

    if (generatorIndex < 0) {
      // add a new generator to the current track
      addGenerator(track, formData, setFileContents);
      setStatus(`Generator '${formData.name}' added to track '${track.name}'`);
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
    return;
  }

  function validateCMGValues(values: CMG): string[] {
    const result: string[] = [];
    if (values.name == "") result.push("Name must not be blank");
    else {
      if (values.name != oldName) {
        for (let i = 0; i < fileContents.tracks.length; i++) {
          const t = fileContents.tracks[i];
          for (let j = 0; j < t.generators.length; j++) {
            if (t.generators[j].name == values.name) {
              result.push("A generator with that name already exists");
            }
          }
        }
      }
      if (values.startTime < 0 || values.stopTime <= values.startTime)
        result.push(
          "All times must be greater than zero and stop must be greater than start"
        );
    }
    return result;
  }

  function handleCancelClick(event: MouseEvent<Element>) {
    event.preventDefault();
    setShowModal(false);
    setOpen(false);
    closeTrackGenerator();
    setStatus("");
  }

  function handleDeleteClick(event: MouseEvent<Element>) {
    event.preventDefault();
    console.log(event.currentTarget.id);
    const gName = event.currentTarget.id.split(":")[1];
    setGeneratorName(gName);
    setDeleteModal(true);
    setStatus(``);
  }

  function handleDeleteOK(event: MouseEvent<Element>): void {
    event.preventDefault();
    const gName = event.currentTarget.id.split(":")[1];
    const index = track.generators.findIndex((g) => g.name == gName);
    if (index < 0) return;

    deleteGenerator(track, gName, setFileContents);
    setDeleteModal(false);
    setGeneratorIndex(-1);
    closeTrackGenerator();
    setStatus(`Generator '${gName}' deleted from track '${track.name}'`);
  }

  function handleDeleteCancel() {
    setDeleteModal(false);
    setStatus("");
  }
  return (
    <>
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
              <h2>
                {generatorIndex < 0
                  ? "New Generator"
                  : "Generator: " + formData.name}
              </h2>
            </div>
            <div className="generator-body">
              <form
                name="generator_CRUD"
                id="generator_CRUD"
                onSubmit={handleSubmit}
              >
                <label htmlFor="name">Name: </label>
                <input
                  name="name"
                  type="text"
                  onChange={handleChange}
                  value={formData.name}
                />
                <br />
                <label htmlFor="startTime">Start Time: </label>
                <input
                  name="startTime"
                  type="number"
                  min={0}
                  step={0.1}
                  onChange={handleChange}
                  value={formData.startTime}
                />
                <span> (sec) </span>
                <label htmlFor="stopTime">Stop Time: </label>
                <input
                  name="stopTime"
                  type="number"
                  min={0}
                  step={0.1}
                  onChange={handleChange}
                  value={formData.stopTime}
                />
                <span> (sec) </span>
                <label htmlFor="type">Type: </label>
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
                <br />
                <div hidden={true}>
                  <label>
                    Reverberator Enabled:&nbsp;
                    <input
                      name="instreverb.enabled"
                      checked={formData.reverb.enabled}
                      onChange={handleChange}
                      type="checkbox"
                    />
                  </label>
                  {/* <label>
                  &nbsp;Attack:&nbsp;
                  <input
                    name="instreverb.attack"
                    value={formData.reverb.attack}
                    onChange={handleChange}
                    type="number"
                    min={0.001}
                    max={10}
                    step={0.001}
                  />
                  <span>&nbsp;(sec)</span>
                </label>
                <label>
                  &nbsp;Decay:&nbsp;
                  <input
                    name="instreverb.decay"
                    value={formData.reverb.decay}
                    onChange={handleChange}
                    type="number"
                    min={0.001}
                    max={10}
                    step={0.001}
                  />
                  <span>&nbsp;(sec)</span>
                </label>
                <label>
                  &nbsp;Release:&nbsp;
                  <input
                    name="instreverb.release"
                    value={formData.reverb.release}
                    onChange={handleChange}
                    type="number"
                    min={0.001}
                    max={10}
                    step={0.001}
                  />
                  <span>&nbsp;(sec)</span>
                </label> */}
                  <label>
                    &nbsp;Reverb Time:&nbsp;
                    <input
                      name="instreverb.reverbTime"
                      value={formData.reverb.reverbTime}
                      onChange={handleChange}
                      type="number"
                      min={0.001}
                      max={10}
                      step={0.001}
                    />
                    <span>&nbsp;(sec)</span>
                  </label>
                  <hr />
                </div>
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
                hidden={generatorIndex < 0}
                id={"generator-delete:" + formData.name}
                onClick={handleDeleteClick}
              >
                Delete
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
          <div
            style={{ display: deleteModal ? "block" : "none" }}
            className="modal-content"
          >
            <div className="modal-header">
              <span className="close">&times;</span>
              <h2>Confirm deletion of generator '{generatorName}'</h2>
            </div>
            <div className="modal-body">
              <p>Select OK to delete generator or Cancel to abort deletion.</p>
            </div>
            <div className="modal-footer">
              <button
                id={"track-delete:" + generatorName}
                onClick={handleDeleteOK}
              >
                OK
              </button>
              <button onClick={handleDeleteCancel}>Cancel</button>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
