// Update various parts of the CMGFile based
// various transactions within the system
import CMGFile from "classes/cmgfile";
import Compressor from "classes/roomnodes/compressor";
import Equalizer from "classes/roomnodes/equalizer";
import Reverb from "classes/roomnodes/reverb";
import Volume from "classes/roomnodes/volume";
import Track from "classes/track";
import { Dispatch, SetStateAction } from "react";
import { GeneratorType } from "types";
import { debug } from "./debug";

export function newFile(
  contents: CMGFile,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
): void {
  setFileContents(contents);
}

export function setFileComment(
  comment: string,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
): void {
  setFileContents((prev: CMGFile) => {
    const n: CMGFile = prev.copy();
    n.comment = comment;
    n.dirty = true;
    return n;
  });
}

export function setDirty(
  state: boolean,
  fileContents: CMGFile,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
) {
  if (fileContents.dirty != state) {
    setFileContents((c: CMGFile) => {
      const newC: CMGFile = c.copy();
      newC.dirty = state;
      return newC;
    });
  }
}

export function setEqualizer(
  newEqualizer: Equalizer,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
): void {
  setFileContents((c: CMGFile) => {
    const nc: CMGFile = c.copy();
    nc.dirty = true;
    nc.equalizer = newEqualizer;
    return nc;
  });
}

export function setCompressor(
  newCompressor: Compressor,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
): void {
  setFileContents((c: CMGFile) => {
    const nc: CMGFile = c.copy();
    nc.dirty = true;
    nc.compressor = newCompressor;
    return nc;
  });
}

export function setReverb(
  newReverb: Reverb,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
): void {
  setFileContents((c: CMGFile) => {
    const nc: CMGFile = c.copy();
    nc.dirty = true;
    nc.reverb = newReverb;
    return nc;
  });
}

export function setVolume(
  newVolume: Volume,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
): void {
  setFileContents((c: CMGFile) => {
    const nc: CMGFile = c.copy();
    nc.dirty = true;
    nc.volume = newVolume;
    return nc;
  });
}

export function addTrack(
  newTrack: Track,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
) {
  setFileContents((c: CMGFile) => {
    const nc: CMGFile = c.copy();
    nc.dirty = true;
    nc.tracks.push(newTrack);
    return nc;
  });
}

export function deleteTrack(
  index: number,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
) {
  setFileContents((c: CMGFile) => {
    const nc: CMGFile = c.copy();
    nc.dirty = true;
    nc.tracks.splice(index, 1);
    return nc;
  });
}

export function renameTrack(
  index: number,
  newName: string,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
) {
  setFileContents((c: CMGFile) => {
    const nc: CMGFile = c.copy();
    nc.dirty = true;
    nc.tracks[index].name = newName;
    return nc;
  });
}

export function modifyTrackGenerators(
  index: number,
  gens: GeneratorType[],
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
) {
  setFileContents((c: CMGFile) => {
    const nc: CMGFile = c.copy();
    nc.tracks[index].generators = [...gens];
    nc.dirty = true;
    return nc;
  });
}

export function flipTrackAttribute(
  index: number,
  attribute: string,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
) {
  setFileContents((c: CMGFile) => {
    const newC: CMGFile = c.copy();
    if (attribute == "mute") {
      newC.tracks[index].mute = !newC.tracks[index].mute;
    } else if (attribute == "solo") {
      newC.tracks[index].solo = !newC.tracks[index].solo;
    } else return c;
    newC.dirty = true;
    return newC;
  });
}

export function modifyTrack(
  index: number,
  track: Track,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
) {
  setFileContents((c: CMGFile) => {
    const newC: CMGFile = c.copy();
    newC.tracks[index] = track;
    newC.dirty = true;
    return newC;
  });
}

export function moveTrack(
  trackName: string,
  direction: string,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
) {
  setFileContents((prev: CMGFile) => {
    const newF: CMGFile = prev.copy();
    const thisIndex: number = newF.tracks.findIndex((t) => t.name == trackName);
    if (thisIndex < 0) return prev;

    const dir: number = direction == "up" ? -1 : 1;

    const thatIndex: number = thisIndex + dir;
    if (thatIndex < 0 || thatIndex > newF.tracks.length - 1) return prev;

    const newTracks: Track[] = [];
    for (let i = 0; i < newF.tracks.length; i++) {
      if (i == thisIndex) {
        newTracks.push(newF.tracks[thatIndex]);
      } else if (i == thatIndex) {
        newTracks.push(newF.tracks[thisIndex]);
      } else {
        newTracks.push(newF.tracks[i]);
      }
      debug.info("moveTrack: track added", i, newTracks[newTracks.length - 1].name);
    }
    newF.tracks = newTracks;
    newF.dirty = true;
    return newF;
  });
}

function findGeneratorParent(
  generator: GeneratorType,
  fileContents: CMGFile,
): Track {
  const trackIndex: number = fileContents.tracks.findIndex(
    (t: Track) => generator.parent.name == t.name,
  );
  if (trackIndex < 0)
    throw new Error(
      `Add generator '${generator.name}' parent '${generator.parent.name}' could not be located`,
    );
  return fileContents.tracks[trackIndex];
}
function findGeneratorIndex(track: Track, name: string): number {
  const index: number = track.generators.findIndex((g) => g.name == name);
  if (index < 0) {
    throw new Error(
      `Generator couldn't find generator '${name}' on track '${track.name}' in file.`,
    );
  }
  return index;
}
export function addGenerator(
  generator: GeneratorType,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
) {
  setFileContents((prev: CMGFile) => {
    const newF: CMGFile = prev.copy();
    const track: Track = findGeneratorParent(generator, newF);
    track.generators.push(generator);
    newF.dirty = true;
    return newF;
  });
}

export function modifyGenerator(
  generator: GeneratorType,
  oldName: string,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
) {
  setFileContents((prev: CMGFile) => {
    const newF: CMGFile = prev.copy();
    const track: Track = findGeneratorParent(generator, newF);
    const index: number = findGeneratorIndex(track, oldName);
    track.generators[index] = generator;
    newF.dirty = true;
    return newF;
  });
}

export function deleteGenerator(
  generator: GeneratorType,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
) {
  setFileContents((prev: CMGFile) => {
    const newF: CMGFile = prev.copy();
    const track: Track = findGeneratorParent(generator, newF);
    const index: number = findGeneratorIndex(track, generator.name);
    track.generators.splice(index, 1);
    newF.dirty = true;
    return newF;
  });
}

export function flipGeneratorMute(
  track: Track,
  index: number,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
) {
  setFileContents((prev: CMGFile) => {
    const newF: CMGFile = prev.copy();
    const thisTrack: Track | undefined = newF.tracks.find(
      (t) => t.name == track.name,
    );
    if (!thisTrack) return prev;

    const newG: GeneratorType = thisTrack.generators[index];
    newG.mute = !newG.mute;
    newF.dirty = true;
    return newF;
  });
}

export function moveGeneratorBodyPosition(
  track: Track,
  index: number,
  position: number,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
) {
  setFileContents((prev: CMGFile) => {
    const newF: CMGFile = prev.copy();
    const thisTrack: Track | undefined = newF.tracks.find(
      (t) => t.name == track.name,
    );
    if (!thisTrack) return prev;

    const newG: GeneratorType = thisTrack.generators[index];
    newG.position = position;
    newF.dirty = true;
    return newF;
  });
}

export function moveGeneratorTime(
  track: Track,
  index: number,
  newValue: number,
  edge: string,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
) {
  setFileContents((prev: CMGFile) => {
    const newF: CMGFile = prev.copy();
    const thisTrack: Track | undefined = newF.tracks.find(
      (t) => t.name == track.name,
    );
    if (!thisTrack) return prev;
    const newG: GeneratorType = thisTrack.generators[index];
    if (edge == "start") {
      newG.startTime = newValue;
    } else {
      newG.stopTime = newValue;
    }
    newF.dirty = true;
    return newF;
  });
}
