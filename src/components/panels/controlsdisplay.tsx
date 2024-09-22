import CGMFile from '../../classes/cgmfile'
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { SoundFont2 } from "soundfont2";
import { loadSoundFont } from "../../utils/loadsoundfont";
import { useAudioPlayerContext } from "./audioplayercontext";
import { VolumeControl } from "./audioplayerdisplay/volumecontrol";
import { BsFillFastForwardFill, BsFillPauseFill, BsFillPlayFill, BsFillRewindFill } from "react-icons/bs";
import { ProgressBar } from './audioplayerdisplay/progressbar';
import TimeLine from '../../classes/timeline';
import TimeLineDisplay from './timelinedisplay';
export interface ControlsDisplayProps {
    fileContents: CGMFile | null,
    setFileContents: Function,
    timeLine: TimeLine,
    setTimeLine: Function,
    setMessage: Function,
    setStatus: Function,
}

// display of the CGM file, its contents, and controls
// main controls
// SF File, Tempo, time Signature, Snap, Snap type, play buttons (reverse, fast forward, start, pause)
// time line

export default function ControlsDisplay(props: ControlsDisplayProps) {
    const { fileContents, setFileContents, timeLine, setTimeLine, setMessage, setStatus } = props;

    const [SFfiles, setSFFiles] = useState<string[]>([]);
    const [SFFileName, setSFFileName] = useState<string>('');

    // load the soundfont file list at start up
    useEffect(() => {
        const SFFiles = import.meta.glob("/src/soundfonts/*.(SF@|sf2)");
        const fileList: string[] = Object.keys(SFFiles);
        fileList.unshift('select a file'); // add select a file to the start of the list
        setSFFiles(fileList);

    }, []);

    // load the SF when one is selected
    function handleFileNameChange(event: ChangeEvent<HTMLSelectElement>): void {
        const fileName: string = event.target.value;
        function setSF(SF: SoundFont2): void {
            setFileContents((c: CGMFile) => {
                const newC: CGMFile = c.copy();
                newC.SFFileName = fileName;
                newC.SoundFont = SF;
                newC.dirty = true;
                return newC;
            })
        }
        if (fileName !== '' && fileName !== 'select a file') {
            setSFFileName(fileName);
            loadSoundFont(fileName, setSF);
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
    } = useAudioPlayerContext();
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

    //TODO this will convert the current tracks into a mpg file
    const generate = () => {
        setStatus('audio file generated');
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
                    disabled={fileContents == null}
                >
                    {SFfiles.map((f) => (
                        <option key={"SF-" + f} value={f}>{f}</option>
                    ))}
                </select>
                <button
                    disabled={fileContents != null}
                    onClick={generate}>
                    Generate
                </button>
                <audio
                    src={currentTrack}
                    ref={audioRef}
                    onLoadedMetadata={onLoadedMetadata} />
                <button onClick={skipBackward}
                    disabled={fileContents != null}
                >
                    <BsFillRewindFill size={20} />
                </button>
                <button onClick={() => setIsPlaying((prev) => !prev)}
                    disabled={fileContents != null}
                >
                    {isPlaying ? (
                        <BsFillPauseFill size={20} />
                    ) : (
                        <BsFillPlayFill size={20} />
                    )}
                </button>
                <button onClick={skipForward}
                    disabled={fileContents != null && fileContents.tracks.length == 0}
                >
                    <BsFillFastForwardFill size={20} />
                </button>
                <ProgressBar fileContents={fileContents} />
                <VolumeControl fileContents={fileContents} />
            </div>
            <TimeLineDisplay
                setMessage={setMessage}
                setStatus={setStatus}
                setTimeLine={setTimeLine}
                timeLine={timeLine} />
        </>
    )
}
