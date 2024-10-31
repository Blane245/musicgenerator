import { useEffect } from 'react';
import { useCMGContext } from '../../contexts/cmgcontext';
import { Preset } from '../../types/soundfonttypes';
import TracksDisplay from '../panels/tracksdisplay';

export default function Body() {
    const { fileContents, setStatus, setPresets } =
        useCMGContext();


    useEffect(() => {
        // setMessage({ error: false, text: 'Welcome' });
        setStatus('');
    }, []);

    // load the presets (bank and presets) for the soundfont file
    useEffect(() => {
        if (fileContents.SoundFont) {
            setPresets(fileContents.SoundFont.presets as Preset[]);
        }

    }, [fileContents.SoundFont])

    return (
        <div className='page-body'>
            <TracksDisplay />
        </div>
    )
}
