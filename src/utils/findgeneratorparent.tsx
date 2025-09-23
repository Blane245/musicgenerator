import CMGFile from "classes/cmgfile";
import Track from "classes/track";
import { GeneratorType } from "types";

// locate the track that owns this genertor
export default function findGeneratorParent (name: string, file: CMGFile): Track | null {
    let track: Track | null = null;
    file.tracks.forEach((t:Track) => {
        t.generators.forEach((g:GeneratorType) => {
            if (g.name == name) {
                track = t;
                return;
            }
        });
    });
    return track;
}