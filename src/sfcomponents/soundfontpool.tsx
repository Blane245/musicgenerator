// maintain a sf file collection for algorithmic generators 
// each generfator may use a different soundfont file

import { SoundFont2 } from "soundfont2";
import { SoundFontItem } from "./types";
import { loadSoundFont } from "../utils/loadsoundfont";
const pool: SoundFontItem[] = [];
export async function SoundFontPool(desiredFile: string): Promise<SoundFont2> {
  const index = pool.findIndex(
    (s: {name: string}) => s.name == desiredFile
  );

  // if the file is in the pool, return the soundfont
  if (index >= 0) {
    return pool[index].soundFont;
  } else {

    // if the file is not in the pool put it there after loading it
    const sf:SoundFont2 = await loadSoundFont(desiredFile);
    pool.push({ name: desiredFile, soundFont: sf });
    return sf;
  }
}
