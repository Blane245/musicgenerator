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
    const { fileContents, setFileContents, setStatus, playing } =
        useCMGContext();

    const [SFfiles, setSFFiles] = useState<string[]>([]);
    const [SFFileName, setSFFileName] = useState<string>('');
    const [readyGenerate, setReadyGenerate] = useState<boolean>(true);
    const [mode, setMode] = useState<string>('');
    const [showStop, setShowStop] = useState<boolean>(false);

    useEffect(() => {
        if (playing.current) {
            setShowStop(playing.current.on)
        }
    }, [playing.current?.on])
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
                <button
                    hidden={!showStop}
                    onClick={() => {if (playing.current) playing.current.on = false }}>
                    Stop
                </button>
            </div>
            <TimeLineDisplay />
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
