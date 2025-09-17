// maintain a sf file collection for algorithmic generators
// each generfator may use a different soundfont file

import { SoundFont2 } from "../soundfont2";
import { SFPromiseType } from "../types";
import { loadSoundFont } from "../utils/loadsoundfont";
import { SoundFontItem } from "./types";
const pool: SoundFontItem[] = [];
export async function SFPool(
  desiredFile: string
): Promise<SFPromiseType> {
  const index = pool.findIndex((s: { name: string }) => s.name == desiredFile);

  // if the file is in the pool, return the soundfont
  if (index >= 0) {
    return Promise.resolve({
      name: desiredFile,
      soundFont: pool[index].soundFont,
    });
  } else {
    // if the file is not in the pool put it there after loading it
    try {
      const sf: SoundFont2 = await loadSoundFont(desiredFile);
      pool.push({ name: desiredFile, soundFont: sf });
      return Promise.resolve({ name: desiredFile, soundFont: sf });
    } catch (e: any) {
      throw new Error(e);
    }
  }
}
