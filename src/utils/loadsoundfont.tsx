import { SoundFont2 } from 'soundfont2';

export function loadSoundFont(fileName: string, setSoundFont: Function): void {
    fetch(fileName,
        {
            headers:
            {
                'Content-Type': 'application/octet-stream',
                'Accept': 'application/octet-stream'
            }
        })
        .then((response) => {
            response.arrayBuffer()
                .then((data) => {
                    const array = new Uint8Array(data);
                    const sf = new SoundFont2(array);
                    setSoundFont(sf);
                });
        });
}
