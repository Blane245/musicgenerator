// TODO add display of generator 'icons'
import { ChangeEvent, MouseEvent, useEffect, useRef, useState } from "react";
import { AiFillMuted, AiOutlineClose, AiOutlineMuted } from 'react-icons/ai';
import { CgRename } from "react-icons/cg";
import { IoPerson, IoPersonOutline } from "react-icons/io5";
import { RiAiGenerate } from "react-icons/ri";
import '../../App.css';
import CMGFile from '../../classes/cmgfile';
import TimeLine from '../../classes/timeline';
import Track from "../../classes/track";
import { Preset } from '../../types/soundfonttypes';
import GeneratorDialog from '../dialogs/generatordialog';
import GeneratorIcons from './generatoricons';

export interface TracksDisplayProps {
    fileContents: CMGFile,
    setFileContents: Function,
    timeLine: TimeLine,
    presets: Preset[],
    setMessage: Function,
    setStatus: Function
}

export default function TracksDisplay(props: TracksDisplayProps) {
    const { fileContents, setFileContents, setMessage, setStatus, timeLine, presets } = props;
    const [tracks, setTracks] = useState<Track[]>([]);
    const [deleteModal, setDeleteModal] = useState<boolean>(false);
    const [renameModal, setRenameModal] = useState<boolean>(false);
    const [trackName, setTrackName] = useState<string>('');
    const [enableGenerator, setEnableGenerator] = useState<boolean>(false);
    const trackRef = useRef<HTMLDivElement[]>([]);
    useEffect(() => {
        setTracks(fileContents.tracks);
        setStatus(`displayed ${fileContents.tracks.length} tracks`)
    }, [fileContents.tracks]);
    // useEffect(() => {
    //     trackRef.current = trackRef.current.slice(0, tracks.length);
    // }, [tracks, trackRef.current]);

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
        setFileContents((c: CMGFile) => {
            const newC: CMGFile = c.copy();
            newC.tracks.splice(thisIndex, 1);
            newC.dirty = true;
            return newC;
        });
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

    function handleRenameOK(event: MouseEvent<HTMLElement>): void {
        const trackName: string = event.currentTarget.id.split(':')[1];
        const renameElement: HTMLElement | null = document.getElementById("track-rename");
        if (!renameElement) return;
        const newName: string | null = renameElement.getAttribute("value");
        if (!newName) return;
        if (!validateNewName(newName)) {
            setMessage({ error: true, text: `'${newName}' is already being used or it is blank.` });
            return;
        }
        const thisIndex = fileContents.tracks.findIndex((t) => (t.name == trackName));
        if (thisIndex < 0) return;
        setFileContents((c: CMGFile) => {
            const newC: CMGFile = c.copy();
            newC.tracks[thisIndex].name = newName;
            newC.dirty = true;
            return newC;
        });
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
            setFileContents((c: CMGFile) => {
                const newC: CMGFile = c.copy();
                newC.tracks[thisIndex].mute = !newC.tracks[thisIndex].mute;
                newC.dirty = true;
                return newC;
            })
        }

    }

    function handleSoloTrack(event: MouseEvent<HTMLElement>): void {
        console.log(event.currentTarget.id);
        const trackName = event.currentTarget.id.split(':')[1];
        const thisIndex = fileContents.tracks.findIndex((t) => (t.name == trackName));
        if (thisIndex >= 0) {
            setFileContents((c: CMGFile) => {
                const newC: CMGFile = c.copy();
                newC.tracks[thisIndex].solo = !newC.tracks[thisIndex].solo;
                newC.dirty = true;
                return newC;
            })
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
    function handleAddGenerator(event: MouseEvent<HTMLElement>): void {
        console.log(event.currentTarget.id);
        setEnableGenerator(true);
    }

    return (
        <>
            {tracks.map((t, i) => (
                <>
                    <div className='page-track-control'
                        key={'track-control:' + t.name}

                    >
                        <button className='track-button'
                            id={'track-delete:' + t.name}
                            onClick={handleDeleteTrack}
                        >
                            <AiOutlineClose size={10} />
                        </button>
                        {t.name}
                        <button
                            style={{ float: 'right' }}
                            className='track-button'
                            id={'track-rename:' + t.name}
                            onClick={handleRenameTrack}
                        >
                            <CgRename />
                        </button>
                        <br />
                        <button className='track-button'
                            id={'track-mute:' + t.name}
                            onClick={handleMuteTrack}
                        >
                            {t.mute ? <AiFillMuted /> : <AiOutlineMuted />}
                        </button>

                        <button
                            className='track-button'
                            id={'track-gen:' + t.name}
                            onClick={handleAddGenerator}
                        >
                            <RiAiGenerate />
                        </button>
                        <button
                            style={{ float: 'right' }}
                            className='track-button'
                            id={'track-solo:' + t.name}
                            onClick={handleSoloTrack}
                        >
                            {t.solo ? <IoPerson /> : <IoPersonOutline />}
                        </button>
                        <br />
                        {/* <div className='slidercontainer'>
                            <label htmlFor={'track-volume:' + t.name}>
                                Volume
                            </label>
                            <input
                                className='slider'
                                type='range'
                                min='0'
                                max='100'
                                value={t.volume}
                                onChange={handleVolumeChange}
                                id={'track-volume:' + t.name}
                                name={'track-volume:' + t.name} />
                        </div>
                        <div
                            style={{ float: 'right' }}
                            className='slidercontainer'>
                            <label htmlFor={'track-pan:' + t.name}>
                                Pan
                            </label>
                            <input
                                className='slider'
                                type='range'
                                min='-1'
                                max='1'
                                value={t.pan}
                                onChange={handlePanChange}
                                id={'track-pan:' + t.name}
                                name={'track-pan:' + t.name} />
                        </div> */}
                    </div>
                    <div className='page-track-display'
                        key={'track-display:' + t.name}

                        ref={(el: HTMLDivElement) => trackRef.current[i] = el}>
                        {enableGenerator ?
                            <GeneratorDialog
                                setFileContents={setFileContents}
                                track={t}
                                setTracks={setTracks}
                                presets={presets}
                                generatorIndex={-1}
                                setMessage={setMessage}
                                setStatus={setStatus}
                                setEnableGenerator={setEnableGenerator}
                                setOpen={() => { }} />
                            : null}
                        {trackRef.current[i] ?
                            <GeneratorIcons
                                setFileContents={setFileContents}
                                track={t}
                                setTracks={setTracks}
                                presets={presets}
                                timeLine={timeLine}
                                element={trackRef.current[i]}
                                setMessage={setMessage}
                                setStatus={setStatus} />
                            : null}

                    </div>
                </>
            ))}
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
                <div className='modal-header'>
                    <span className='close'>&times;</span>
                    <h2>Enter new name for Track '{trackName}'</h2>
                </div>
                <div className="modal-body">
                    <label htmlFor='track-rename'>New Name:</label>
                    <input
                        name='track-rename'
                        id='track-rename'
                        type="text"
                        defaultValue={trackName}
                    />

                </div>
                <div className='modal-footer'>
                    <button
                        id={"track-delete:" + trackName}
                        onClick={handleRenameOK}
                    >OK</button>
                    <button
                        onClick={handleRenameCancel}
                    >Cancel</button>
                </div>
            </div>
        </>
    )
}
