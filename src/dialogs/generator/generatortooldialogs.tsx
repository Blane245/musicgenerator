import CMGFile from "classes/cmgfile";
import TimeLine from "classes/timeline";
import Track from "classes/track";
import { ChangeEvent, Dispatch, FormEvent, SetStateAction, useEffect, useState } from "react";
import { GeneratorType, TIMELINETYPE } from "types";

function extractTrackGenerator(
  source: string,
  file: CMGFile
): { error: string; generatorTrack?: GeneratorTrack | undefined } {
  const sourcetg: string[] = source.split("@");
  const track: Track | undefined = file.tracks.find(
    (t) => t.name == sourcetg[0]
  );
  if (track == undefined) {
    return { error: `Track '${sourcetg[0]}' not found` };
  }
  const generator: GeneratorType | undefined = track.generators.find(
    (g) => g.name == sourcetg[1]
  );
  if (generator == undefined) {
    return {
      error: `Track '${sourcetg[0]}', generator '${sourcetg[1]}' not found`,
    };
  }
  return { error: "", generatorTrack: { track: track, generator: generator } };
}

// provides the form fields and validators for the sfperiodic generator
export interface ToolsProps {
  fileContents: CMGFile;
  setFileContents: Dispatch<SetStateAction<CMGFile>>;
  enabled: React.Dispatch<React.SetStateAction<boolean>>;
  timeLine?: TimeLine | null;
}

// present a list of all generators for multislection
// and set their durations equal to the one selected as
// primary. Either adjust start or stop time
type GeneratorTrack = {
  generator: GeneratorType;
  track: Track;
};
export function GenEqualDialog(props: ToolsProps): JSX.Element {
  const { fileContents, setFileContents, enabled } = props;
  const [generatorTracks, setGeneratorTracks] = useState<GeneratorTrack[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const list: GeneratorTrack[] = [];
    fileContents.tracks.forEach((t: Track) => {
      t.generators.forEach((g: GeneratorType) => {
        list.push({ generator: g, track: t });
      });
    });
    setGeneratorTracks(list);
  }, [fileContents]);

  // the primary generator must be identified
  // one or more generators must be selected and none can be the primary generator

  function validate(
    primary: string,
    secondary: string[],
    _maintain: string
  ): string {
    if (primary == "") return "A primary generator must be selected";
    if (secondary.length === 0)
      return "One or more generators must be selected";
    if (secondary.includes(primary))
      return "The primary generator cannot be in the selection list";
    return "";
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    // extract the values from the form
    const primaryValue: string = event.target["primary"].value;
    // Get all selected values from the multiple select
    const secondarySelect = event.target["secondary"] as HTMLSelectElement;
    const secondaryValues: string[] = [];
    for (let i = 0; i < secondarySelect.options.length; i++) {
      if (secondarySelect.options[i].selected) {
        secondaryValues.push(secondarySelect.options[i].value);
      }
    }
    const maintainValue = event.target["maintain"].value;
    const error: string = validate(
      primaryValue,
      secondaryValues,
      maintainValue
    );
    if (error != "") {
      setError(error);
      return;
    }
    setEqual(primaryValue, secondaryValues, maintainValue);
    enabled(false);
  }

  function setEqual(primary: string, secondary: string[], maintain: string) {
    // extract the track and generator names from primary and secondary
    const nf: CMGFile = fileContents.copy();
    const { error, generatorTrack: primarytg } = extractTrackGenerator(
      primary,
      nf
    );
    if (error != "") {
      setError(error);
      return;
    }
    const secondarytg: GeneratorTrack[] = [];
    secondary.forEach((s: string) => {
      const { error, generatorTrack: tg } = extractTrackGenerator(s, nf);
      if (error != "") {
        setError(error);
        return;
      }
      if (tg == undefined) return;
      secondarytg.push(tg);
    });
    if (secondary.length != secondarytg.length) return;

    // update the generators
    if (primarytg == undefined) return;
    const duration: number =
      primarytg.generator.stopTime - primarytg.generator.startTime;
    secondarytg.forEach((tg: GeneratorTrack) => {
      if (maintain == "start") {
        tg.generator.stopTime = tg.generator.startTime + duration;
      } else tg.generator.startTime = tg.generator.stopTime - duration;
    });

    nf.dirty = true;
    setFileContents(nf);
    enabled(false);
  }

  // ask the user to confirm that the track is to be duplcated
  return (
    <div className="modal-content">
      <div className="modal-header">
        <span className="close" onClick={() => enabled(false)}>
          &times;
        </span>
        <h2>Set Generator Durations Equal to a Primary Generator</h2>
      </div>
      <div className="modal-body">
        <form onSubmit={(e) => onSubmit(e)}>
          <label>
            Primary Generator:&nbsp;
            <select name="primary" id="primary">
              {generatorTracks.map((gt: GeneratorTrack) => (
                <option
                  key={`primary-${gt.track.name}|${gt.generator.name}`}
                  value={`${gt.track.name}@${gt.generator.name}`}
                >
                  {`${gt.track.name}@${gt.generator.name}`}
                </option>
              ))}
            </select>
          </label>
          <label>
            &nbsp;Secondary Generators:&nbsp;
            <select name="secondary" multiple={true} id="secondary" required>
              {generatorTracks.map((gt: GeneratorTrack) => (
                <option
                  key={`secondary-${gt.track.name}|${gt.generator.name}`}
                  value={`${gt.track.name}@${gt.generator.name}`}
                >
                  {`${gt.track.name}@${gt.generator.name}`}
                </option>
              ))}
            </select>
          </label>
          <br />
          <label>
            Maintain Start Time or Stop Time?&nbsp;
            <select name="maintain" id="maintain">
              <option value="start">Start Time</option>
              <option value="stop">Stop Time</option>
            </select>
          </label>
          <br />

          <input type="submit" value="Set Equal" />
          <button type="button" onClick={() => enabled(false)}>
            Cancel
          </button>
        </form>
      </div>
      <div className="modal-footer">{error}</div>
    </div>
  );
}

// given a primary generator, stagger the selected generators start times by the specified time or measure
// Generators are selected in sequence, adding a new one each time the 'Add selection' button is pressed
// When in measure mode, the stagger amount is specified as number of measurement and subdivisions
export function GenStaggerDialog(props: ToolsProps): JSX.Element {
  const { fileContents, setFileContents, enabled, timeLine } = props;
  const [error, setError] = useState<string>("");
  const [generatorTracks, setGeneratorTracks] = useState<GeneratorTrack[]>([]);
  const [amount, setAmount] = useState<number>(0);
  const [subDivision, setSubDivision] = useState<number>(1);
  const [unit, setUnit] = useState<string>("");
  const [selectionIds, setSelectionIds] = useState<number[]>([1]);

  useEffect(() => {
    const list: GeneratorTrack[] = [];
    fileContents.tracks.forEach((t: Track) => {
      t.generators.forEach((g: GeneratorType) => {
        list.push({ generator: g, track: t });
      });
    });
    setGeneratorTracks(list);
    setSelectionIds([1]);
  }, [fileContents]);
  useEffect(() => {
    if (!timeLine) return;
    if (timeLine.mode == TIMELINETYPE.Time) setUnit("secs");
    else setUnit("measures");
  }, [timeLine]);

  function onAmountChange(e: ChangeEvent<HTMLInputElement>): void {
    setAmount(parseFloat(e.target.value));
  }
  function onSubDivisionChange(e: ChangeEvent<HTMLInputElement>): void {
    setSubDivision(parseFloat(e.target.value));
  }

  // the primary generator must be identified
  // one or more generators must be selected and none can be the primary generator

  function validate(
    primary: string,
    secondary: string[],
  ): string {
    if (primary == "") return "A primary generator must be selected";
    if (secondary.includes(primary))
      return "The primary generator cannot be in the selection list";
    return "";
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    // extract the values from the form
    const primaryValue: string = e.target["primary"].value;
    const secondaryValues: string[] = [];
    for (let i = 0; i < selectionIds.length; i++) {
      const secondaryValue: string = e.target[`secondary-${i+1}`].value;
      secondaryValues.push(secondaryValue);
    }
    const amountValue = e.target["amount"].value;
    const subDivisionValue = unit == 'secs'? 0: e.target['subdivision'].value;
    const error: string = validate(primaryValue, secondaryValues);
    if (error != "") {
      setError(error);
      return;
    }
    stagger(primaryValue, secondaryValues, parseFloat(amountValue), parseFloat(subDivisionValue), unit);
    enabled(false);
  }

  function stagger(
    primary: string,
    secondary: string[],
    amount: number,
    subdivision: number,
    unit: string
  ): void {
    // extract the track and generator names from primary and secondary
    if (!timeLine) return;
    const nf: CMGFile = fileContents.copy();
    const { error, generatorTrack: primarytg } = extractTrackGenerator(
      primary,
      nf
    );
    if (error != "") {
      setError(error);
      return;
    }
    const secondarytg: GeneratorTrack[] = [];
    secondary.forEach((s: string) => {
      const { error, generatorTrack: tg } = extractTrackGenerator(s, nf);
      if (error != "") {
        setError(error);
        return;
      }
      if (tg == undefined) return;
      secondarytg.push(tg);
    });
    if (secondary.length != secondarytg.length) return;
    if (primarytg == undefined) return;

    // get the stagger time in seconds
    const start: number = primarytg.generator.startTime;
    const staggerTime: number =
      unit == "secs" ? amount : amount * timeLine.measureSize * (1 + (subdivision - 1) / timeLine.beatsPerMeasure);
    let staggerValue: number = staggerTime;
    // update the generators
    secondarytg.forEach((tg: GeneratorTrack) => {
      const durtion: number = tg.generator.stopTime - tg.generator.startTime;
      tg.generator.startTime = start + staggerValue;
      tg.generator.stopTime = tg.generator.startTime + durtion;
      staggerValue += staggerTime;
    });
    nf.dirty = true;
    setFileContents(nf);
    enabled(false);
  }
  function onNewSelection(): void {
    setSelectionIds((prev: number[]) => [...prev, prev[prev.length - 1] + 1]);
  }

  return (
    <div className="modal-content">
      <div className="modal-header">
        <span className="close" onClick={() => enabled(false)}>
          &times;
        </span>
        <h2>{`Stagger the Start Times for Selected Generators a Specified Number of ${unit} `}</h2>
      </div>
      <div className="modal-body">
        <form onSubmit={(e) => onSubmit(e)}>
          <label>
            Primary Generator:&nbsp;
            <select name="primary" id="primary">
              {generatorTracks.map((gt: GeneratorTrack) => (
                <option
                  key={`primary-${gt.track.name}|${gt.generator.name}`}
                  value={`${gt.track.name}@${gt.generator.name}`}
                >
                  {`${gt.track.name}@${gt.generator.name}`}
                </option>
              ))}
            </select>
            <br />
          </label>
          <button type="button" onClick={() => onNewSelection()}>
            Add Selection
          </button>
          {selectionIds.map((id: number) => (
            <>
              <br/>
              <label>
              {`Secondary Generator ${id}`} :&nbsp;
              <select id={"secondary-" + id} name={"secondary-" + id}>
                {generatorTracks.map((gt: GeneratorTrack) => (
                  <option
                    key={`secondary-${id}-${gt.track.name}|${gt.generator.name}`}
                    value={`${gt.track.name}@${gt.generator.name}`}
                  >
                    {`${gt.track.name}@${gt.generator.name}`}
                  </option>
                ))}
              </select>
              </label>
            </>
          ))}
          <br />
          <label>
            Stagger Amount:&nbsp;
            <input
              type="number"
              name="amount"
              id="amount"
              value={amount}
              onChange={(e) => onAmountChange(e)}
            />
            <span>&nbsp;({unit})</span>
          </label>
          {unit == 'measures' && timeLine? (
          <label>
            &nbsp;Beats:&nbsp;
            <input
              type="number"
              name="subdivision"
              id="subdivision"
              min={1}
              max={timeLine.beatsPerMeasure}
              step={1}
              value={subDivision}
              onChange={(e) => onSubDivisionChange(e)}
            />
          </label>

          ):null}
          <br />

          <input type="submit" value="Stagger" />
          <button type="button" onClick={() => enabled(false)}>
            Cancel
          </button>
        </form>
      </div>
      <div className="modal-footer">{error}</div>
    </div>
  );
}

export function GenAlignDialog(props: ToolsProps): JSX.Element {
  const { fileContents, setFileContents, enabled } = props;
  const [error, setError] = useState<string>("");
  const [generatorTracks, setGeneratorTracks] = useState<GeneratorTrack[]>([]);

  useEffect(() => {
    const list: GeneratorTrack[] = [];
    fileContents.tracks.forEach((t: Track) => {
      t.generators.forEach((g: GeneratorType) => {
        list.push({ generator: g, track: t });
      });
    });
    setGeneratorTracks(list);
  }, [fileContents]);

  // the primary generator must be identified
  // one or more generators must be selected and none can be the primary generator

  function validate(
    primary: string,
    secondary: string[],
    _alignValue: string
  ): string {
    if (primary == "") return "A primary generator must be selected";
    if (secondary.length === 0)
      return "One or more generators must be selected";
    if (secondary.includes(primary))
      return "The primary generator cannot be in the selection list";
    return "";
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    // extract the values from the form
    const primaryValue: string = e.target["primary"].value;
    // Get all selected values from the multiple select
    const secondarySelect = e.target["secondary"] as HTMLSelectElement;
    const secondaryValues: string[] = [];
    for (let i = 0; i < secondarySelect.options.length; i++) {
      if (secondarySelect.options[i].selected) {
        secondaryValues.push(secondarySelect.options[i].value);
      }
    }
    const alignValue = e.target["align"].value;
    const error: string = validate(primaryValue, secondaryValues, alignValue);
    if (error != "") {
      setError(error);
      return;
    }
    align(primaryValue, secondaryValues, alignValue);
    enabled(false);
  }

  function align(primary: string, secondary: string[], align: string): void {
    // extract the track and generator names from primary and secondary
    const nf: CMGFile = fileContents.copy();
    const { error, generatorTrack: primarytg } = extractTrackGenerator(
      primary,
      nf
    );
    if (error != "") {
      setError(error);
      return;
    }
    const secondarytg: GeneratorTrack[] = [];
    secondary.forEach((s: string) => {
      const { error, generatorTrack: tg } = extractTrackGenerator(s, nf);
      if (error != "") {
        setError(error);
        return;
      }
      if (tg == undefined) return;
      secondarytg.push(tg);
    });
    if (secondary.length != secondarytg.length) return;
    if (primarytg == undefined) return;

    // do the alignment maintaining generator duration
    // update the generators
    secondarytg.forEach((tg: GeneratorTrack) => {
      const duration: number = tg.generator.stopTime - tg.generator.startTime;
      if (align == "start") {
        tg.generator.startTime = primarytg.generator.startTime;
        tg.generator.stopTime = tg.generator.startTime + duration;
      }
      else {
        tg.generator.stopTime = primarytg.generator.stopTime;
        tg.generator.startTime = tg.generator.stopTime - duration;
      }
    });
    nf.dirty = true;
    setFileContents(nf);
    enabled(false);
  }

  return (
    <div className="modal-content">
      <div className="modal-header">
        <span className="close" onClick={() => enabled(false)}>
          &times;
        </span>
        <h2>{`Align Generators maintaing durations`}</h2>
      </div>
      <div className="modal-body">
        <form onSubmit={(e) => onSubmit(e)}>
          <label>
            Primary Generator:&nbsp;
            <select name="primary" id="primary">
              {generatorTracks.map((gt: GeneratorTrack) => (
                <option
                  key={`primary-${gt.track.name}|${gt.generator.name}`}
                  value={`${gt.track.name}@${gt.generator.name}`}
                >
                  {`${gt.track.name}@${gt.generator.name}`}
                </option>
              ))}
            </select>
          </label>
          <label>
            &nbsp;Secondary Generators:&nbsp;
            <select name="secondary" multiple={true} id="secondary" required>
              {generatorTracks.map((gt: GeneratorTrack) => (
                <option
                  key={`secondary-${gt.track.name}|${gt.generator.name}`}
                  value={`${gt.track.name}@${gt.generator.name}`}
                >
                  {`${gt.track.name}@${gt.generator.name}`}
                </option>
              ))}
            </select>
          </label>
          <br />
          <label>
            Align Time:&nbsp;
            <select name="align" id="align">
              <option value="start">Start Time</option>
              <option value="stop">Stop Time</option>
            </select>
          </label>
          <br />

          <input type="submit" value="Align" />
          <button type="button" onClick={() => enabled(false)}>
            Cancel
          </button>
        </form>
      </div>
      <div className="modal-footer">{error}</div>
    </div>
  );
}
