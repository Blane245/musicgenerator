import { SoundFont2 } from "soundfont2";
import fetchData from "./fetchdata";

export async function loadSoundFont(fileName: string): Promise<SoundFont2> {
  const uri: string = "/soundfonts/get?name=".concat(fileName);
  const response: {
    list?: string[];
    file?: { type: string; data: number[] };
    error: boolean;
  } = await fetchData(uri, "GET");
  // const response = await fetch(fileName,
  //     {
  //         headers:
  //         {
  //             'Content-Type': 'application/octet-stream',
  //             'Accept': 'application/octet-stream'
  //         }
  //     })
  // const data = await response.arrayBuffer();
  if (response.file && !response.error) {
    const data: number[] = response.file.data;
    const array = new Uint8Array(data);
    const sf: SoundFont2 = new SoundFont2(array);
    return sf;
  } else return(new SoundFont2(new Uint8Array([])));
}
