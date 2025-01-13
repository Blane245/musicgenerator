// get a uid for a generator that is different
// from all existing generators
import Track from "../classes/track";
export function getGeneratorUID(tracks: Track[]): number {
  let next = 0;
  let found = false;
  while (!found) {
    found =
      tracks.find((t) => {
        return t.generators.find((g) => g.name == "G".concat(next.toString()));
      }) == undefined;
    if (!found) next++;
  }
  return next;
}
