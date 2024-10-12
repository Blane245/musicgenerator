import { ChangeEvent, FormEvent, MouseEvent, useEffect, useRef, useState } from "react";
import { AiFillCaretDown, AiFillCaretUp, AiFillMuted, AiOutlineClose, AiOutlineMuted } from 'react-icons/ai';
import { CgRename } from "react-icons/cg";
import { IoPerson, IoPersonOutline } from "react-icons/io5";
import { RiAiGenerate } from "react-icons/ri";
import '../../App.css';
import Track from "../../classes/track";
import GeneratorDialog from '../dialogs/generatordialog';
import GeneratorIcons from './generatoricons';
import { useCMGContext } from "../../contexts/cmgcontext";
import { deleteTrack, flipTrackAttrbute, moveTrack, renameTrack } from "../../utils/cmfiletransactions";

export default function TracksDisplay() {
    const { fileContents, setFileContents, setMessage, setStatus}
        = useCMGContext();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [renameModal, setRenameModal] = useState<boolean>(false);
    const [trackName, setTrackName] = useState<string>('');
    const [enableGeneratorDialog, setEnableGeneratorDialog] = useState<number>(-1);
    const trackRef = useRef<HTMLDivElement[]>([]);
    useEffect(() => {
        setTracks(fileContents.tracks);
        setStatus(`displayed ${fileContents.tracks.length} tracks`);
        setEnableGeneratorDialog(-1);
        console.log('tracks refreshed');
    }, [fileContents.tracks]);
    useEffect(() => {
        trackRef.current = trackRef.current.slice(0, tracks.length);
    }, [tracks, trackRef.current]);

    function handleDeleteTrack(event: MouseEvent<HTMLElement>): void {
        console.log(event.currentTarget.id);
        const trackName = event.currentTarget.id.split(':')[1];
        setTrackName(trackName);
        setDeleteModal(true);

    }
    function handleDeleteOK(event: MouseEvent<HTMLElement>): void {
        const trackName = event.currentTarget.id.split(':')[1];
        const thisIndex = fileContents.tracks.findIndex((t) => (t.name == trackName));
        if (thisIndex < 0) return;
        deleteTrack(thisIndex, setFileContents);
        setDeleteModal(false);

    }

    function handleDeleteCancel(): void {
        setDeleteModal(false);
    }

    function handleRenameTrack(event: MouseEvent<HTMLElement>): void {
        console.log(event.currentTarget.id);
        const trackName = event.currentTarget.id.split(':')[1];
        setTrackName(trackName);
        setRenameModal(true);
    }

    function handleRenameOK(event: FormEvent<HTMLElement>): void {
        event.preventDefault();
        const renameElement = document.getElementById('track-rename-field');
        if (!renameElement) return;
        const newName: string | null = renameElement.value;
        if (!newName) return;
        if (!validateNewName(newName)) {
            setMessage({ error: true, text: `'${newName}' is already being used or it is blank.` });
            return;
        }
        const thisIndex = fileContents.tracks.findIndex((t) => (t.name == trackName));
        if (thisIndex < 0) return;
        renameTrack(thisIndex, newName, setFileContents);
        setRenameModal(false);
    }

    function handleRenameCancel(): void {
        setRenameModal(false);
    }


    // check that the new name for the track is not alreadybeing used
    function validateNewName(newName: string): boolean {
        const index = fileContents.tracks.findIndex((t) => (t.name == newName));
        return (index < 0 && newName != '');
    }
    function handleMuteTrack(event: MouseEvent<HTMLElement>): void {
        console.log(event.currentTarget.id);
        const trackName = event.currentTarget.id.split(':')[1];
        const thisIndex = fileContents.tracks.findIndex((t) => (t.name == trackName));
        if (thisIndex >= 0) {
            flipTrackAttrbute(thisIndex, 'mute', setFileContents);
        }

    }

    function handleSoloTrack(event: MouseEvent<HTMLElement>): void {
        console.log(event.currentTarget.id);
        const trackName = event.currentTarget.id.split(':')[1];
        const thisIndex = fileContents.tracks.findIndex((t) => (t.name == trackName));
        if (thisIndex >= 0) {
            flipTrackAttrbute(thisIndex, 'solo', setFileContents);
        }

    }

    // pick up here
    // range sliders are not appearing properly
    function handleVolumeChange(event: ChangeEvent<HTMLElement>): void {
        console.log(event.currentTarget.id);

    }

    function handlePanChange(event: ChangeEvent<HTMLElement>): void {
        console.log(event.currentTarget.id);

    }

    // this is the input business end of this app. Generators will 
    // come in different shapes and sizes. There CRUD will be handled by modals
    // that appear in a different component
    function handleAddGenerator(event: MouseEvent<HTMLElement>, index: number): void {
        event.preventDefault();
        console.log('index', index);
        setEnableGeneratorDialog(index);
    }

    function closeTrackGenerator() {
        setEnableGeneratorDialog(-1);
    }

    // switch places the the track immediately above the one selected
    function handleTrackUpDown(event: MouseEvent<HTMLElement>, direction: string) {
        const thisTrackName = event.currentTarget.id.split(':')[1];

        // update the track sequence
        moveTrack(thisTrackName, direction, setFileContents);
    }

    return (
        <>
            {tracks
                .map((t, i) => {
                    console.log('track', t.name, 'i', i); return (
                        <>
                            <div className='page-track-control'
                                key={'track-control:' + t.name}

                            >
                                <button className='track-button'
                                    id={'track-delete:' + t.name}
                                    key={'track-delete:' + t.name}
                                    onClick={handleDeleteTrack}
                                >
                                    <AiOutlineClose size={10} />
                                </button>
                                {t.name}
                                <button
                                    style={{ float: 'right' }}
                                    className='track-button'
                                    id={'track-rename:' + t.name}
                                    key={'track-rename:' + t.name}
                                    onClick={handleRenameTrack}
                                >
                                    <CgRename />
                                </button>
                                <br />
                                <button className='track-button'
                                    id={'track-mute:' + t.name}
                                    key={'track-mute:' + t.name}
                                    onClick={handleMuteTrack}
                                >
                                    {t.mute ? <AiFillMuted /> : <AiOutlineMuted />}
                                </button>

                                <button
                                    className='track-button'
                                    // disabled={!fileContents.SoundFont}
                                    id={`track-gen:${i}`}
                                    key={`track-gen:${i}`}
                                    onClick={(event) => handleAddGenerator(event, i)}
                                >
                                    <RiAiGenerate />
                                </button>
                                <button
                                    style={{ float: 'right' }}
                                    className='track-button'
                                    id={'track-solo:' + t.name}
                                    key={'track-solo:' + t.name}
                                    onClick={handleSoloTrack}
                                >
                                    {t.solo ? <IoPerson /> : <IoPersonOutline />}
                                </button>
                                <br />
                                <button
                                    style={{ float: 'left' }}
                                    disabled={i == 0}
                                    className='track-button'
                                    id={'track-up:' + t.name}
                                    key={'track-up:' + t.name}
                                    onClick={(e) => handleTrackUpDown(e, 'up')}
                                >
                                    <AiFillCaretUp />
                                </button>
                                <button
                                    style={{ float: 'right' }}
                                    disabled={i == tracks.length - 1}
                                    className='track-button'
                                    id={'track-down:' + t.name}
                                    key={'track-down:' + t.name}
                                    onClick={(e) => handleTrackUpDown(e, 'down')}
                                >
                                    <AiFillCaretDown />
                                </button>
                            </div>
                            <div className='page-track-display'
                                key={'track-display:' + t.name}
                                ref={(el: HTMLDivElement) => trackRef.current[i] = el}>
                                {trackRef.current[i] ?
                                    <GeneratorIcons
                                        track={t}
                                        element={trackRef.current[i]}
                                    />
                                    : <p>track reference null</p>
                                }
                            </div>
                        </>
                    )
                })}
            {enableGeneratorDialog >= 0 ?
                <GeneratorDialog
                    track={tracks[enableGeneratorDialog]}
                    generatorIndex={-1}
                    setGeneratorIndex={() => {}}
                    closeTrackGenerator={closeTrackGenerator}
                    setOpen={() => { }} />
                : null
            }
            <div
                style={{ display: deleteModal ? "block" : "none" }}
                className="modal-content"
            >
                <div className='modal-header'>
                    <span className='close'>&times;</span>
                    <h2>Confirm delete of track '{trackName}'</h2>
                </div>
                <div className="modal-body">
                    <p>
                        Select OK to delete track or Cancel to abort deletion.
                    </p>
                </div>
                <div className='modal-footer'>
                    <button
                        id={"track-delete:" + trackName}
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
                <form name='track-rename-form' id='track-rename-form'
                    onSubmit={handleRenameOK}>
                    <div className='modal-header'>
                        <span className='close'>&times;</span>
                        <h2>Enter new name for Track '{trackName}'</h2>
                    </div>
                    <div className="modal-body">
                        <label htmlFor='track-rename-field'>New Name:</label>
                        <input
                            name='track-rename-field'
                            id='track-rename-field'
                            type="text"
                            defaultValue={trackName}
                        />

                    </div>
                    <div className='modal-footer'>
                        <button type='submit'
                            id={"track-rename-submit"}
                        >OK</button>
                        <button
                            onClick={handleRenameCancel}
                        >Cancel</button>
                    </div>
                </form>
            </div>
        </>
    )
}
