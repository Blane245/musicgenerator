import CMGFile from '../../classes/cmgfile'
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { loadSoundFont } from '../../utils/loadsoundfont';
import { VolumeControl } from "./audioplayerdisplay/volumecontrol";
import { BsFillFastForwardFill, BsFillPauseFill, BsFillPlayFill, BsFillRewindFill } from "react-icons/bs";
import { ProgressBar } from './audioplayerdisplay/progressbar';
import TimeLineDisplay from './timelinedisplay';
import { Generate } from '../generation/generate';
import { useCMGContext } from '../../contexts/cmgcontext';
import { setSoundFont } from '../../utils/cmfiletransactions';

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

    // load the soundfont file list at start up
    useEffect(() => {
        // const SFFiles = import.meta.glob("/src/soundfonts/*.(SF@|sf2)");
        const SFFiles = import.meta.glob("/src/newsoundfonts/*.(SF@|sf2)");
        const fileList: string[] = Object.keys(SFFiles);
        fileList.unshift('select a file'); // add select a file to the start of the list
        setSFFiles(fileList);
    }, []);

    useEffect(() => {
        if (fileContents)
            setSFFileName(fileContents.SFFileName);
    },[fileContents]);

    // control the generate button
    // only enabled when a soundfont file is defined and all generators have presets and midi numbers assigned
    // useEffect(() => {
    //     if (!fileContents) {
    //         setReadyGenerate(false);
    //         return;
    //     }
    //     fileContents.tracks.forEach((t:Track) => {
    //         t.generators.forEach((g: CMG) => {
    //             if (g.presetName == '' || !g.preset || g.midi < 0 || g.midi > 255) {
    //                 setReadyGenerate(false);
    //                 return;
    //             }
    //         })
    //     })
    //     setReadyGenerate(true);

    // }, [fileContents, SFFileName])

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

    const {
        currentTrack,
        audioRef,
        setDuration,
        duration,
        setTimeProgress,
        setCurrentTrack,
        progressBarRef,
        isPlaying,
        setIsPlaying,
    } = useCMGContext();
    const playAnimationRef = useRef<number | null>(null);
    useEffect(() => {
        setCurrentTrack("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
    }, [])

    const updateProgress = useCallback(() => {
        if (audioRef.current && progressBarRef.current && duration) {
            const currentTime = audioRef.current.currentTime;
            setTimeProgress(currentTime);

            progressBarRef.current.value = currentTime.toString();
            progressBarRef.current.style.setProperty(
                '--range-progress',
                `${(currentTime / duration) * 100}%`
            );
        }
    }, [duration, setTimeProgress, audioRef, progressBarRef]);

    const startAnimation = useCallback(() => {
        if (audioRef.current && progressBarRef.current && duration) {
            const animate = () => {
                updateProgress();
                playAnimationRef.current = requestAnimationFrame(animate);
            };
            playAnimationRef.current = requestAnimationFrame(animate);
        }
    }, [updateProgress, duration, audioRef, progressBarRef]);

    useEffect(() => {
        if (isPlaying) {
            audioRef.current?.play();
            startAnimation();
        } else {
            audioRef.current?.pause();
            if (playAnimationRef.current !== null) {
                cancelAnimationFrame(playAnimationRef.current);
                playAnimationRef.current = null;
            }
            updateProgress(); // Ensure progress is updated immediately when paused
        }

        return () => {
            if (playAnimationRef.current !== null) {
                cancelAnimationFrame(playAnimationRef.current);
            }
        };
    }, [isPlaying, startAnimation, updateProgress, audioRef]);

    const onLoadedMetadata = () => {
        const seconds = audioRef.current?.duration;
        if (seconds !== undefined) {
            setDuration(seconds);
            if (progressBarRef.current) {
                progressBarRef.current.max = seconds.toString();
            }
        }
    };

    const skipForward = () => {
        if (audioRef.current) {
            audioRef.current.currentTime += 15;
            updateProgress();
        }
    };

    const skipBackward = () => {
        if (audioRef.current) {
            audioRef.current.currentTime -= 15;
            updateProgress();
        }
    };

    const handleGenerate = () => {
        const newErrors:string[] = Generate(fileContents);

        if (newErrors.length != 0) {
            setErrors(newErrors);
            setShowError(true);
        }
        setStatus('audio file generated');
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
                    onClick={handleGenerate}>
                    Generate
                </button>
                <audio
                    src={currentTrack}
                    ref={audioRef}
                    onLoadedMetadata={onLoadedMetadata} />
                <button onClick={skipBackward}
                >
                    <BsFillRewindFill size={20} />
                </button>
                <button onClick={() => setIsPlaying((prev) => !prev)}
                >
                    {isPlaying ? (
                        <BsFillPauseFill size={20} />
                    ) : (
                        <BsFillPlayFill size={20} />
                    )}
                </button>
                <button onClick={skipForward}
                >
                    <BsFillFastForwardFill size={20} />
                </button>
                <ProgressBar />
                <VolumeControl />
            </div>
            <TimeLineDisplay            />
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
            
        </>
    )
}
