import { CMGeneratorType } from "../types/types";
import CMGFile from "../classes/cmgfile";
import Track from "../classes/track";
import { SoundFont2 } from "soundfont2";
import RoomReverb from "classes/roomreverb";
import Compressor from "classes/compressor";
import Equalizer from "classes/equalizer";

export function newFile(contents: CMGFile, setFileContents: Function): void {
  setFileContents(contents);
}
export function setSoundFont(
  fileName: string,
  sf: SoundFont2,
  setFileContents: Function
): void {
  setFileContents((c: CMGFile) => {
    if (c.SFFileName != fileName) {
      const newC: CMGFile = c.copy();
      newC.SFFileName = fileName;
      newC.SoundFont = sf;
      newC.dirty = true;
      return newC;
    } else return c;
  });
}

export function setDirty(
  state: boolean,
  fileContents: CMGFile,
  setFileContents: Function
) {
  if (fileContents.dirty != state) {
    setFileContents((c: CMGFile) => {
      const newC: CMGFile = c.copy();
      newC.dirty = state;
      return newC;
    });
  }
}

export function setRoomReverb (newReverb: RoomReverb, setFileContents: Function): void {
  setFileContents((c: CMGFile) => {
    const nc:CMGFile = c.copy();
    nc.dirty = true;
    nc.reverb = newReverb;
    return nc;
  });
}
  
export function setEqualizer(
  newEqualizer: Equalizer,
  setFileContents: Function
): void {
  setFileContents((c: CMGFile) => {
    const nc:CMGFile = c.copy();
    nc.dirty = true;
    nc.equalizer = newEqualizer;
    return nc;
  });
}

export function setCompressor(
  newCompressor: Compressor,
  setFileContents: Function
): void {
  setFileContents((c: CMGFile) => {
    const nc:CMGFile = c.copy();
    nc.dirty = true;
    nc.compressor = newCompressor;
    return nc;
  });
}

export function addTrack(newTrack: Track, setFileContents: Function) {
  setFileContents((c: CMGFile) => {
    c.dirty = true;
    c.tracks.push(newTrack);
    return c;
    // const newC: CMGFile = c.copy();
    // console.log(
    //   "new track being added",
    //   newTrack.name,
    //   "current track count",
    //   c.tracks.length
    // );
    // newC.tracks.push(newTrack);
    // newC.dirty = true;
    // return newC;
  });
}

export function deleteTrack(index: number, setFileContents: Function) {
  setFileContents((c: CMGFile) => {
    c.dirty = true;
    c.tracks.splice(index, 1);
    return c;
    // const newC: CMGFile = c.copy();
    // newC.tracks.splice(index, 1);
    // newC.dirty = true;
    // return newC;
  });
}

export function renameTrack(
  index: number,
  newName: string,
  setFileContents: Function
) {
  setFileContents((c: CMGFile) => {
    c.dirty = true;
    c.tracks[index].name = newName;
    return c;
    // const newC: CMGFile = c.copy();
    // newC.tracks[index].name = newName;
    // newC.dirty = true;
    // return newC;
  });
}

export function flipTrackAttrbute(
  index: number,
  attribute: string,
  setFileContents: Function
) {
  setFileContents((c: CMGFile) => {
    console.log('fliping track attribute', attribute);
    // if (attribute == "mute") {
    //   c.tracks[index].mute = !c.tracks[index].mute;
    // } else if (attribute == "solo") {
    //   c.tracks[index].solo = !c.tracks[index].solo;
    // } else return c;
    // c.dirty = true;
    // return c;
    const newC: CMGFile = c.copy();
    if (attribute == "mute") {
      newC.tracks[index].mute = !newC.tracks[index].mute;
    } else if (attribute == "solo") {
      newC.tracks[index].solo = !newC.tracks[index].solo;
    } else return newC;
    newC.dirty = true;
    return newC;
  });
}

export function moveTrack(
  trackName: string,
  direction: string,
  setFileContents: Function
) {
  setFileContents((prev: CMGFile) => {
    const newF: CMGFile = prev.copy();
    // for (let i = 0; i < newF.tracks.length; i++) {
    //     console.log(i, newF.tracks[i].name);
    // }
    const thisIndex: number = newF.tracks.findIndex((t) => t.name == trackName);
    // console.log('this index of track', trackName, thisIndex);
    if (thisIndex < 0) return prev;

    const dir: number = direction == "up" ? -1 : 1;

    const thatIndex: number = thisIndex + dir;
    // console.log('that index', thatIndex);
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
      console.log("track added", i, newTracks[newTracks.length - 1].name);
    }
    newF.tracks = newTracks;
    newF.dirty = true;
    return newF;
  });
}

export function addGenerator(
  track: Track,
  generator: CMGeneratorType,
  setFileContents: Function
) {
  setFileContents((prev: CMGFile) => {
    const newF: CMGFile = prev.copy();
    const thisTrack: Track | undefined = newF.tracks.find(
      (t) => t.name == track.name
    );
    if (!thisTrack) { 
        console.log(`add generator couldn't find track ${track.name} in file.`)
        return prev;
    }

    thisTrack.generators.push(generator.copy());
    newF.dirty = true;
    return newF;
  });
}

export function modifyGenerator(
  track: Track,
  generator: CMGeneratorType,
  oldName: string,
  setFileContents: Function
) {
  setFileContents((prev: CMGFile) => {
    const newF: CMGFile = prev.copy();
    const thisTrack: Track | undefined = newF.tracks.find(
      (t) => t.name == track.name
    );
    if (!thisTrack) { 
        console.log(`modify generator couldn't find track ${track.name} in file.`)
        return prev;
    }

    const newGIndex: number = thisTrack.generators.findIndex(
      (g) => g.name == oldName
    );
    if (newGIndex < 0) { 
        console.log(`modify generator couldn't find generator ${oldName} on track ${track.name} in file.`)
        return prev;
    }

    thisTrack.generators[newGIndex] = generator.copy();

    newF.dirty = true;
    return newF;
  });
}

export function deleteGenerator(
  track: Track,
  name: string,
  setFileContents: Function
) {
  setFileContents((prev: CMGFile) => {
    const newF: CMGFile = prev.copy();
    const thisTrack: Track | undefined = newF.tracks.find(
      (t) => t.name == track.name
    );
    if (!thisTrack) { 
        console.log(`delete generator couldn't find track ${track.name} in file.`)
        return prev;
    }
    const gIndex: number = thisTrack.generators.findIndex(
      (g) => g.name == name
    );
    if (gIndex < 0) { 
        console.log(`delete generator couldn't find generator ${name} on track ${track.name} in file.`)
        return prev;
    }

    thisTrack.generators.splice(gIndex, 1);
    newF.dirty = true;
    return newF;
  });
}

export function flipGeneratorMute(
  track: Track,
  index: number,
  setFileContents: Function
) {
  setFileContents((prev: CMGFile) => {
    const newF: CMGFile = prev.copy();
    const thisTrack: Track | undefined = newF.tracks.find(
      (t) => t.name == track.name
    );
    if (!thisTrack) return prev;

    const newG: CMGeneratorType = thisTrack.generators[index];
    newG.mute = !newG.mute;
    newF.dirty = true;
    return newF;
  });
}

export function moveGeneratorBodyPosition(
  track: Track,
  index: number,
  position: number,
  setFileContents: Function
) {
  setFileContents((prev: CMGFile) => {
    const newF: CMGFile = prev.copy();
    const thisTrack: Track | undefined = newF.tracks.find(
      (t) => t.name == track.name
    );
    if (!thisTrack) return prev;

    const newG: CMGeneratorType = thisTrack.generators[index];
    newG.position = position;
    newF.dirty = true;
    return newF;
  });
}

export function moveGeneratorTime(
  track: Track,
  index: number,
  mode: string,
  newValue: number,
  setFileContents: Function
) {
  setFileContents((prev: CMGFile) => {
    const newF: CMGFile = prev.copy();
    const thisTrack: Track | undefined = newF.tracks.find(
      (t) => t.name == track.name
    );
    if (!thisTrack) return prev;

    const newG: CMGeneratorType = thisTrack.generators[index];
    if (mode == "start") {
      newG.startTime = newValue;
    } else if (mode == "stop") {
      newG.stopTime = newValue;
    } else {
      return prev;
    }
    newF.dirty = true;
    return newF;
  });
}
