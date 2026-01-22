// Update various parts of the CMGFile based
// various transactions within the system
import CMGFile from "classes/cmgfile";
import Control, {
  ControlType,
  GeneratorControl,
  TrackControl,
} from "classes/control";
import { CONTROLTYPE } from "classes/control";
import Compressor from "classes/roomnodes/compressor";
import Equalizer from "classes/roomnodes/equalizer";
import Reverb from "classes/roomnodes/reverb";
import Volume from "classes/roomnodes/volume";
import Track from "classes/track";
import { Dispatch, SetStateAction } from "react";
import { GeneratorType } from "types";

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

    // update the controls that mention this track
    nc.controls = renameDeleteControlList(
      CONTROLTYPE.Track,
      nc.tracks[index].name,
      "",
      nc.controls,
      nc,
    );

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

    // update the controls that mention this track
    nc.controls = renameDeleteControlList(
      CONTROLTYPE.Track,
      nc.tracks[index].name,
      newName,
      nc.controls,
      nc,
    );
    nc.tracks[index].name = newName;

    return nc;
  });
}

export function addControl(
  newControl: Control,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
) {
  setFileContents((c: CMGFile) => {
    const nc: CMGFile = c.copy();
    nc.dirty = true;
    nc.controls.push(newControl);
    nc.controls = nc.controls.sort((a: Control, b: Control) => a.time - b.time);
    return nc;
  });
}

export function deleteControl(
  index: number,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
) {
  setFileContents((c: CMGFile) => {
    const nc: CMGFile = c.copy();
    nc.dirty = true;
    nc.controls.splice(index, 1);
    nc.controls = nc.controls.sort((a: Control, b: Control) => a.time - b.time);
    return nc;
  });
}

export function renameControl(
  index: number,
  newName: string,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
) {
  setFileContents((c: CMGFile) => {
    const nc: CMGFile = c.copy();
    nc.dirty = true;
    nc.controls[index].name = newName;
    return nc;
  });
}
export function modifyControl(
  index: number,
  control: Control,
  setFileContents: Dispatch<SetStateAction<CMGFile>>,
) {
  setFileContents((c: CMGFile) => {
    const newC: CMGFile = c.copy();
    newC.controls[index] = control.copy();
    newC.dirty = true;
    return newC;
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
      console.log("track added", i, newTracks[newTracks.length - 1].name);
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

    // update the controls that mention this generator
    newF.controls = renameDeleteControlList(
      CONTROLTYPE.Generator,
      oldName,
      generator.name,
      newF.controls,
      newF,
    );
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

    // update the controls that mention this generator
    newF.controls = renameDeleteControlList(
      CONTROLTYPE.Generator,
      generator.name,
      "",
      newF.controls,
      newF,
    );

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

// rename or delete track or generator controls that reference them
// update those controls
function renameDeleteControlList(
  type: CONTROLTYPE,
  name: string,
  newName: string,
  controls: ControlType[],
  fileContents: CMGFile,
): ControlType[] {
  if (type == CONTROLTYPE.Track) {
    // delete or rename a track - update track lists that contain that name
    let newControls: ControlType[] = [];
    let deletedTrack: string = "";
    for (let i = 0; i < controls.length; i++) {
      if (controls[i].type != CONTROLTYPE.Track) newControls.push(controls[i]);
      else {
        const tControl: TrackControl = controls[i] as TrackControl;
        const tList: string[] = tControl.values.list;
        const newList: string[] = [];
        for (let j = 0; j < tList.length; j++) {
          
          if (tList[j] == name) {
            if (newName != "") {
              newList.push(newName);
            } else {
              deletedTrack = name;
            }
          } else newList.push(name);
        }
        tControl.values.list = newList;
        newControls.push(tControl);
      }
    }

    if (deletedTrack != "") {
      // all references to generators on the deleted track need to
      // be removed from generator controls.
      // Note there should only be one deleted track
      // get the list of generators that belong to this track
      // and remove them
      // Note: this is a recursive call this this routine
      const track: Track | undefined = fileContents.tracks.find(
        (t) => t.name == deletedTrack,
      );

      if (track != undefined) {
        const gens: GeneratorType[] = track.generators;
        for (let i = 0; i < gens.length; i++) {
          newControls = renameDeleteControlList(
            CONTROLTYPE.Generator,
            gens[i].name,
            "",
            newControls,
            fileContents,
          );
        }
      }
    }
    return newControls;

  } else if (type == CONTROLTYPE.Generator) {
    // delete or rename a generator - update generator lists that contain that name
    const newControls: ControlType[] = [];
    for (let i = 0; i < controls.length; i++) {
      if (controls[i].type != CONTROLTYPE.Generator)
        newControls.push(controls[i]);
      else {
        const gControl: GeneratorControl = controls[i] as GeneratorControl;
        const gList: string[] = gControl.values.list;
        const newList: string[] = [];
        for (let j = 0; j < gList.length; j++) {
          if (gList[j] == name) {
            if (newName != "") {
              newList.push(newName);
            } else {
              // generator name removed from the list
            }
          } else newList.push(name);
        }
        gControl.values.list = newList;
        newControls.push(gControl);
      }
    }
    return newControls;
  } else return controls;
}
