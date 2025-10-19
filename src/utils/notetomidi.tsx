// convert a note string into a midi number.
// if the pattern doesn't match, return -1;
const notePattern: RegExp = /([A-G,a-g])([#,b]?)(\d)([+-]\d\d)?/;
export default function noteToMidi(note: string): number {
  const match: RegExpExecArray | null = notePattern.exec(note);
  if (!match || match.length < 5) return -1;
  const noteName: string = match[1].toUpperCase();;
  let accidentalPart: string = match[2];
  let octavePart: string = match[3];
  const centsPart = match[4];
  let midi: number | undefined = {"C":0, "D":2, "E":4, "F":5, "G":7, "A":9, "B":11}[noteName];
  if (midi == undefined) return -1;
  if (accidentalPart == "#") midi++;
  else if (accidentalPart == "b") midi--;
  midi += (parseInt(octavePart) + 1) * 12;
  if (centsPart != undefined) midi += parseInt(centsPart)/ 100;
  return midi;
}
