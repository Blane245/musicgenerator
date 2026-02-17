import { useCMGContext } from "cmgcontext";
import { FormEvent } from "react";
import { GeneratorType } from "types";
import { deleteGenerator } from "utils/cmfiletransactions";

export interface GeneratorDeleteProps {
  trackName: string;
  generator: GeneratorType;
  setDialogVisible: React.Dispatch<React.SetStateAction<{visible:boolean, generator?: GeneratorType}>>;
}

// handles copy and move generator between tracks.
export default function GeneratorDeleteDialog(props: GeneratorDeleteProps) {
  const { trackName, generator, setDialogVisible } = props;
  const { setFileContents, setStatus } = useCMGContext();

  function onCancel() {
    setDialogVisible({visible:false});
    setStatus("Generator Delte canceled");
  }
  function onOK(event: FormEvent<Element>) {
    event.preventDefault();
    event.stopPropagation();
    setDialogVisible({visible:false});

    // handle delete
    deleteGenerator(generator, setFileContents);
    setStatus(`Generator '${generator.name}' deleted from ${generator.parent.name}`);
  }
  return (
    <div className="modal-content">
      <div className="modal-header">
        <span className="close" onClick={onCancel}>
          &times;
        </span>
        <h2>Confirm Generator Deletion</h2>
      </div>
      <div className="modal-body">
        <h2>
          {`Confirm Deletion of generator '${generator.name}' from track '${trackName}'`}
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
