import { FormEvent} from "react";
import Track from "../classes/track";
import { useCMGContext } from "../cmgcontext";
import { deleteGenerator } from "../utils/cmfiletransactions";

export interface GeneratorDeleteProps {
  trackName: string;
  generatorName: string;
  setDialogVisible: Function;
  setMenuVisible: Function;
}

// handles copy and move generator between tracks.
export default function GeneratorDeleteDialog(props: GeneratorDeleteProps) {
  const { trackName, generatorName, setDialogVisible, setMenuVisible } =
    props;
  const { fileContents, setFileContents, setStatus } = useCMGContext();

  function onCancel() {
    setDialogVisible(false);
    setStatus("");
    setMenuVisible(false);
  }
  function onOK(event: FormEvent<Element>) {
    event.preventDefault();
    event.stopPropagation();
    setDialogVisible(false);
    setMenuVisible(false);
    // handle delete
    const currentTrack: Track | undefined = fileContents.tracks.find(
      (t) => t.name == trackName
    );
    if (!currentTrack) return;
    deleteGenerator(currentTrack, generatorName, setFileContents);
    setStatus(
      `Generator '${generatorName}' deleted from ${trackName}`
    );
  }
  return (
    <div className="modal-content">
      <div className="modal-header">
        <span className="close" onClick={onCancel}>
          &times;
        </span>
        <h2>
          Confirm Generator Deletion
        </h2>
      </div>
      <div className="modal-body">
        <h2>
          {`Confirm Deletion of generator '${generatorName}' from track '${trackName}'`}
        </h2>
        <br />
        <div className="modal-footer">
          <button onClick={onOK}>Ok</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
