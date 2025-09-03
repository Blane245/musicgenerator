import Track from "classes/track";
import { useCMGContext } from "cmgcontext";
import { buildSources } from "generation/buildsources";
import Generate from "generation/generate";
import ReadyGenerate from "generation/readygenerate";
import { useState } from "react";
import { GENERATIONMODE, GeneratorType } from "types";
import { flipGeneratorMute } from "utils/cmfiletransactions";
import setCursor from "utils/setcursor";
import GeneratorCopyMoveDialog from "./generatorcopymovedialog";
import GeneratorDeleteDialog from "./generatordeletedialog";

export interface GeneratorMenuProps {
  track: Track;
  generator: GeneratorType;
  setMenuVisible: Function;
  menuX: number;
  menuY: number;
}

// handles copy and move generator between tracks.
export default function GeneratorMenuDialog(props: GeneratorMenuProps) {
  const { track, generator, setMenuVisible, menuX, menuY } = props;
  const {
    fileContents,
    setFileContents,
    timeInterval,
    setTrackIndex,
    setEditGeneratorData,
    setGeneratorDialogVisible,
    setMode,
    setSourceData,
    setPlaybackLength,
    setOffsetTime,
    setStatus,
    playing,
  } = useCMGContext();
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [copyMoveMode, setCopyMoveMode] = useState<string>("");
  const [copyMoveDialogVisible, setCopyMoveDialogVisible] =
    useState<boolean>(false);
  const [generatorName, setGeneratorName] = useState<string>("");
  const [deleteModal, setDeleteModal] = useState<boolean>(false);

  function onPreviewClick() {
    handleReadySolo();
    setPreviewVisible(true);
    setMenuVisible(null);
    setMode(GENERATIONMODE.solo);
    setStatus(``);
  }
  function onEditClick() {
    setTrackIndex(-1);
    setEditGeneratorData({
      track: track,
      generator: generator,
      newGenerator: false,
      type: generator.type,
    });
    setGeneratorDialogVisible(true);
    setMenuVisible(null);
    setCursor("default");
    setStatus(``);
  }
  function onCopyClick() {
    const gName: string = generator.name;
    setCopyMoveMode("copy");
    setGeneratorName(gName);
    setCopyMoveDialogVisible(true);
    setStatus(``);
  }
  function onMoveClick() {
    const gName: string = generator.name;
    setCopyMoveMode("move");
    setGeneratorName(gName);
    setCopyMoveDialogVisible(true);
    setStatus(``);
  }
  function onMuteClick() {
    const index: number = track.generators.findIndex(
      (g) => g.name == generator.name
    );
    if (index < 0) return;
    flipGeneratorMute(track, index, setFileContents);
    setMenuVisible(null);
    setCursor("default");
    setStatus(``);
  }

  function onDeleteClick() {
    const gName: string = generator.name;
    setGeneratorName(gName);
    setDeleteModal(true);
    setStatus(``);
  }
  function handleReadySolo() {
    const {
      AlgorithmicGenerators,
      AudioFileGenerators,
      SilentGenerators,
      error,
    } = ReadyGenerate({
      mode: GENERATIONMODE.solo,
      generator: generator,
      fileContents,
      timeInterval,
    });
    setStatus(error);
    if (error != "") return;
    const { sources: builtSourceData, error: buildError } = buildSources({
      AlgorithmicGenerators,
      AudioFileGenerators,
      SilentGenerators,
    });

    // catch any errors during build
    setStatus(buildError);
    if (buildError != "") return;
    setSourceData(builtSourceData);
    playing.current = true;
  }

  return (
    <>
      <div
        className="modal-menu"
        id={"genmenu"}
        key={"genmenu"}
        style={{
          display: !playing.current ? "block" : "none",
          position: "relative",
          top: menuY.toString() + "px",
          left: menuX.toString() + "px",
          width: "60px",
          height: "20px",
        }}
      >
        <div
          className="navbar"
          style={{
            position: "relative",
            top: "0px",
            visibility: "hidden",
          }}
        >
          <div
            className="dropdown"
            style={{
              position: "relative",
              top: "0px",
              visibility: "visible",
            }}
          >
            <div className="dropbtn">
              Menu
              <i className="fa fa-caret-down"></i>
            </div>
            <div className="dropdown-one">
              <div className="dItem" onClick={() => onPreviewClick()}>
                Preview
              </div>
              <div className="dItem" onClick={() => onEditClick()}>
                Edit
              </div>
              <div className="dItem" onClick={() => onCopyClick()}>
                Copy
              </div>
              <div className="dItem" onClick={() => onMoveClick()}>
                Move
              </div>
              <div className="dItem" onClick={() => onMuteClick()}>
                {generator.mute ? "Unmute" : "Mute"}
              </div>
              <div className="dItem" onClick={() => onDeleteClick()}>
                Delete
              </div>
              <div className="dItem" onClick={() => setMenuVisible(null)}>
                Exit
              </div>
            </div>
          </div>
        </div>
      </div>
      {previewVisible ? <Generate generator={generator} /> : null}
      {copyMoveDialogVisible ? (
        <GeneratorCopyMoveDialog
          mode={copyMoveMode}
          trackName={track.name}
          generatorName={generatorName}
          setDialogVisible={setCopyMoveDialogVisible}
          setMenuVisible={setMenuVisible}
        />
      ) : null}
      {deleteModal ? (
        <GeneratorDeleteDialog
          trackName={track.name}
          generatorName={generatorName}
          setDialogVisible={setDeleteModal}
          setMenuVisible={setMenuVisible}
        />
      ) : null}
    </>
  );
}
