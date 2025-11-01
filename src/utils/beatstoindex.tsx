import { SequenceItem } from "types";

export const beatsToIndex = (beat: number, items: SequenceItem[]) => {
  if (items.length == 0) return 0;
  let beatSum: number = 0;
  let itemIndex: number = -1;
  for (let i = 0; i < items.length && itemIndex < 0; i++) {
    if (items[i].beats + beatSum >= beat - 1) itemIndex = i;
    beatSum += items[i].beats;
    if (i == items.length - 1) itemIndex = items.length - 1;
  }
  return itemIndex;
};