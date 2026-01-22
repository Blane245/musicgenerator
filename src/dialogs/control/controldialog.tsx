// modify the parameters of a control

import Control, { ControlType } from "classes/control";
import {
  CONTROLTYPE,
  GeneratorControl,
  GlobalControl,
  TrackControl,
} from "classes/control";
import Track from "classes/track";
import { useCMGContext } from "cmgcontext";
import { ChangeEvent, FormEvent, MouseEvent, useEffect, useState } from "react";
import { addControl, modifyControl } from "utils/cmfiletransactions";
import ControlDeleteDialog from "./controldeletedialog";
import GeneratorControlDialog from "./generatocontroldialog";
import GlobalControlDialog from "./globalcontroldialog";
import TrackControlDialog from "./trackcontroldialog";
import { GeneratorType } from "types";
import { getControlUID } from "utils/getcontroluid";

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
    setFormData((prev: ControlType) => {
      let newC: Control = prev.copy();
      const type: CONTROLTYPE = event.target.value as CONTROLTYPE;
      newC.type = type;
      switch (type) {
        case CONTROLTYPE.Global:
          newC = new GlobalControl(0);
          break;
        case CONTROLTYPE.Track:
          newC = new TrackControl(0);
          break;
        case CONTROLTYPE.Generator:
          newC = new GeneratorControl(0);
          break;
        default:
          return prev;
      }
      newC.name = prev.name;
      return newC;
    });
  }

  function validate(): string[] {
    switch (formData.type) {
      case CONTROLTYPE.Global:
        return GlobalControl.validate(
          formData as GlobalControl,
          fileContents,
          oldName,
        );
      case CONTROLTYPE.Track:
        return TrackControl.validate(
          formData as TrackControl,
          fileContents,
          oldName,
        );
      case CONTROLTYPE.Generator:
        return GeneratorControl.validate(
          formData as GeneratorControl,
          fileContents,
          oldName,
        );
      default:
        return [`Invalid control type '${formData.type}'`];
    }
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
      setStatus(`Control '${formData.name}' added.`);
    } else {
      const index: number = fileContents.controls.findIndex(
        (c) => c.name == oldName,
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

  function handleListChange(
    event: ChangeEvent<HTMLSelectElement>,
    type: CONTROLTYPE,
  ): void {
    const options: HTMLOptionsCollection = event.target.options;
    const newList: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) newList.push(options[i].value);
    }
    setFormData((f: Control) => {
      if (type == CONTROLTYPE.Track) {
        const newF: TrackControl = (f as TrackControl).copy();
        newF.values.list = newList;
        return newF;
      } else if (type == CONTROLTYPE.Generator) {
        const newF: GeneratorControl = (f as GeneratorControl).copy();
        newF.values.list = newList;
        return newF;
      } else return f;
    });
  }

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ): void {
    event.preventDefault();
    event.stopPropagation();
    setFormData((prev: ControlType) => {
      const eventName: string | null = event.target["name"];
      const eventValue: string =
        event.target["type"] != "checkbox"
          ? event.target["value"]
          : event.target["checked"].toString();
      if (eventName == undefined || eventValue == undefined) return prev;
      switch (formData.type) {
        case CONTROLTYPE.Global: {
          const newFormData: GlobalControl = (prev as GlobalControl).copy();
          newFormData.setAttribute(eventName, eventValue);
          return newFormData;
        }
        case CONTROLTYPE.Track: {
          const newFormData: TrackControl = (prev as TrackControl).copy();
          newFormData.setAttribute(eventName, eventValue);
          return newFormData;
        }
        case CONTROLTYPE.Generator: {
          const newFormData: GeneratorControl = (
            prev as GeneratorControl
          ).copy();
          newFormData.setAttribute(eventName, eventValue);
          return newFormData;
        }
        default:
          return prev;
      }
    });
  }

  function handleDeleteClick(event: MouseEvent<Element>) {
    event.preventDefault();
    event.stopPropagation();
    setShowDelete(true);
  }

  return (
    <div className="modal-content" aria-modal="true">
      <div className="modal-header">
        <span className="close" onClick={handleCancelClick}>
          &times;
        </span>
        <span>&nbsp;{controlNew ? "Add Control" : "Modify Control"}</span>
      </div>
      <div className="modal-body">
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
              {Object.keys(CONTROLTYPE).map((type: string) => (
                <option key={`controltype-${type}`} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          {!!(formData.type == CONTROLTYPE.Global) && (
            <GlobalControlDialog
              control={formData as GlobalControl}
              handleChange={handleChange}
            />
          )}
          {!!(formData.type == CONTROLTYPE.Track) && (
            <TrackControlDialog
              control={formData as TrackControl}
              handleChange={handleChange}
              list={(formData as TrackControl).values.list}
              handleListChange={(e)=>handleListChange(e, CONTROLTYPE.Track)}
              tracks={tracks}
            />
          )}
          {!!(formData.type == CONTROLTYPE.Generator) && (
            <GeneratorControlDialog
              control={formData as GeneratorControl}
              handleChange={handleChange}
              list={(formData as GeneratorControl).values.list}
              handleListChange={(e)=> handleListChange(e, CONTROLTYPE.Generator)}
              tracks={tracks}
            />
          )}
          <hr />
          <input type="submit" value={controlNew ? "Add" : "Modify"} />
        </form>
      </div>
      <div className="modal-footer">
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
  );
}
