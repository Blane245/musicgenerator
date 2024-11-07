import Track from "classes/track"
import { useCMGContext } from "../../contexts/cmgcontext";
import { ChangeEvent, FormEvent, MouseEvent, useState } from "react";
import { AiFillCaretDown, AiFillCaretUp, AiFillMuted, AiOutlineClose, AiOutlineMuted } from "react-icons/ai";
import { CgRename } from "react-icons/cg";
import { IoPerson, IoPersonOutline } from "react-icons/io5";
import { RiAiGenerate } from "react-icons/ri";
import { deleteTrack, flipTrackAttrbute, moveTrack, renameTrack } from "../../utils/cmfiletransactions";

export interface TrackControlsDisplayProps {
    tracks: Track[],
    track: Track,
    trackIndex: number,
    setEnableGeneratorDialog: Function,
}
export default function TrackControlsDisplay(props: TrackControlsDisplayProps) {
    const { track, trackIndex, tracks, setEnableGeneratorDialog } = props;
    const { fileContents, setFileContents, playing, setStatus } = useCMGContext();
    const [trackName, setTrackName] = useState<string>('');
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [renameModal, setRenameModal] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');


    function handleDeleteTrack(): void {
        setDeleteModal(true);
        setStatus(``);
    }
    function handleDeleteOK(): void {
        const thisIndex = fileContents.tracks.findIndex((t) => (t.name == track.name));
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
        const thisIndex = fileContents.tracks.findIndex((t) => (t.name == track.name));
        if (thisIndex < 0) return;
        setStatus(`Track '${track.name}' renamed`);
        renameTrack(thisIndex, newName, setFileContents);
        setRenameModal(false);
    }

    function handleRenameCancel(): void {
        setRenameModal(false);
        setTrackName('');
        setStatus(``);
    }

    // check that the new name for the track is not alreadybeing used
    function validateNewName(newName: string): boolean {
        const index = fileContents.tracks.findIndex((t) => (t.name == newName));
        return (index < 0 && newName != '');
    }

    function handleMuteTrack(): void {
        const thisIndex = fileContents.tracks.findIndex((t) => (t.name == track.name));
        if (thisIndex >= 0) {
            setStatus(`Track '${track.name} mute toggled`);
            flipTrackAttrbute(thisIndex, 'mute', setFileContents);
        }
    }

    function handleSoloTrack(): void {
        const thisIndex = fileContents.tracks.findIndex((t) => (t.name == track.name));
        if (thisIndex >= 0) {
            setStatus(`Track '${track.name} solo toggled`);
            flipTrackAttrbute(thisIndex, 'solo', setFileContents);
        }

    }

    // this is the input business end of this app. Generators will 
    // come in different shapes and sizes. There CRUD will be handled by modals
    // that appear in a different component
    function handleAddGenerator(event: MouseEvent<Element>, index: number): void {
        event.preventDefault();
        console.log('index', index);
        setEnableGeneratorDialog(index);
    }

    // switch places the the track immediately above the one selected
    function handleTrackUpDown(direction: string) {

        // update the track sequence
        setStatus(`Track '${track.name} moved ${direction}`);
        moveTrack(track.name, direction, setFileContents);

    }

    return (
        <>
            <div className='page-track-control'
                key={'track-control:' + track.name}

            >
                <fieldset disabled={playing.current?.on} style={{ width: 'inherit' }}>
                    <button className='track-button'
                        id={'track-delete:' + track.name}
                        key={'track-delete:' + track.name}
                        onClick={handleDeleteTrack}
                    >
                        <AiOutlineClose size={10} />
                    </button>
                    {track.name}
                    <button
                        style={{ float: 'right' }}
                        className='track-button'
                        id={'track-rename:' + track.name}
                        key={'track-rename:' + track.name}
                        onClick={handleRenameTrack}
                    >
                        <CgRename />
                    </button>
                    <br />
                    <button className='track-button'
                        id={'track-mute:' + track.name}
                        key={'track-mute:' + track.name}
                        onClick={handleMuteTrack}
                    >
                        {track.mute ? <AiFillMuted /> : <AiOutlineMuted />}
                    </button>

                    <button
                        className='track-button'
                        id={`track-gen:${trackIndex}`}
                        key={`track-gen:${trackIndex}`}
                        onClick={(event) => handleAddGenerator(event, trackIndex)}
                    >
                        <RiAiGenerate />
                    </button>
                    <button
                        style={{ float: 'right' }}
                        className='track-button'
                        id={'track-solo:' + track.name}
                        key={'track-solo:' + track.name}
                        onClick={handleSoloTrack}
                    >
                        {track.solo ? <IoPerson /> : <IoPersonOutline />}
                    </button>
                    <br />
                    <button
                        style={{ float: 'left' }}
                        disabled={trackIndex == 0}
                        className='track-button'
                        id={'track-up:' + track.name}
                        key={'track-up:' + track.name}
                        onClick={() => handleTrackUpDown('up')}
                    >
                        <AiFillCaretUp />
                    </button>
                    <button
                        style={{ float: 'right' }}
                        disabled={trackIndex == tracks.length - 1}
                        className='track-button'
                        id={'track-down:' + track.name}
                        key={'track-down:' + track.name}
                        onClick={() => handleTrackUpDown('down')}
                    >
                        <AiFillCaretDown />
                    </button>
                </fieldset>
            </div>
            <div
                style={{ display: deleteModal ? "block" : "none" }}
                className="modal-content"
            >
                <div className='modal-header'>
                    <span className='close' onClick={handleDeleteCancel}>&times;</span>
                    <h2>Confirm delete of track '{track.name}'</h2>
                </div>
                <div className="modal-body">
                    <p>
                        Select OK to delete track or Cancel to abort deletion.
                    </p>
                </div>
                <div className='modal-footer'>
                    <button
                        id={"track-delete:" + track.name}
                        onClick={handleDeleteOK}
                    >OK</button>
                    <button
                        onClick={handleDeleteCancel}
                    >Cancel</button>
                </div>
            </div>
            <div
                style={{ display: renameModal ? "block" : "none" }}
                className="modal-content"
            >
                <div className='modal-header'>
                    <span className='close' onClick={handleRenameCancel}>&times;</span>
                    <h2>Enter new name for Track '{track.name}'</h2>
                </div>
                <div className="modal-body">
                    <form name='track-rename-form' id='track-rename-form'
                        onSubmit={handleRenameOK}>
                        <label htmlFor='track-rename-field'>New Name: </label>
                        <input
                            name='track-rename-field'
                            id='track-rename-field'
                            type="text"
                            value={trackName}
                            onChange={handleNewTrackName}
                        />
                        <br />
                        <button type='submit'
                            id={"track-rename-submit"}
                        >OK</button>
                    </form>
                </div>
                <div className='modal-footer'>
                    <p>{message}</p>
                </div>
            </div>
        </>
    )
}