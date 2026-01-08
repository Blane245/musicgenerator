// modify the parameters of a control

import {
  Control,
  EFFECTTYPE,
  GeneratorEffect,
  GlobalEffect,
  TrackEffect,
} from "classes/control";
import Track from "classes/track";
import { useCMGContext } from "cmgcontext";
import { ChangeEvent, FormEvent, MouseEvent, useEffect, useState } from "react";
import { addControl, modifyControl } from "utils/cmfiletransactions";
import GeneratorEffectDialog from "./generatoreffectdialog";
import GlobalEffectDialog from "./globaleffectdialog";
import TrackEffectDialog from "./trackeffectdialog";
import ControlDeleteDialog from "./controldeletedialog";

export interface ControlDialogProps {
  control: Control | null;
  tracks: Track[];
}

export default function ControlDialog(props: ControlDialogProps): JSX.Element {
  const { control, tracks } = props;
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const {
    controlNew,
    setStatus,
    setDisplayControlDialog,
    fileContents,
    setFileContents,
    setControlNew,
  } = useCMGContext();
  const [formData, setFormData] = useState<Control>(new Control(0));
  const [oldName, setOldName] = useState<string>("");
  const [showDelete, setShowDelete] = useState<boolean>(false);

  useEffect(() => {
    if (controlNew) {
      setFormData(controlNew);
      setOldName(controlNew.name);
    } else if (control) {
      setFormData(control);
      setOldName(control.name);
    }
  }, [control, controlNew]);
  function handleEffectTypeChange(event: ChangeEvent<HTMLSelectElement>): void {
    event.preventDefault();
    event.stopPropagation();
    setFormData((f) => {
      const newC: Control = f.copy();
      const type: EFFECTTYPE = event.target.value as EFFECTTYPE;
      newC.type = type;
      switch (type) {
        case EFFECTTYPE.Global:
          newC.effect = new GlobalEffect();
          break;
        case EFFECTTYPE.Track:
          newC.effect = new TrackEffect();
          break;
        case EFFECTTYPE.Generator:
          newC.effect = new GeneratorEffect();
          break;
      }
      return newC;
    });
  }

  function validate(): string[] {
    const msgs: string[] = [];

    // check name is nonblank and unique
    if (formData.name == "") msgs.push("Control Name must not be blank");
    const oldIndex: number = !controlNew
      ? fileContents.controls.findIndex((c) => c.name == oldName)
      : -2;
    if (oldIndex == -1)
      throw new Error(`Control Dialog: Control '${oldName}' not found`);
    let foundMatch: boolean = false;
    for (let i = 0; i < fileContents.controls.length && !foundMatch; i++) {
      if (i != oldIndex && fileContents.controls[i].name == formData.name) {
        msgs.push(`Control with name '${formData.name}' already exists`);
        foundMatch = true;
      }
    }

    // validate the effect values
    switch (formData.type) {
      case EFFECTTYPE.None:
        msgs.push("Effect type musst be specified");
        break;
      case EFFECTTYPE.Global:
        msgs.push(...GlobalEffect.validate(formData.effect as GlobalEffect));
        break;
      case EFFECTTYPE.Track:
        msgs.push(...TrackEffect.validate(formData.effect as TrackEffect));
        break;
      case EFFECTTYPE.Global:
        msgs.push(
          ...GeneratorEffect.validate(formData.effect as GeneratorEffect)
        );
        break;
    }
    return msgs;
  }

  function handleSubmit(event: FormEvent<Element>): void {
    event.preventDefault();
    event.stopPropagation();
    const msgs: string[] = validate();
    setErrorMessages(msgs);
    if (msgs.length > 0) return;
    if (controlNew) {
      addControl(formData, setFileContents);
      setControlNew(null);
      setDisplayControlDialog(false);
      setStatus(`Control '${formData.name} added.`);
    } else {
      const index: number = fileContents.controls.findIndex(
        (c) => c.name == oldName
      );
      if (index >= 0) modifyControl(index, formData, setFileContents);
      else throw new Error(`ControlDialog: control '${oldName} not found`);
      setControlNew(null);
      setDisplayControlDialog(false);
      setStatus(`Control '${formData.name} modified.`);
    }
  }

  function handleCancelClick(event: MouseEvent<Element>) {
    event.preventDefault();
    event.stopPropagation();
    setDisplayControlDialog(false);
    setControlNew(null);
  }
  function handleListChange(event: ChangeEvent<HTMLSelectElement>): void {
    const options: HTMLOptionsCollection = event.target.options;
    const newList: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) newList.push(options[i].value);
    }
    setFormData((f: Control) => {
      const newF: Control = f.copy();
      newF.list = newList;
      return newF;
    });
  }

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void {
    event.preventDefault();
    event.stopPropagation();
    setFormData((f: Control) => {
      let eventName: string | null = event.target["name"];
      let eventValue: string =
        event.target["type"] != "checkbox"
          ? event.target["value"]
          : event.target["checked"].toString();
      if (!eventName || !eventValue) return f;
      const newF: Control = f.copy();
      const set: boolean = newF.setAttribute(eventName, eventValue);
      if (!set) {
        switch (newF.type) {
          case EFFECTTYPE.Global:
            (newF.effect as GlobalEffect).setAttribute(eventName, eventValue);
            break;
          case EFFECTTYPE.Track:
            (newF.effect as TrackEffect).setAttribute(eventName, eventValue);
            break;
          case EFFECTTYPE.Generator:
            (newF.effect as GeneratorEffect).setAttribute(
              eventName,
              eventValue
            );
            break;
        }
      }
      return newF;
    });
  }

  function handleDeleteClick(event: MouseEvent<Element>) {
    event.preventDefault();
    event.stopPropagation();
    setShowDelete(true);
  }

  return (
    <>
      <div className="control-content" aria-modal="true">
        <div className="header">
          <span className="close" onClick={handleCancelClick}>
            &times;
          </span>
          <span>&nbsp;{controlNew ? "Add Control" : "Modify Control"}</span>
        </div>
        <div className="body">
          <form name="control_CRUD" id="control_CRUD" onSubmit={handleSubmit}>
            <label>
              Name:&nbsp;
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange(e)}
              />
            </label>
            <label>
              &nbsp;Time
              <input
                name="time"
                type="number"
                min={0}
                step={0.01}
                value={formData.time}
                onChange={(e) => handleChange(e)}
              />
            </label>
            <label>
              &nbsp;Type
              <select
                name="type"
                onChange={handleEffectTypeChange}
                value={formData.type}
              >
                {Object.keys(EFFECTTYPE).map((type: string) => (
                  <option key={`controltype-${type}`} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            {!!(formData.type == EFFECTTYPE.Global) && (
              <GlobalEffectDialog
                effect={formData.effect as GlobalEffect}
                handleChange={handleChange}
              />
            )}
            {!!(formData.type == EFFECTTYPE.Track) && (
              <TrackEffectDialog
                effect={formData.effect as TrackEffect}
                handleChange={handleChange}
                list={formData.list}
                handleListChange={handleListChange}
                tracks={tracks}
              />
            )}
            {!!(formData.type == EFFECTTYPE.Generator) && (
              <GeneratorEffectDialog
                effect={formData.effect as GeneratorEffect}
                handleChange={handleChange}
                list={formData.list}
                handleListChange={handleListChange}
                tracks={tracks}
              />
            )}
            <hr />
            <input type="submit" value={controlNew ? "Add" : "Modify"} />
          </form>
          <div className="footer">
            <button onClick={handleDeleteClick}>Delete</button>
            <button onClick={handleCancelClick}>Cancel</button>
            {!!showDelete && (
              <ControlDeleteDialog
                controlName={formData.name}
                setDialogVisible={setDisplayControlDialog}
              />
            )}
            <br />
            {errorMessages.map((m, i) => (
              <h3 style={{ color: "white" }} key={`error-${i}`}>
                {m}
              </h3>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
