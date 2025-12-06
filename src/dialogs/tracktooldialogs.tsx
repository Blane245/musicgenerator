import CMGFile from "classes/cmgfile";
import TimeLine from "classes/timeline";
import Track from "classes/track";
import { ChangeEvent, FormEvent, useState } from "react";
import { GeneratorType, TIMELINETYPE } from "types";
import {
  addTrack,
  modifyTrack,
  modifyTrackGenerators,
} from "utils/cmfiletransactions";
import { getGeneratorUID } from "utils/getgeneratoruid";
import { getTrackUID } from "utils/gettrackuid";

// provides the form fields and validators for the sfperiodic generator
export interface ToolsProps {
  fileContents: CMGFile;
  setFileContents: Function;
  timeLine: TimeLine | null;
  track: Track;
  enabled: Function;
}

// duplicate the given track once confirmation is received
export function TrackDuplicateDialog(props: ToolsProps): JSX.Element {
  const { fileContents, setFileContents, track, enabled } = props;

  function duplicate() {
    const newTrack: Track = track.copy();
    const newName: string = `T${getTrackUID(fileContents.tracks)}`;
    newTrack.name = newName;

    // as each new generator name is created, update it in the new track
    newTrack.generators.forEach((g: GeneratorType) => {
      const newGName: string = `G${getGeneratorUID([...fileContents.tracks, newTrack])}`;
      g.name = newGName;
    });
    addTrack(newTrack, setFileContents);
    enabled(false);
  }

  // ask the user to confirm that the track is to be duplcated
  return (
    <div className="modal-content">
      <div className="modal-header">
        <span className="close" onClick={()=>enabled(false)}>
          &times;
        </span>
        <h2>Confirm track duplication</h2>
      </div>
      <div className="modal-body">
        {`Press OK to confirm duplication of Track '${track.name}' or Cancel to abort duplication`}
      </div>
      <div className="modal-footer">
        <button onClick={()=>duplicate()}>OK</button>
        <button onClick={()=>enabled(false)}>Cancel</button>
      </div>
    </div>
  );
}

export function TrackShiftDialog(props: ToolsProps): JSX.Element {
  const { fileContents, setFileContents, timeLine, track, enabled } = props;
  const [error, setError] = useState<string>("");

  function onSubmit(event: FormEvent<Element>): void {
    event.preventDefault();
    const amount: number = parseFloat(event.target["amount"].value);
    const anError: string = validateShiftTrack(amount);
    if (anError != "") {
      setError(anError);
      return;
    }
    shiftTrack(amount);
    enabled(false);
  }

  // tracks cannot be shifted further left than time 0
  // shift will be in seconds or measures depending on the timeline mode
  function validateShiftTrack(amount: number): string {
    if (!timeLine) return "time line has not yet been defined";
    if (timeLine.mode == TIMELINETYPE.Measure && timeLine.measureSize == 0)
      return "The time line mode is measure and the length of a measure has not been set in Edit->Preferences.";
    let error: string = "";
    const units: string =
      timeLine.mode == TIMELINETYPE.Time ? "seconds" : "measures";
    track.generators.forEach((g: GeneratorType) => {
      const gStart: number =
        timeLine.mode == TIMELINETYPE.Time
          ? g.startTime
          : g.startTime / timeLine.measureSize;
      if (gStart + amount < 0) {
        error = `A shift of ${amount} would move generator's '${g.name} start time, which is currently ${gStart} (${units}) prior to zero`;
        return;
      }
    });
    return error;
  }

  function shiftTrack(amount: number): void {
    if (!timeLine) return;
    const timeAmount: number =
      timeLine.mode == TIMELINETYPE.Time
        ? amount
        : amount * timeLine.measureSize;
    const newGens: GeneratorType[] = [];
    const trackIndex: number = fileContents.tracks.findIndex(
      (t) => t.name == track.name
    );
    track.generators.forEach((g) => {
      const n: GeneratorType = g.copy(track);
      n.startTime = n.startTime + timeAmount;
      n.stopTime = n.stopTime + timeAmount;
      newGens.push(n);
    });
    modifyTrackGenerators(trackIndex, newGens, setFileContents);
    enabled(false);
  }

  // present a form for the user to identify the shift amount
  return (
    <div className="modal-content">
      <div className="modal-header">
        <span className="close" onClick={()=>enabled(false)}>
          &times;
        </span>
        <h2>Shift Generators in Track '{track.name}'</h2>
      </div>
      <div className="modal-body">
        <form onSubmit={(e)=>onSubmit(e)}>
          <label>
            Amount to shift track:&nbsp;
            <input type="number" name="amount" defaultValue={0} />
            <span>
              &nbsp;
              {timeLine && timeLine.mode == TIMELINETYPE.Time
                ? "(sec)"
                : "(measures)"}
            </span>
          </label>
          <br/>
          <input type="submit" value="Shift" />
          <button
          type='button'
            onClick={() => enabled(false)}
            style={{
              color: "ButtonText",
              backgroundColor: "ButtonFace",
              fontSize: "12px",
              paddingLeft: "6px",
              paddingTop: "1px",
              paddingRight: "6px",
              paddingBottom: "1px",
              border: "3.333",
            }}
          >
            Cancel
          </button>
        </form>
      </div>
      <div className="modal-footer">{error}</div>
    </div>
  );
}

export function TrackVolumeDialog(props: ToolsProps): JSX.Element {
  const { fileContents, setFileContents, track, enabled } = props;
  const [error, setError] = useState<string>("");
  const [value, setValue] = useState<number>(track.volume);

  function onSubmit(event: FormEvent<Element>): void {
    event.preventDefault();
    const amount: number = parseFloat(event.target["amount"].value);
    const error: string = validateVolume(amount);
    if (error != "") {
      setError(error);
      return;
    }
    volumeTrack(amount);
    enabled(false);
  }

  function validateVolume(_amount: number): string {
    return "";
  }

  function volumeTrack(amount: number): void {
    const n: Track = track.copy();
    n.volume = amount;
    modifyTrack(
      fileContents.tracks.findIndex((t) => (t.name == track.name)),
      n,
      setFileContents
    );
    enabled(false);
  }
  function onAmountChange(e: ChangeEvent<HTMLInputElement>) {
    setValue(parseFloat(e.target.value));
  }

  return (
    <div className="modal-content">
      <div className="modal-header">
        <span className="close" onClick={()=>enabled(false)}>
          &times;
        </span>
        <h2>Set Volume for Track '{track.name}'</h2>
      </div>
      <div className="modal-body">
        <form onSubmit={(e)=>onSubmit(e)}>
          <label>
            Volume Level (dB):&nbsp;
            <input type="range" name="amount" 
            defaultValue={track.volume} 
            min={-10}
            step={1}
            max={10}
            onChange={(e) => onAmountChange(e)}
            />
            <span>
              &nbsp;
              {value}
            </span>
            <br/>
          </label>
          <input type="submit" value="Set" />
          <button
          type='button'
            onClick={() => enabled(false)}
            style={{
              color: "ButtonText",
              backgroundColor: "ButtonFace",
              fontSize: "12px",
              paddingLeft: "6px",
              paddingTop: "1px",
              paddingRight: "6px",
              paddingBottom: "1px",
              border: "3.333",
            }}
          >
            Cancel
          </button>
        </form>
      </div>
      <div className="modal-footer">{error}</div>
    </div>
  )
}
