// load a soundfont file from the server and
// place it in a SoundFont2 object
import { Buffer } from "buffer";
import { FSResponse, SFFILELOCATION } from "types";
import { SoundFont2 } from "../soundfont2";
import {fetchFSData} from "./fetchdata";

export async function loadSoundFont(fileName: string): Promise<SoundFont2> {
  const fullName: string = window.localStorage.getItem(SFFILELOCATION)+'/'+fileName;
  const uri: string = `/file/read?name=${fullName}`;
  const response: FSResponse = await fetchFSData(uri, "GET");
  if (response && response.file && !response.error) {
    const data: Buffer = response.file.data;
    const array: Uint8Array = Uint8Array.from(data);
    const sf: SoundFont2 = new SoundFont2(array);
    return Promise.resolve(sf);
  } else 
    throw new Error(`Soundfont file ${fullName} not found`);
}
