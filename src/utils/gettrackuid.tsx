// get a UID for a track is that different from all other exiting tracks
import Track from "../classes/track";
export function getTrackUID(tracks: Track[]): number {
  let next = 0;
  let found = false;
  while (!found) {
    found =
      tracks.find((t) => t.name == "T".concat(next.toString())) == undefined;
    if (!found) next++;
  }
  return next;
}
