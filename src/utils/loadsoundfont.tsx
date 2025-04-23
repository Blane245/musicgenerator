// load a soundfont file from the server and
// place it in a SoundFont2 object
import { SoundFont2 } from "../soundfont2";
import fetchData from "./fetchdata";

export async function loadSoundFont(
  fileName: string,
  uri: string,
): Promise<SoundFont2> {
    const serverUri: string = uri.concat("/get?name=").concat(fileName);
    const response: {
      list?: string[];
      file?: { type: string; data: number[] };
      error: boolean;
    } = await fetchData(serverUri, "GET");
    if (response.file && !response.error) {
      const data: number[] = response.file.data;
      const array = new Uint8Array(data);
      const sf: SoundFont2 = new SoundFont2(array);
      return Promise.resolve(sf);
    } else return Promise.resolve(new SoundFont2(new Uint8Array([])));
}
