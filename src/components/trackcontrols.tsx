// Display and interact with a track's controls,
// including delete, rename, mute, solo, move up, move down
// and add generator
import Track from "classes/track";
import { useCMGContext } from "cmgcontext";
import { ChangeEvent, FormEvent, MouseEvent, useState } from "react";
import {
  AiFillCaretDown,
  AiFillCaretUp,
  AiFillMuted,
  AiOutlineClose,
  AiOutlineMuted,
} from "react-icons/ai";
import { CgRename } from "react-icons/cg";
import { IoPerson, IoPersonOutline } from "react-icons/io5";
import { FaTools } from "react-icons/fa";
import { RiAiGenerate } from "react-icons/ri";
import { GENERATORTYPE } from "types";
import {
  deleteTrack,
  flipTrackAttribute,
  moveTrack,
  renameTrack,
} from "utils/cmfiletransactions";
import { TrackDuplicateDialog, TrackShiftDialog, TrackVolumeDialog } from "dialogs/tracktooldialogs";

export interface TrackControlsProps {
  tracks: Track[];
  track: Track;
  trackIndex: number;
}
export default function TrackControls(props: TrackControlsProps) {
  const { track, trackIndex, tracks } = props;
  const {
    controlWidth,
    fileContents,
    setFileContents,
    timeLine,
    playing,
    setStatus,
    setTrackIndex,
    setEditGeneratorData,
    setGeneratorDialogVisible,
  } = useCMGContext();
  const [trackName, setTrackName] = useState<string>("");
  const [deleteModal, setDeleteModal] = useState<boolean>(false);
  const [renameModal, setRenameModal] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [menuEnabled, setMenuEnabled] = useState<boolean>(false);
  const [toolsEnabled, setToolsEnabled] = useState<boolean>(false);
  const [menu, setMenu] = useState<{x:number, y:number}>({x:0, y:0});
  const [tool, setTool] = useState<{x:number, y:number}>({x:0, y:0});
  const [duplicateEnabled, setDuplicateEnabled] = useState<boolean> (false);
  const [volumeEnabled, setVolumeEnabled] = useState<boolean> (false);
  const [shiftEnabled, setShiftEnabled] = useState<boolean> (false);

  function handleDeleteTrack(): void {
    setDeleteModal(true);
    setStatus(``);
  }
  function handleDeleteOK(): void {
    const thisIndex = fileContents.tracks.findIndex(
      (t) => t.name == track.name
    );
    if (thisIndex < 0) return;
    setStatus(`Track ${track.name} deleted`);
    deleteTrack(thisIndex, setFileContents);
    setDeleteModal(false);
  }

  function handleDeleteCancel(): void {
    setDeleteModal(false);
    setStatus(``);
  }

  function handleRenameTrack(): void {
    setTrackName(track.name);
    setRenameModal(true);
    setStatus(``);
  }

  function handleNewTrackName(event: ChangeEvent<HTMLInputElement>): void {
    setTrackName(event.target.value);
    setStatus(``);
  }

  function handleRenameOK(event: FormEvent<Element>): void {
    event.preventDefault();
    const newName: string = trackName;
    if (!validateNewName(newName)) {
      setMessage(`'${newName}' is already being used or it is blank.`);
      return;
    }
    const thisIndex = fileContents.tracks.findIndex(
      (t) => t.name == track.name
    );
    if (thisIndex < 0) return;
    setStatus(`Track '${track.name}' renamed`);
    renameTrack(thisIndex, newName, setFileContents);
    setRenameModal(false);
  }

  function handleRenameCancel(): void {
    setRenameModal(false);
    setTrackName("");
    setStatus(``);
  }

  // check that the new name for the track is not already being used
  function validateNewName(newName: string): boolean {
    const index = fileContents.tracks.findIndex((t) => t.name == newName);
    return index < 0 && newName != "";
  }

  function handleMuteTrack(): void {
    const thisIndex = fileContents.tracks.findIndex(
      (t) => t.name == track.name
    );
    if (thisIndex >= 0) {
      setStatus(`Track '${track.name} mute toggled`);
      flipTrackAttribute(thisIndex, "mute", setFileContents);
    }
  }

  function handleSoloTrack(): void {
    const thisIndex = fileContents.tracks.findIndex(
      (t) => t.name == track.name
    );
    if (thisIndex >= 0) {
      setStatus(`Track '${track.name} solo toggled`);
      flipTrackAttribute(thisIndex, "solo", setFileContents);
    }
  }

  function handleAddGenerator(
    event: MouseEvent<Element>,
    trackIndex: number
  ): void {
    if (playing.current) return;
    event.preventDefault();
    event.stopPropagation();
    setMenu({x:controlWidth / 2, y: 100 / 2 + trackIndex * 100});
    setMenuEnabled(true);
  }

  function handleTools(event: MouseEvent<Element>, trackIndex: number) {
    if (playing.current) return;
    event.preventDefault();
    event.stopPropagation();
    setTool({x:controlWidth / 2, y: 100 * 2 / 3 + trackIndex * 100});
    setToolsEnabled(true);
  }

  // switch places the the track immediately above the one selected
  function handleTrackUpDown(direction: string) {
    // update the track sequence
    setStatus(`Track '${track.name} moved ${direction}`);
    moveTrack(track.name, direction, setFileContents);
  }

  function handleSelectGenerator(event: MouseEvent, type: GENERATORTYPE) {
    event.preventDefault();
    setEditGeneratorData({
      track: track,
      generator: null,
      type: type,
      newGenerator: true,
    });
    // setGeneratorType(type);
    setTrackIndex(tracks.findIndex((t) => t.name == track.name));
    setMenuEnabled(false);
    setGeneratorDialogVisible(true);
  }
  function handleToolSelect(event: MouseEvent, type: string) {
    if (playing.current) return;
    setToolsEnabled(false);
    event.stopPropagation();
    event.preventDefault();
    const trackIndex: number = tracks.findIndex((t) => t.name == track.name);
    setTrackIndex(trackIndex);
    if (trackIndex < 0) return;
    switch (type) {
      case 'Duplicate':
        setDuplicateEnabled(true);
        break;
      case 'Shift':
        setShiftEnabled(true);
        break;
      case 'Volume':
        setVolumeEnabled(true);
        break;
      default:
        break;
    }
  }

  return (
    <>
      <div>
        <button
          className="track-button"
          id={"track-delete:" + track.name}
          key={"track-delete:" + track.name}
          onClick={handleDeleteTrack}
        >
          <AiOutlineClose size={10} />
        </button>
      </div>
      <div>{track.name}</div>
      <div>
        <button
          className="track-button"
          id={"track-rename:" + track.name}
          key={"track-rename:" + track.name}
          onClick={handleRenameTrack}
        >
          <CgRename />
        </button>
      </div>
      <div>
        <button
          className="track-button"
          style={{ float: "left" }}
          id={"track-mute:" + track.name}
          key={"track-mute:" + track.name}
          onClick={handleMuteTrack}
        >
          {track.mute ? <AiFillMuted /> : <AiOutlineMuted />}
        </button>
      </div>
      <div>
        <button
          className="track-button"
          style={{ float: "none", marginLeft: "7px" }}
          id={`track-gen:${track.name}`}
          key={`track-gen:${track.name}`}
          onClick={(event) => handleAddGenerator(event, trackIndex)}
        >
          <RiAiGenerate />
        </button>
      </div>
      <div>
        <button
          className="track-button"
          id={"track-solo:" + track.name}
          key={"track-solo:" + track.name}
          onClick={handleSoloTrack}
        >
          {track.solo ? <IoPerson /> : <IoPersonOutline />}
        </button>
      </div>
      <div>
        <button
          disabled={trackIndex == 0}
          className="track-button"
          id={"track-up:" + track.name}
          key={"track-up:" + track.name}
          onClick={() => handleTrackUpDown("up")}
        >
          <AiFillCaretUp />
        </button>
      </div>
      <div>
        <button
          className="track-button"
          id={`track-gen:${track.name}`}
          key={`track-gen:${track.name}`}
          onClick={(event) => handleTools(event, trackIndex)}
        >
          <FaTools />
        </button>
        </div>
      <div>
        <button
          disabled={trackIndex == tracks.length - 1}
          className="track-button"
          id={"track-down:" + track.name}
          key={"track-down:" + track.name}
          onClick={() => handleTrackUpDown("down")}
        >
          <AiFillCaretDown />
        </button>
      </div>
      {deleteModal ? (
        <div className="modal-content">
          <div className="modal-header">
            <span className="close" onClick={handleDeleteCancel}>
              &times;
            </span>
            <h2>Confirm delete of track '{track.name}'</h2>
          </div>
          <div className="modal-body">
            <p>Select OK to delete track or Cancel to abort deletion.</p>
          </div>
          <div className="modal-footer">
            <button id={"track-delete:" + track.name} onClick={handleDeleteOK}>
              OK
            </button>
            <button onClick={handleDeleteCancel}>Cancel</button>
          </div>
        </div>
      ) : null}
      {renameModal ? (
        <div className="modal-content">
          <div className="modal-header">
            <span className="close" onClick={handleRenameCancel}>
              &times;
            </span>
            <h2>Enter new name for Track '{track.name}'</h2>
          </div>
          <div className="modal-body">
            <form
              name="track-rename-form"
              id="track-rename-form"
              onSubmit={handleRenameOK}
            >
              <label htmlFor="track-rename-field">New Name: </label>
              <input
                name="track-rename-field"
                id="track-rename-field"
                type="text"
                value={trackName}
                onChange={handleNewTrackName}
              />
              <br />
              <button type="submit" id={"track-rename-submit"}>
                OK
              </button>
            </form>
          </div>
          <div className="modal-footer">
            <p>{message}</p>
          </div>
        </div>
      ) : null}
      {menuEnabled ? (
        <div
          className="modal-menu"
          id={"addgenmenu"}
          key={"addgenmenu"}
          style={{
            position: "absolute",
            top: menu.y.toString() + "px",
            left: menu.x.toString() + "px",
            width: "180px",
            height: "20px",
            zIndex: 99,
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
                visibility: "visible",
              }}
            >
              <div className="dropbtn" >
                Select Generator Type
                <i className="fa fa-caret-down" />
              </div>
              <div className="dropdown-one">
                <div
                  className="dItem"
                  onClick={(e) =>
                    handleSelectGenerator(e, GENERATORTYPE.Silent)
                  }
                >
                  Silent
                </div>
                <div
                  className="dItem"
                  onClick={(e) =>
                    handleSelectGenerator(e, GENERATORTYPE.Algorithmic)
                  }
                >
                  Algorithmic
                </div>
                <div
                  className="dItem"
                  onClick={(e) =>
                    handleSelectGenerator(e, GENERATORTYPE.AudioFile)
                  }
                >
                  AudioFile
                </div>
                <div className="dItem" onClick={() => setMenuEnabled(false)}>
                  Exit
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {toolsEnabled ? (
        <div
          className="modal-menu"
          id={"toolsmenu"}
          key={"toolsmenu"}
          style={{
            position: "absolute",
            top: tool.y.toString() + "px",
            left: tool.x.toString() + "px",
            width: "80px",
            height: "20px",
            zIndex: 99,
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
                visibility: "visible",
              }}
            >
              <div className="dropbtn">
                Tools
                <i className="fa fa-caret-down" />
              </div>
              <div className="dropdown-one">
                <div
                  className="dItem"
                  onClick={(e) =>
                    handleToolSelect(e, 'Duplicate')
                  }
                >
                  Duplicate
                </div>
                <div
                  className="dItem"
                  onClick={(e) =>
                    handleToolSelect(e, 'Shift')
                  }
                >
                  Shift
                </div>
                <div
                  className="dItem"
                  onClick={(e) =>
                    handleToolSelect(e, 'Volume')
                  }
                >
                  Volume
                </div>
                <div className="dItem" onClick={() => setToolsEnabled(false)}>
                  Exit
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {duplicateEnabled? (
        <TrackDuplicateDialog 
        fileContents={fileContents} 
        setFileContents={setFileContents} 
        timeLine={timeLine}
        track={track} 
        enabled={setDuplicateEnabled}/>
      ): null}
      {shiftEnabled? (
        <TrackShiftDialog         
        fileContents={fileContents} 
        setFileContents={setFileContents} 
        timeLine={timeLine}
        track={track} 
        enabled={setShiftEnabled}/>
      ): null}
      {volumeEnabled? (
        <TrackVolumeDialog         
        fileContents={fileContents} 
        setFileContents={setFileContents} 
        timeLine={timeLine}
        track={track} 
        enabled={setVolumeEnabled}/>
      ): null}
    </>
  );
}
