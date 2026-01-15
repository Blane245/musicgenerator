import { ChangeEvent, FormEvent, useState } from "react";
import Track from "classes/track";
import { useCMGContext } from "cmgcontext";
import { GeneratorType } from "types";
import { addGenerator, deleteGenerator } from "utils/cmfiletransactions";
import { getGeneratorUID } from "utils/getgeneratoruid";

export interface GeneratorCopyMoveProps {
  mode: string;
  trackName: string;
  generator: GeneratorType;
  setDialogVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setMenuVisible: React.Dispatch<React.SetStateAction<Track | null>>;
}

// handles copy and move generator between tracks.
export default function GeneratorCopyMoveDialog(props: GeneratorCopyMoveProps) {
  const { mode, trackName, generator, setDialogVisible, setMenuVisible } =
    props;
  const { fileContents, setFileContents, setStatus } = useCMGContext();
  const [selectedTrackName, setSelectedTrackName] = useState<string>(trackName);

  function onCancel() {
    setDialogVisible(false);
    setStatus("Generator move/copy canceled");
    setMenuVisible(null);
  }
  function onChange(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedTrackName(event?.target.value);
  }
  function onOK(event: FormEvent<Element>) {
    event.preventDefault();
    event.stopPropagation();
    setDialogVisible(false);
    setMenuVisible(null);
    // handle move or copy
    const targetTrack: Track | undefined = fileContents.tracks.find(
      (t) => t.name == selectedTrackName
    );
    if (!targetTrack) return;
    const currentTrack: Track | undefined = fileContents.tracks.find(
      (t) => t.name == trackName
    );
    if (!currentTrack) return;

    const targetGenerator: GeneratorType = generator;
    const newG: GeneratorType = targetGenerator.copy(targetTrack);
    if (mode == "copy") {
      const next: number = getGeneratorUID(fileContents.tracks);
      newG.name = "G".concat(next.toString());
    }
    addGenerator(newG, setFileContents);

    // if in move mode, delete the target generator from the current track
    if (mode == "move") {
      deleteGenerator(targetGenerator, setFileContents);
    }
    setStatus(
      `Generator '${generator.name}' ${
        mode == "copy" ? " copied" : " moved"
      } to track '${targetTrack.name}' with name '${newG.name}'`
    );
  }
  return (
    <div className="modal-content">
      <div className="modal-header">
        <span className="close" onClick={()=>onCancel()}>
          &times;
        </span>
        <h2>
          {mode == "copy"
            ? "Select track to receive a copy of '" + generator.name + "'"
            : "Select track to move '" + generator.name + "'"}
        </h2>
      </div>
      <div className="modal-body">
        <label>
          Track Name:
          <select
            id={"SelectCopyMoveTrack-" + trackName}
            value={selectedTrackName}
            onChange={(e) => onChange(e)}
          >
            {fileContents.tracks.map((t: Track) => {
              return (
                <option key={`select-track ${t.name}`} value={t.name}>
                  {t.name}
                </option>
              );
            })}
          </select>
        </label>
        <br />
      </div>
      <div className="modal-footer">
        <button onClick={onOK}>{mode == "copy" ? "Copy" : "Move"}</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
