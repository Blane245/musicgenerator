import { useEffect, useState } from 'react';
import CMGFile from '../classes/cmgfile';
import TimeLine from '../classes/timeline';
import TracksDisplay from '../components/panels/tracksdisplay';
import { Preset } from '../types/soundfonttypes';

export interface BodyProps {
    setMessage: Function,
    setStatus: Function,
    fileContents: CMGFile,
    setFileContents: Function,
    timeLine: TimeLine,
}
export default function Body(props: BodyProps) {
    const { setMessage, setStatus, fileContents, setFileContents, timeLine } = props;
    const [presets, setPresets] = useState<Preset[]>([]);


    useEffect(() => {
        setMessage({ error: false, text: 'starting up' });
        setStatus('status area');
    }, []);

    // load the presets (bank and presets) for the soundfont file
    useEffect(() => {
        if (fileContents.SoundFont) {
            setPresets(fileContents.SoundFont.presets as Preset[]);
        }

    }, [fileContents.SoundFont])

    return (
        <div className='page-body'>
            <TracksDisplay
                fileContents={fileContents}
                setFileContents={setFileContents}
                timeLine={timeLine}
                presets={presets}
                setMessage={setMessage}
                setStatus={setStatus}
            />
        </div>
    )
}
