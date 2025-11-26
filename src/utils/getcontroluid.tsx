// get a uid for a generator that is different
// from all existing generators
import { Control } from "classes/control";
export function getControlUID(controls: Control[]): number {
  let next = 0;
  let foundHole: boolean = false;
  while (!foundHole) {
    foundHole =
      controls.findIndex((c) => c.name == "C".concat(next.toString())) < 0;
    if (!foundHole) next++;
  }
  return next;
}
