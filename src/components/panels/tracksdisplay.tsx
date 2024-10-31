import { useEffect, useRef, useState } from "react";
import '../../App.css';
import Track from "../../classes/track";
import GeneratorDialog from '../dialogs/generatordialog';
import GeneratorIcons from './generatoricons';
import { useCMGContext } from "../../contexts/cmgcontext";
import TrackControlsDisplay from "./trackcontrolsdisplay";
export default function TracksDisplay() {
    const { fileContents } = useCMGContext();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [enableGeneratorDialog, setEnableGeneratorDialog] = useState<number>(-1);
    const trackRef = useRef<HTMLDivElement[]>([]);

    useEffect(() => {
        setTracks(fileContents.tracks);
        setEnableGeneratorDialog(-1);
        console.log('tracks changed')
    }, [fileContents]);

    function closeTrackGenerator() {
        setEnableGeneratorDialog(-1);
    }

    return (
        <>
            {tracks
                .map((t, i) => {
                    // console.log('track', t.name, 'i', i); 
                    return (
                        <>
                            <TrackControlsDisplay
                                tracks={tracks}
                                track={t}
                                trackIndex={i}
                                setEnableGeneratorDialog={setEnableGeneratorDialog} />
                            <div className='page-track-display'
                                key={'track-display:' + t.name}
                                id={'track-display:' + t.name}
                                ref={(el: HTMLDivElement) => {trackRef.current[i] = el; return el}}
                            >
                                <GeneratorIcons
                                    track={t}
                                    trackIndex={i}
                                    elementRef={trackRef}
                                />
                            </div>
                        </>
                    )
                })}
            <GeneratorDialog
                track={tracks[enableGeneratorDialog]}
                generatorIndex={-1}
                setGeneratorIndex={() => { }}
                closeTrackGenerator={closeTrackGenerator}
                open={enableGeneratorDialog >= 0}
                setOpen={() => { setEnableGeneratorDialog(-1) }} />
        </>
    )
}
