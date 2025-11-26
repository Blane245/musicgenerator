// Update various parts of the CMGFile based
// various transactions within the system
import CMGFile from "classes/cmgfile";
import { Control, EFFECTTYPE } from "classes/control";
import Compressor from "classes/roomnodes/compressor";
import Equalizer from "classes/roomnodes/equalizer";
import Reverb from "classes/roomnodes/reverb";
import Volume from "classes/roomnodes/volume";
import Track from "classes/track";
import { GeneratorType } from "types";

export function newFile(contents: CMGFile, setFileContents: Function): void {
  setFileContents(contents);
}

export function setFileComment(
  comment: string,
  setFileContents: Function
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

export function setEqualizer(
  newEqualizer: Equalizer,
  setFileContents: Function
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
  setFileContents: Function
): void {
  setFileContents((c: CMGFile) => {
    const nc: CMGFile = c.copy();
    nc.dirty = true;
    nc.compressor = newCompressor;
    return nc;
  });
}

export function setReverb(newReverb: Reverb, setFileContents: Function): void {
  setFileContents((c: CMGFile) => {
    const nc: CMGFile = c.copy();
    nc.dirty = true;
    nc.reverb = newReverb;
    return nc;
  });
}

export function setVolume(newVolume: Volume, setFileContents: Function): void {
  setFileContents((c: CMGFile) => {
    const nc: CMGFile = c.copy();
    nc.dirty = true;
    nc.volume = newVolume;
    return nc;
  });
}

export function addTrack(newTrack: Track, setFileContents: Function) {
  setFileContents((c: CMGFile) => {
    const nc: CMGFile = c.copy();
    nc.dirty = true;
    nc.tracks.push(newTrack);
    return nc;
  });
}

export function deleteTrack(index: number, setFileContents: Function) {
  setFileContents((c: CMGFile) => {
    const nc: CMGFile = c.copy();

    // update the controls that mention this generator
    nc.controls = renameDeleteControlList (EFFECTTYPE.Generator, nc.tracks[index].name, "", nc.controls);

    nc.dirty = true;
    nc.tracks.splice(index, 1);
    return nc;
  });
}

export function renameTrack(
  index: number,
  newName: string,
  setFileContents: Function
) {
  setFileContents((c: CMGFile) => {
    const nc: CMGFile = c.copy();
    nc.dirty = true;

    // update the controls that mention this generator
    nc.controls = renameDeleteControlList (EFFECTTYPE.Generator, nc.tracks[index].name, newName, nc.controls);
    nc.tracks[index].name = newName;


    return nc;
  });
}

export function addControl (newControl: Control, setFileContents: Function) {
    setFileContents((c: CMGFile) => {
    const nc: CMGFile = c.copy();
    nc.dirty = true;
    nc.controls.push(newControl);
    nc.controls = nc.controls.sort((a:Control, b:Control)=> a.time - b.time)
    return nc;
  });
}

export function deleteControl (index: number, setFileContents: Function) {
    setFileContents((c: CMGFile) => {
    const nc: CMGFile = c.copy();
    nc.dirty = true;
    nc.controls.splice(index, 1);
    nc.controls = nc.controls.sort((a:Control, b:Control)=> a.time - b.time)
    return nc;
  });

}

export function renameControl (index: number, newName: string, setFileContents: Function) {
    setFileContents((c: CMGFile) => {
    const nc: CMGFile = c.copy();
    nc.dirty = true;
    nc.controls[index].name = newName;
    return nc;
  });

}
export function modifyControl(index: number, control: Control, setFileContents: Function) {
  setFileContents((c:CMGFile)=> {
    const newC: CMGFile = c.copy();
    newC.controls[index] = control.copy();
    newC.dirty = true;
    return newC;
  })

}

export function modifyTrackGenerators (index: number, gens: GeneratorType[], setFileContents: Function) {
  setFileContents((c: CMGFile) => {
    const nc: CMGFile = c.copy();
    nc.tracks[index].generators = [...gens];
    nc.dirty = true;
    return nc;
  })  
}

export function flipTrackAttribute(
  index: number,
  attribute: string,
  setFileContents: Function
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

export function modifyTrack(index: number, track: Track, setFileContents: Function) {  
  setFileContents((c:CMGFile)=> {
    const newC: CMGFile = c.copy();
    newC.tracks[index] = track;
    newC.dirty = true;
    return newC
  });
}

export function moveTrack(
  trackName: string,
  direction: string,
  setFileContents: Function
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
      console.log("track added", i, newTracks[newTracks.length - 1].name);
    }
    newF.tracks = newTracks;
    newF.dirty = true;
    return newF;
  });
}

export function addGenerator(
  track: Track,
  generator: GeneratorType,
  setFileContents: Function
) {
  setFileContents((prev: CMGFile) => {
    const newF: CMGFile = prev.copy();
    const thisTrack: Track | undefined = newF.tracks.find(
      (t) => t.name == track.name
    );
    if (!thisTrack) {
      console.log(`add generator couldn't find track ${track.name} in file.`);
      return prev;
    }

    thisTrack.generators.push(generator.copy());
    newF.dirty = true;
    return newF;
  });
}

export function modifyGenerator(
  track: Track,
  generator: GeneratorType,
  oldName: string,
  setFileContents: Function
) {
  setFileContents((prev: CMGFile) => {
    const newF: CMGFile = prev.copy();
    const thisTrack: Track | undefined = newF.tracks.find(
      (t) => t.name == track.name
    );
    if (!thisTrack) {
      console.log(
        `modify generator couldn't find track ${track.name} in file.`
      );
      return prev;
    }

    const newGIndex: number = thisTrack.generators.findIndex(
      (g) => g.name == oldName
    );
    if (newGIndex < 0) {
      console.log(
        `modify generator couldn't find generator ${oldName} on track ${track.name} in file.`
      );
      return prev;
    }

    // update the controls that mention this generator
    newF.controls = renameDeleteControlList (EFFECTTYPE.Generator, oldName, thisTrack.generators[newGIndex].name, newF.controls);
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
      console.log(
        `delete generator couldn't find track ${track.name} in file.`
      );
      return prev;
    }
    const gIndex: number = thisTrack.generators.findIndex(
      (g) => g.name == name
    );
    if (gIndex < 0) {
      console.log(
        `delete generator couldn't find generator ${name} on track ${track.name} in file.`
      );
      return prev;
    }

    // update the controls that mention this generator
    newF.controls = renameDeleteControlList (EFFECTTYPE.Generator, thisTrack.generators[gIndex].name, "", newF.controls);

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
  setFileContents: Function
) {
  setFileContents((prev: CMGFile) => {
    const newF: CMGFile = prev.copy();
    const thisTrack: Track | undefined = newF.tracks.find(
      (t) => t.name == track.name
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
  setFileContents: Function
) {
  setFileContents((prev: CMGFile) => {
    const newF: CMGFile = prev.copy();
    const thisTrack: Track | undefined = newF.tracks.find(
      (t) => t.name == track.name
    );
    if (!thisTrack) return prev;
    const newG: GeneratorType = thisTrack.generators[index];
    const dT: number = newG.stopTime - newG.startTime;
    if (edge == 'start') {
    newG.startTime = newValue;
    newG.stopTime = newValue + dT;
    } else {
      newG.stopTime = newValue;
      newG.startTime = newValue - dT;
    }
    newF.dirty = true;
    return newF;
  });
}

// rename or delete track or generator affects controls that reference them
// update those controls
function renameDeleteControlList (type: EFFECTTYPE, name: string, newName: string, controls: Control[]): Control[] {
  const newControls: Control[] = [...controls];
  newControls.forEach((control) => {
    if (control.type == type && control.list) {
      const newList:string[] = [];
      control.list.forEach((item)=> {
        if (item == name) { // rename or delete
          if (newName != "") newList.push(newName);
        } else { // keep as is
          newList.push(item);
        }
      });
      control.list = [...newList];
    }
  });
  return newControls;
}
