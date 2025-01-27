// converted from https://github.com/dbkaplun/euclidean-rhythm.git
export function euclideanRhythm(onNotes: number, totalNotes: number): number[] {
  let groups: number[][] = [];
  for (let i = 0; i < totalNotes; i++) groups.push([i < onNotes ? 1 : 0]);

  let l: number;
  while ((l = groups.length - 1)) {
    let start: number = 0;
    const first: number[] = groups[0];
    while (start < l && compareArrays(first, groups[start])) start++;
    if (start === l) break;

    let end: number = l;
    const last: number[] = groups[l];
    while (end > 0 && compareArrays(last, groups[end])) end--;
    if (end === 0) break;

    const count:number = Math.min(start, l - end);
    groups = groups
      .slice(0, count)
      .map((group: number[], i: number) => group.concat(groups[l - i]))
      .concat(groups.slice(count, -count));
  }
  // ts had trouble with this statement
  // return [].concat.apply([], groups);
  return groups.flat(1);
}

function compareArrays(a: number[], b: number[]) {
  return (
    a.length === b.length &&
    a.every((value: number, index: number) => value === b[index])
  );
  // return JSON.stringify(a) === JSON.stringify(b);
}
