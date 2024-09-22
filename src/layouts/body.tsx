import { useEffect, useState } from 'react';
import { SoundFont2 } from 'soundfont2';
import { Preset } from '../types/soundfonttypes';
import CGMFile from '../classes/cgmfile';
import TracksDisplay from '../components/panels/tracksdisplay';
import TimeLine from '../classes/timeline';

export interface BodyProps {
    setMessage: Function,
    setStatus: Function,
    fileContents: CGMFile | null,
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
        if (fileContents && fileContents.SoundFont) {
            setPresets(fileContents.SoundFont.presets as Preset[]);
        }
        
    }, [fileContents])

    return (
        <div className='page-body'>
            {fileContents ?
                    <TracksDisplay
                        fileContents={fileContents}
                        setFileContents={setFileContents}
                        timeLine={timeLine}
                        presets={presets}
                        setMessage={setMessage}
                        setStatus={setStatus}
                         />
                : null}
        </div>
    )
}
