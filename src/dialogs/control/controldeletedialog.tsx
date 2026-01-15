import { useCMGContext } from "cmgcontext";
import { FormEvent } from "react";
import { deleteControl } from "utils/cmfiletransactions";

export interface ControlDeleteProps {
  controlName: string;
  setDialogVisible: React.Dispatch<React.SetStateAction<boolean>>;
}

// handles copy and move generator between tracks.
export default function ControlDeleteDialog(props:ControlDeleteProps) {
  const { controlName, setDialogVisible} = props;
  const { fileContents, setFileContents, setStatus } = useCMGContext();

  function onCancel() {
    setDialogVisible(false);
    setStatus("Delete Control canceled");
  }
  function onOK(event: FormEvent<Element>) {
    event.preventDefault();
    event.stopPropagation();
    setDialogVisible(false);
    // handle delete
    const index: number = fileContents.controls.findIndex(
      (c) => c.name == controlName
    );
    if (index < 0) return;
    deleteControl(index, setFileContents);
    setStatus(`Control '${controlName}' deleted.`);
  }
  return (
    <div className="modal-content">
      <div className="modal-header">
        <span className="close" onClick={onCancel}>
          &times;
        </span>
        <h2>Confirm Control Deletion</h2>
      </div>
      <div className="modal-body">
        <h2>
          {`Confirm Deletion of control '${controlName}'.`}
        </h2>
        <br />
      </div>
      <div className="modal-footer">
        <button onClick={onOK}>Ok</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
