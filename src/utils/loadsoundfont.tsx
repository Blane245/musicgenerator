import { SoundFont2 } from 'soundfont2';

export async function loadSoundFont(fileName: string): Promise<SoundFont2> {
    const response = await fetch(fileName,
        {
            headers:
            {
                'Content-Type': 'application/octet-stream',
                'Accept': 'application/octet-stream'
            }
        })
    const data = await response.arrayBuffer();
    const array = new Uint8Array(data);
    const sf = new SoundFont2 (array);
    return sf;
        // .then((response) => {
        //     response.arrayBuffer()
        //         .then((data) => {
        //             const array = new Uint8Array(data);
        //             const sf = new SoundFont2(array);
        //             setSoundFont(sf);
        //         });
        // });
}
