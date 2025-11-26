import { AlgorithmValues } from "classes/algorithms/algorithmvalues";
import AutoregressiveValues from "classes/algorithms/autoregressivevalues";
import ConstantValues from "classes/algorithms/constantvalues";
import MarkovianValues from "classes/algorithms/markovianvalues";
import OscillatorValues from "classes/algorithms/oscillatorvalues";
import SequenceValues from "classes/algorithms/sequencevalues";
import WienerValues from "classes/algorithms/wienervalues";
import Algorithmic from "classes/generators/algorithmic";
import { ChangeEvent } from "react";
import { toNote } from "sfcomponents/util";
import { ALGORITHMTYPE, SEQUENCEATTRIBUTE, SequenceItem } from "types";
import { calulateSequencerGeneratorStopTime } from "utils/calculatesequencergeneratorstoptime";
import { loadSequenceItems } from "utils/loadsequenceitems";
import AutoregressivePropertiesBox from "./autoregresivepropertiesbox";
import ConstantPropertiesBox from "./constantpropertiesbox";
import MarkovianPropertiesBox from "./markovianpropertiesbox";
import OscillatorPropertiesBox from "./oscillatorpropertiesbox";
import SequencerPropertiesBox from "./sequencerpropertiesbox";
import WienerPropertiesBox from "./wienerpropertiesbox";

// provides the form fields and validators for the algorithmic generator

export interface AlgorithmicTableProps {
  formData: Algorithmic;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}

export default function AlgorithmicTable(
  props: AlgorithmicTableProps
): JSX.Element {
  const { formData, handleChange } = props;

  // seems the best place to handle changes to the note sequencer and speed parameters
  // order to calculate a new stop time.
  async function handleNoteSpeedChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    //if the current noteP algorithm is sequencer, any change to it
    // or the speedP algorithm will result in a change to the stopTime

    // only do this when the note is in sequencer mode
    if (formData.noteP.algorithmType != ALGORITHMTYPE.Sequencer) {
      handleChange(e);
      return;
    }
    // determine what changed. First, load the current values from the form
    let items: SequenceItem[] = (formData.noteP as SequenceValues).values.items;
    let speedP: AlgorithmValues = formData.speedP.copy();
    let doCalc: boolean = false;

    // if the name of the sequence changes, then load the new items to be used
    if (e.target.name == "noteP.name") {
      const sequenceName: string = e.target.value;
      items = await loadSequenceItems(SEQUENCEATTRIBUTE.note, sequenceName);
      doCalc = true;
      // console.log(
      //   `AT: sequence name change. new items loaded for '${sequenceName}'`
      // );
    }

    // if any of the speed parameters changes,
    if (e.target.name.startsWith("speedP")) {
      const nameParts: string[] = e.target.name.split(".");
      speedP.setAttribute(nameParts[1], e.target.value);
      doCalc = true;
    }
    if (doCalc) {
      const startTime: number = formData.startTime;
      const stopTime = calulateSequencerGeneratorStopTime(
        startTime,
        items,
        speedP
      );

      // if the stop time has been recalcuated, send it to handleChange
      if (stopTime != formData.stopTime)
        handleChange({
          target: { name: "stopTime", value: stopTime.toString() },
        } as ChangeEvent<HTMLInputElement>);
    }
    // pass the original change onto handleChange
    handleChange(e);
  }
  return (
    <>
      <div className="algorithmic-table">
        <div className="attribute"><label>Note (pitch)</label></div>
        <div className="gentype">
          <label>
            Algorithm:&nbsp;
            <select
              name="noteP.algorithmType"
              onChange={handleChange}
              value={formData.noteP.algorithmType}
            >
              {Object.values(ALGORITHMTYPE).map((p) => {
                return (
                  <option key={`notePmodulator-${p}`} value={p}>
                    {p}
                  </option>
                );
              })}
            </select>
          </label>
        </div>
        <div className="parameters">
          {!!(formData.noteP.algorithmType == ALGORITHMTYPE.Oscillator) && (
            <OscillatorPropertiesBox
              name="noteP"
              type={(formData.noteP as OscillatorValues).values.type}
              center={{
                value: (formData.noteP as OscillatorValues).values.center,
                lo: 0,
                hi: 127,
                step: 0.001,
                suffix: "(pitch)",
              }}
              centerSuffix={(value: number) => {
                if (value < 0) return "";
                else return " ".concat(toNote(value));
              }}
              frequency={{
                value: (formData.noteP as OscillatorValues).values.frequency,
                lo: 0,
                hi: 1000000,
                step: 0.001,
                suffix: "(mHz)",
              }}
              amplitude={{
                value: (formData.noteP as OscillatorValues).values.amplitude,
                lo: 0,
                hi: 127,
                step: 0.001,
                suffix: "(pitch)",
              }}
              phase={{
                value: (formData.noteP as OscillatorValues).values.phase,
                lo: -360,
                hi: 360,
                step: 1,
                suffix: "(degrees)",
              }}
              handleChange={handleChange}
            />
          )}
          {!!(formData.noteP.algorithmType == ALGORITHMTYPE.Markovian) && (
            <MarkovianPropertiesBox
              name="noteP"
              values={(formData.noteP as MarkovianValues).values}
              valueSuffix={(value: number) => {
                if (value < 0) return "";
                else return " ".concat(toNote(value));
              }}
              min={0}
              max={127}
              step={0.1}
              handleChange={handleChange}
            />
          )}
          {!!(formData.noteP.algorithmType == ALGORITHMTYPE.Wiener) && (
            <WienerPropertiesBox
              name="noteP"
              values={(formData.noteP as WienerValues).values}
              handleChange={handleChange}
              min={0}
              max={127}
              step={0.001}
              valueSuffix={(value: number) => toNote(value)}
            />
          )}
          {!!(formData.noteP.algorithmType == ALGORITHMTYPE.Constant) && (
            <ConstantPropertiesBox
              name="noteP"
              values={(formData.noteP as ConstantValues).values}
              handleChange={handleChange}
              min={0}
              max={127}
              step={0.001}
              valueSuffix={(value: number) => toNote(value)}
            />
          )}
          {!!(formData.noteP.algorithmType == ALGORITHMTYPE.Autoregressive) && (
            <AutoregressivePropertiesBox
              name="noteP"
              values={(formData.noteP as AutoregressiveValues).values}
              handleChange={handleChange}
              min={0}
              max={127}
              step={0.001}
              valueSuffix={(value: number) => toNote(value)}
            />
          )}
          {!!(formData.noteP.algorithmType == ALGORITHMTYPE.Sequencer) && (
            <SequencerPropertiesBox
              attributeType={SEQUENCEATTRIBUTE.note}
              name="noteP"
              values={(formData.noteP as SequenceValues).values}
              handleChange={handleNoteSpeedChange}
            />
          )}
        </div>
      </div>
      <hr />
      <div className="algorithmic-table">
        <div className="attribute"><label>Attack (velocity)</label></div>
        <div className="gentype">
          <label>
            Algorithm:&nbsp;
            <select
              name="attackP.algorithmType"
              onChange={handleChange}
              value={
                formData.attackP
                  ? formData.attackP.algorithmType
                  : ALGORITHMTYPE.None
              }
            >
              {Object.values(ALGORITHMTYPE).map((p) => {
                return (
                  <option key={`attackPmodulator-${p}`} value={p}>
                    {p}
                  </option>
                );
              })}
            </select>
          </label>
        </div>
        <div className="parameters">
          {!!(formData.attackP.algorithmType == ALGORITHMTYPE.Oscillator) && (
            <OscillatorPropertiesBox
              name="attackP"
              type={(formData.attackP as OscillatorValues).values.type}
              center={{
                value: (formData.attackP as OscillatorValues).values.center,
                lo: 0,
                hi: 127,
                step: 1,
                suffix: "(0-127)",
              }}
              centerSuffix={(value: number) => {
                if (value < 0) return "";
                else return "(0-127)";
              }}
              frequency={{
                value: (formData.attackP as OscillatorValues).values.frequency,
                lo: 0,
                hi: 1000000,
                step: 0.001,
                suffix: "(mHz)",
              }}
              amplitude={{
                value: (formData.attackP as OscillatorValues).values.amplitude,
                lo: 0,
                hi: 127,
                step: 0.001,
                suffix: "(0-127)",
              }}
              phase={{
                value: (formData.attackP as OscillatorValues).values.phase,
                lo: -360,
                hi: 360,
                step: 1,
                suffix: "(degrees)",
              }}
              handleChange={handleChange}
            />
          )}
          {!!(formData.attackP.algorithmType == ALGORITHMTYPE.Markovian) && (
            <MarkovianPropertiesBox
              name="attackP"
              values={(formData.attackP as MarkovianValues).values}
              valueSuffix={(value: number) => {
                if (value < 0) return "";
                else return " ".concat(toNote(value));
              }}
              min={0}
              max={127}
              step={1}
              handleChange={handleChange}
            />
          )}
          {!!(formData.attackP.algorithmType == ALGORITHMTYPE.Wiener) && (
            <WienerPropertiesBox
              name="attackP"
              values={(formData.attackP as WienerValues).values}
              handleChange={handleChange}
              min={0}
              max={127}
              step={1}
              valueSuffix={() => "(0-127)"}
            />
          )}
          {!!(formData.attackP.algorithmType == ALGORITHMTYPE.Constant) && (
            <ConstantPropertiesBox
              name="attackP"
              values={(formData.attackP as ConstantValues).values}
              handleChange={handleChange}
              min={0}
              max={127}
              step={1}
              valueSuffix={() => "(0-127)"}
            />
          )}
          {!!(
            formData.attackP.algorithmType == ALGORITHMTYPE.Autoregressive
          ) && (
            <AutoregressivePropertiesBox
              name="attackP"
              values={(formData.attackP as AutoregressiveValues).values}
              handleChange={handleChange}
              min={0}
              max={127}
              step={1}
              valueSuffix={() => "(0-127)"}
            />
          )}
          {!!(formData.attackP.algorithmType == ALGORITHMTYPE.Sequencer) && (
            <SequencerPropertiesBox
              attributeType={SEQUENCEATTRIBUTE.attack}
              name="attackP"
              values={(formData.attackP as SequenceValues).values}
              handleChange={handleChange}
            />
          )}
        </div>
      </div>
      <hr />
      <div className="algorithmic-table">
        <div className="attribute"><label>Speed (BPM)</label></div>
        <div className="gentype">
          <label>
            Algorithm:&nbsp;
            <select
              name="speedP.algorithmType"
              onChange={handleChange}
              value={
                formData.speedP
                  ? formData.speedP.algorithmType
                  : ALGORITHMTYPE.None
              }
            >
              {Object.values(ALGORITHMTYPE).map((p) => {
                return (
                  <option key={`speedPmodulator-${p}`} value={p}>
                    {p}
                  </option>
                );
              })}
            </select>
          </label>
        </div>
        <div className="parameters">
          {formData.speedP &&
          formData.speedP.algorithmType == ALGORITHMTYPE.Oscillator ? (
            <OscillatorPropertiesBox
              name="speedP"
              type={(formData.speedP as OscillatorValues).values.type}
              center={{
                value: (formData.speedP as OscillatorValues).values.center,
                lo: 0,
                hi: 1000,
                step: 0.01,
                suffix: "(BPM)",
              }}
              centerSuffix={() => "BPM"}
              frequency={{
                value: (formData.speedP as OscillatorValues).values.frequency,
                lo: 0,
                hi: 1000000,
                step: 1,
                suffix: "(mHz)",
              }}
              amplitude={{
                value: (formData.speedP as OscillatorValues).values.amplitude,
                lo: 0,
                hi: 1000,
                step: 0.001,
                suffix: "(BPM)",
              }}
              phase={{
                value: (formData.speedP as OscillatorValues).values.phase,
                lo: -360,
                hi: 360,
                step: 1,
                suffix: "(degrees)",
              }}
              handleChange={handleNoteSpeedChange}
            />
          ) : null}
          {formData.speedP &&
          formData.speedP.algorithmType == ALGORITHMTYPE.Markovian ? (
            <MarkovianPropertiesBox
              name="speedP"
              valueSuffix={() => {
                return "";
              }}
              values={(formData.speedP as MarkovianValues).values}
              min={1}
              max={1000}
              step={1}
              handleChange={handleNoteSpeedChange}
            />
          ) : null}
          {formData.speedP &&
          formData.speedP.algorithmType == ALGORITHMTYPE.Wiener ? (
            <WienerPropertiesBox
              name="speedP"
              values={(formData.speedP as WienerValues).values}
              min={1}
              max={1000}
              step={0.1}
              valueSuffix={() => ""}
              handleChange={handleNoteSpeedChange}
            />
          ) : null}
          {formData.speedP &&
          formData.speedP.algorithmType == ALGORITHMTYPE.Constant ? (
            <ConstantPropertiesBox
              name="speedP"
              values={(formData.speedP as ConstantValues).values}
              handleChange={handleNoteSpeedChange}
              min={1}
              max={1000}
              step={1}
              valueSuffix={() => "BPM"}
            />
          ) : null}
          <div></div>
          {formData.speedP &&
          formData.speedP.algorithmType == ALGORITHMTYPE.Autoregressive ? (
            <AutoregressivePropertiesBox
              name="speedP"
              values={(formData.speedP as AutoregressiveValues).values}
              handleChange={handleNoteSpeedChange}
              min={1}
              max={1000}
              step={0.001}
              valueSuffix={() => "BPM"}
            />
          ) : null}
          {formData.speedP &&
          formData.speedP.algorithmType == ALGORITHMTYPE.Sequencer ? (
            <SequencerPropertiesBox
              attributeType={SEQUENCEATTRIBUTE.speed}
              name="speedP"
              values={(formData.speedP as SequenceValues).values}
              handleChange={handleNoteSpeedChange}
            />
          ) : null}
        </div>
      </div>
      <hr />
      <div className="algorithmic-table">
        <div className="attribute"><label>Duration (sec)</label></div>
        <div className="gentype">
          <label>
            Algorithm:&nbsp;
            <select
              name="durationP.algorithmType"
              onChange={handleChange}
              value={
                formData.durationP
                  ? formData.durationP.algorithmType
                  : ALGORITHMTYPE.None
              }
            >
              {Object.values(ALGORITHMTYPE).map((p) => {
                return (
                  <option key={`durationPmodulator-${p}`} value={p}>
                    {p}
                  </option>
                );
              })}
            </select>
          </label>
        </div>
        <div className="parameters">
          {formData.durationP &&
          formData.durationP.algorithmType == ALGORITHMTYPE.Oscillator ? (
            <OscillatorPropertiesBox
              name="durationP"
              type={(formData.durationP as OscillatorValues).values.type}
              center={{
                value: (formData.durationP as OscillatorValues).values.center,
                lo: 1,
                hi: 100,
                step: 1,
                suffix: "(%)",
              }}
              centerSuffix={() => "%"}
              frequency={{
                value: (formData.durationP as OscillatorValues).values
                  .frequency,
                lo: 0,
                hi: 1000000,
                step: 1,
                suffix: "(mHz)",
              }}
              amplitude={{
                value: (formData.durationP as OscillatorValues).values
                  .amplitude,
                lo: 0,
                hi: 100,
                step: 1,
                suffix: "(%)",
              }}
              phase={{
                value: (formData.durationP as OscillatorValues).values.phase,
                lo: -360,
                hi: 360,
                step: 1,
                suffix: "(degrees)",
              }}
              handleChange={handleChange}
            />
          ) : null}
          {formData.durationP &&
          formData.durationP.algorithmType == ALGORITHMTYPE.Markovian ? (
            <MarkovianPropertiesBox
              name="durationP"
              valueSuffix={() => {
                return "";
              }}
              values={(formData.durationP as MarkovianValues).values}
              min={1}
              max={100}
              step={1}
              handleChange={handleChange}
            />
          ) : null}
          {formData.durationP &&
          formData.durationP.algorithmType == ALGORITHMTYPE.Wiener ? (
            <WienerPropertiesBox
              name="durationP"
              values={(formData.durationP as WienerValues).values}
              min={1}
              max={100}
              step={1}
              valueSuffix={() => "%"}
              handleChange={handleChange}
            />
          ) : null}
          {formData.durationP &&
          formData.durationP.algorithmType == ALGORITHMTYPE.Constant ? (
            <ConstantPropertiesBox
              name="durationP"
              values={(formData.durationP as ConstantValues).values}
              handleChange={handleChange}
              min={1}
              max={100}
              step={1}
              valueSuffix={() => "%"}
            />
          ) : null}
          {formData.durationP &&
          formData.durationP.algorithmType == ALGORITHMTYPE.Autoregressive ? (
            <AutoregressivePropertiesBox
              name="durationP"
              values={(formData.durationP as AutoregressiveValues).values}
              handleChange={handleChange}
              min={1}
              max={100}
              step={1}
              valueSuffix={() => "%"}
            />
          ) : null}
          {formData.durationP &&
          formData.durationP.algorithmType == ALGORITHMTYPE.Sequencer ? (
            <SequencerPropertiesBox
              attributeType={SEQUENCEATTRIBUTE.duration}
              name="durationP"
              values={(formData.durationP as SequenceValues).values}
              handleChange={handleChange}
            />
          ) : null}
        </div>
      </div>
      <hr />
      <div className="algorithmic-table">
        <div className="attribute"><label>Volume (dB)</label></div>
        <div className="gentype">
          <label>
            Algorithm:&nbsp;
            <select
              name="volumeP.algorithmType"
              onChange={handleChange}
              value={
                formData.volumeP
                  ? formData.volumeP.algorithmType
                  : ALGORITHMTYPE.None
              }
            >
              {Object.values(ALGORITHMTYPE).map((p) => {
                return (
                  <option key={`volumePmodulator-${p}`} value={p}>
                    {p}
                  </option>
                );
              })}
            </select>
          </label>
        </div>
        <div className="parameters">
          {formData.volumeP &&
          formData.volumeP.algorithmType == ALGORITHMTYPE.Oscillator ? (
            <OscillatorPropertiesBox
              name="volumeP"
              type={(formData.volumeP as OscillatorValues).values.type}
              center={{
                value: (formData.volumeP as OscillatorValues).values.center,
                lo: -10,
                hi: 10,
                step: 1,
                suffix: "(dB)",
              }}
              centerSuffix={() => "dB"}
              frequency={{
                value: (formData.volumeP as OscillatorValues).values.frequency,
                lo: 0,
                hi: 1000000,
                step: 0.001,
                suffix: "(mHz)",
              }}
              amplitude={{
                value: (formData.volumeP as OscillatorValues).values.amplitude,
                lo: 0,
                hi: 10,
                step: 0.001,
                suffix: "(dB)",
              }}
              phase={{
                value: (formData.volumeP as OscillatorValues).values.phase,
                lo: -360,
                hi: 360,
                step: 1,
                suffix: "(degrees)",
              }}
              handleChange={handleChange}
            />
          ) : null}
          {formData.volumeP &&
          formData.volumeP.algorithmType == ALGORITHMTYPE.Markovian ? (
            <MarkovianPropertiesBox
              name="volumeP"
              valueSuffix={() => {
                return "";
              }}
              values={(formData.volumeP as MarkovianValues).values}
              min={-10}
              max={10}
              step={1}
              handleChange={handleChange}
            />
          ) : null}
          {formData.volumeP &&
          formData.volumeP.algorithmType == ALGORITHMTYPE.Wiener ? (
            <WienerPropertiesBox
              name="volumeP"
              values={(formData.volumeP as WienerValues).values}
              min={-10}
              max={10}
              step={1}
              valueSuffix={() => ""}
              handleChange={handleChange}
            />
          ) : null}
          {formData.volumeP &&
          formData.volumeP.algorithmType == ALGORITHMTYPE.Constant ? (
            <ConstantPropertiesBox
              name="volumeP"
              values={(formData.volumeP as ConstantValues).values}
              handleChange={handleChange}
              min={-10}
              max={10}
              step={1}
              valueSuffix={() => "dB"}
            />
          ) : null}
          {formData.volumeP &&
          formData.volumeP.algorithmType == ALGORITHMTYPE.Autoregressive ? (
            <AutoregressivePropertiesBox
              name="volumeP"
              values={(formData.volumeP as AutoregressiveValues).values}
              handleChange={handleChange}
              min={-10}
              max={10}
              step={1}
              valueSuffix={() => "dB"}
            />
          ) : null}
          {formData.volumeP &&
          formData.volumeP.algorithmType == ALGORITHMTYPE.Sequencer ? (
            <SequencerPropertiesBox
              attributeType={SEQUENCEATTRIBUTE.volume}
              name="volumeP"
              values={(formData.volumeP as SequenceValues).values}
              handleChange={handleChange}
            />
          ) : null}
        </div>
      </div>
      <hr />
      <div className="algorithmic-table">
        <div className="attribute"><label>{"Pan (left<->right)"}</label></div>
        <div className="gentype">
          <label>
            Algorithm:&nbsp;
            <select
              name="panP.algorithmType"
              onChange={handleChange}
              value={
                formData.panP ? formData.panP.algorithmType : ALGORITHMTYPE.None
              }
            >
              {Object.values(ALGORITHMTYPE).map((p) => {
                return (
                  <option key={`panPmodulator-${p}`} value={p}>
                    {p}
                  </option>
                );
              })}
            </select>
          </label>
        </div>
        <div className="parameters">
          {formData.panP &&
          formData.panP.algorithmType == ALGORITHMTYPE.Oscillator ? (
            <OscillatorPropertiesBox
              name="panP"
              type={(formData.panP as OscillatorValues).values.type}
              center={{
                value: (formData.panP as OscillatorValues).values.center,
                lo: -1,
                hi: 1,
                step: 0.1,
                suffix: "[-1,1]",
              }}
              centerSuffix={() => "[-1,1]"}
              frequency={{
                value: (formData.panP as OscillatorValues).values.frequency,
                lo: 0,
                hi: 1000000,
                step: 0.01,
                suffix: "(mHz)",
              }}
              amplitude={{
                value: (formData.panP as OscillatorValues).values.amplitude,
                lo: 0,
                hi: 2,
                step: 0.001,
                suffix: "[0,2]",
              }}
              phase={{
                value: (formData.panP as OscillatorValues).values.phase,
                lo: -360,
                hi: 360,
                step: 1,
                suffix: "(degrees)",
              }}
              handleChange={handleChange}
            />
          ) : null}
          {formData.panP &&
          formData.panP.algorithmType == ALGORITHMTYPE.Markovian ? (
            <MarkovianPropertiesBox
              name="panP"
              valueSuffix={() => {
                return "";
              }}
              values={(formData.panP as MarkovianValues).values}
              min={-1}
              max={1}
              step={0.1}
              handleChange={handleChange}
            />
          ) : null}
          {formData.panP &&
          formData.panP.algorithmType == ALGORITHMTYPE.Wiener ? (
            <WienerPropertiesBox
              name="panP"
              values={(formData.panP as WienerValues).values}
              handleChange={handleChange}
              min={-1}
              max={1}
              step={0.1}
              valueSuffix={() => ""}
            />
          ) : null}
          {formData.panP &&
          formData.panP.algorithmType == ALGORITHMTYPE.Constant ? (
            <ConstantPropertiesBox
              name="panP"
              values={(formData.panP as ConstantValues).values}
              handleChange={handleChange}
              min={-1}
              max={1}
              step={0.1}
              valueSuffix={() => "[-1,+1]"}
            />
          ) : null}
          {formData.panP &&
          formData.panP.algorithmType == ALGORITHMTYPE.Autoregressive ? (
            <AutoregressivePropertiesBox
              name="panP"
              values={(formData.panP as AutoregressiveValues).values}
              handleChange={handleChange}
              min={-1}
              max={1}
              step={0.1}
              valueSuffix={() => "[-1,+1]"}
            />
          ) : null}
          {formData.panP &&
          formData.panP.algorithmType == ALGORITHMTYPE.Sequencer ? (
            <SequencerPropertiesBox
              attributeType={SEQUENCEATTRIBUTE.pan}
              name="panP"
              values={(formData.panP as SequenceValues).values}
              handleChange={handleChange}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
