import { ChangeEvent, FormEvent, useState } from "react";
import Track from "../classes/track";
import { useCMGContext } from "../cmgcontext";
import { GeneratorType } from "../types";
import { addGenerator, deleteGenerator } from "../utils/cmfiletransactions";
import { getGeneratorUID } from "../utils/getgeneratoruid";

export interface GeneratorCopyMoveProps {
  mode: string;
  trackName: string;
  generatorName: string;
  setDialogVisible: Function;
  setMenuVisible: Function;
}

// handles copy and move generator between tracks.
export default function GeneratorCopyMoveDialog(props: GeneratorCopyMoveProps) {
  const { mode, trackName, generatorName, setDialogVisible, setMenuVisible } =
    props;
  const { fileContents, setFileContents, setStatus } = useCMGContext();
  const [selectedTrackName, setSelectedTrackName] = useState<string>(trackName);

  function onCancel() {
    setDialogVisible(false);
    setStatus("");
    setMenuVisible(false);
  }
  function onChange(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedTrackName(event?.target.value);
  }
  function onOK(event: FormEvent<Element>) {
    event.preventDefault();
    event.stopPropagation();
    setDialogVisible(false);
    setMenuVisible(false);
    // handle move or copy
    const targetTrack: Track | undefined = fileContents.tracks.find(
      (t) => t.name == selectedTrackName
    );
    if (!targetTrack) return;
    const currentTrack: Track | undefined = fileContents.tracks.find(
      (t) => t.name == trackName
    );
    if (!currentTrack) return;

    const targetGenerator: GeneratorType | undefined =
      currentTrack.generators.find((g) => g.name == generatorName);
    if (!targetGenerator) return;

    const newG: GeneratorType = targetGenerator.copy();
    if (mode == "copy") {
      const next: number = getGeneratorUID(fileContents.tracks);
      newG.name = "G".concat(next.toString());
    }
    addGenerator(targetTrack, newG, setFileContents);

    // if in move mode, delete the target generator from the current track
    if (mode == "move") {
      deleteGenerator(currentTrack, generatorName, setFileContents);
    }
    setStatus(
      `Generator '${generatorName}' ${
        mode == "copy" ? " copied" : " moved"
      } to track '${targetTrack.name}' with name '${newG.name}'`
    );
  }
  return (
    <div className="modal-content">
      <div className="modal-header">
        <span className="close" onClick={onCancel}>
          &times;
        </span>
        <h2>
          {mode == "copy"
            ? "Select track to receive a copy of '" + generatorName + "'"
            : "Select track to move '" + generatorName + "'"}
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
        <div className="modal-footer">
          <button onClick={onOK}>{mode == "copy" ? "Copy" : "Move"}</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
