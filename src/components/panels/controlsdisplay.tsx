import Track from 'classes/track';
import { ChangeEvent, useEffect, useState } from "react";
import { CMGeneratorType } from 'types/types';
import Generate from "../../components/generation/generate";
import { useCMGContext } from '../../contexts/cmgcontext';
import { setSoundFont } from '../../utils/cmfiletransactions';
import { loadSoundFont } from '../../utils/loadsoundfont';
import TimeLineDisplay from './timelinedisplay';

// display of the CGM file, its contents, and controls
// main controls
// SF File, Tempo, time Signature, Snap, Snap type, play buttons (reverse, fast forward, start, pause)
// time line

export default function ControlsDisplay() {
    const { fileContents, setFileContents, setStatus } =
        useCMGContext();

    const [SFfiles, setSFFiles] = useState<string[]>([]);
    const [SFFileName, setSFFileName] = useState<string>('');
    const [errors, setErrors] = useState<string[]>([]);
    const [showError, setShowError] = useState<boolean>(false);
    const [readyGenerate, setReadyGenerate] = useState<boolean>(true);
    const [mode, setMode] = useState<string>('');

    // load the soundfont file list at start up
    useEffect(() => {
        const SFFiles = import.meta.glob("/src/soundfonts/*.(SF@|sf2)");
        // const SFFiles = import.meta.glob("/src/newsoundfonts/*.(SF@|sf2)");
        const fileList: string[] = Object.keys(SFFiles);
        fileList.unshift('select a file'); // add select a file to the start of the list
        setSFFiles(fileList);
    }, []);

    useEffect(() => {
        if (fileContents)
            setSFFileName(fileContents.SFFileName);
    }, [fileContents]);

    // control the generate button
    // only enabled when a soundfont file is defined and all generators have presets and midi numbers assigned
    useEffect(() => {
        if (!fileContents) {
            setReadyGenerate(false);
            return;
        }
        if (fileContents.tracks.length == 0) {
            setReadyGenerate(false);
            return;
        }
        let goodGeneratorCount: number = 0;
        fileContents.tracks.forEach((t: Track) => {
            t.generators.forEach((g: CMGeneratorType) => {
                if (g.type != 'CMG') {
                    if (((g.type == 'SFPG' || g.type == 'SFRG') && g.presetName != '' && g.preset && g.midi >= 0 && g.midi <= 255) ||
                        g.type == 'Noise') {
                        goodGeneratorCount++;
                    }
                }
            })
        })
        if (goodGeneratorCount == 0) {
            setReadyGenerate(false);
            return;
        }
        setReadyGenerate(true);

    }, [fileContents, SFFileName])

    // load the SF when one is selected
    // TODO - any generators that have been selected from a previous soundfont file will be violated. This will have to be handled
    async function handleFileNameChange(event: ChangeEvent<HTMLSelectElement>) {
        const fileName: string = event.target.value;
        if (fileName !== '' && fileName !== 'select a file') {
            setSFFileName(fileName);
            const sf = await loadSoundFont(fileName);
            setSoundFont(fileName, sf, setFileContents);
            setStatus(`file ${fileName} loaded`);
        }
    }

    const handleErrorsClose = () => {
        setShowError(false);
    }

    return (
        <>
            <div className='page-control'>
                <label htmlFor="SFfile-select">SoundFont File:</label>
                <select
                    name="SFfile-select"
                    id="SFfile-select"
                    value={SFFileName}
                    onChange={(event) => handleFileNameChange(event)}
                >
                    {SFfiles.map((f) => (
                        <option key={"SF-" + f} value={f}>{f}</option>
                    ))}
                </select>
                <button
                    disabled={!readyGenerate}
                    onClick={() => setMode('recordfile')}>
                    Record
                </button>
                <button
                    disabled={!readyGenerate}
                    onClick={() => setMode('previewfile')}>
                    Preview
                </button>
            </div>
            <TimeLineDisplay />
            <div
                style={{ display: showError ? "block" : "none" }}
                className="modal-content"
            >
                <div className='modal-header'>
                    <span className='close' onClick={handleErrorsClose}>&times;</span>
                    <h2>Errors occurred during audio generation</h2>
                </div>
                <div className="modal-body">
                    {errors.map((e) => (
                        <p>{e}</p>
                    ))}
                </div>
                <div className='modal-footer'>
                    <button
                        id={'generator-error'}
                        onClick={handleErrorsClose}
                    >OK</button>
                </div>
            </div>
            {/* the generator ... */}
            {mode != '' ?
                <Generate
                    mode={mode}
                    setMode={setMode}
                    generator={null}
                />
                : null}

        </>
    )
}
