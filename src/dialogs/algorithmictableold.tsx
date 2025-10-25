// build the table for the algorithmic generator containing the
// note, speed, attack, duration, volume, and pan attributes

import {
    AutoregressiveValues,
    ConstantValues,
    MarkovianValues,
    OscillatorValues,
    WienerValues,
} from "classes/algorithmvalues";
import { Algorithmic } from "classes/generators";
import { ChangeEvent } from "react";
import { toNote } from "sfcomponents/util";
import {
    Algorithm,
    ALGORITHMTYPE,
    Attributes,
    atttributeTitles,
    parameterNames,
    SequenceType
} from "types";
import AutoregressivePropertiesBox from "./autoregresivepropertiesbox";
import ConstantPropertiesBox from "./constantpropertiesbox";
import MarkovianPropertiesBox from "./markovianpropertiesbox";
import OscillatorPropertiesBox from "./oscillatorpropertiesbox";
import SequencerPropertiesBox from "./sequencerpropertiesbox";
import WienerPropertiesBox from "./wienerpropertiesbox";

interface AlgorithmTableProps {
  generator: Algorithmic;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}

export default function AlgorithmicTable(
  prop: AlgorithmTableProps
): JSX.Element[] {
  const { generator, handleChange } = prop;

  const newElements: JSX.Element[] = [];
  [
    generator.noteP,
    generator.speedP,
    generator.attackP,
    generator.durationP,
    generator.volumeP,
    generator.panP,
  ].forEach((algorithm: Algorithm, i: number) => {
    console.log('algorithm name',Attributes[i]);
    newElements.push(
      <>
        <div className="algorithmic-table">
          <div className="attribute">{atttributeTitles[i]}</div>
          <div className="gentype">
            <label>
              Algorithm:&nbsp;
              <select
                name={parameterNames[i] + ".algorithmType"}
                onChange={handleChange}
                value={algorithm.algorithmType}
              >
                {Object.values(ALGORITHMTYPE).map((p) => {
                  return (
                    <option
                      key={`${parameterNames[i]}-modulator-${p}`}
                      value={p}
                    >
                      {p}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>
          <div className="parameters">
            <>
              {!!(algorithm.algorithmType == ALGORITHMTYPE.Oscillator) && (
              <OscillatorPropertiesBox
                name={parameterNames[i]}
                type={(algorithm as OscillatorValues).values.type}
                center={{
                  value: (algorithm as OscillatorValues).values.center,
                  lo: 0,
                  hi: 127,
                  step: 0.001,
                  suffix: "(midi)",
                }}
                centerSuffix={(value: number) => {
                  if (parameterNames[i] != 'noteP') return "";
                  else return " ".concat(toNote(value));
                }}
                frequency={{
                  value: (algorithm as OscillatorValues).values.frequency,
                  lo: 0,
                  hi: 1000000,
                  step: 0.001,
                  suffix: "(mHz)",
                }}
                amplitude={{
                  value: (algorithm as OscillatorValues).values.amplitude,
                  lo: 0,
                  hi: 127,
                  step: 0.001,
                  suffix: "(midi)",
                }}
                phase={{
                  value: (algorithm as OscillatorValues).values.phase,
                  lo: -360,
                  hi: 360,
                  step: 1,
                  suffix: "(degrees)",
                }}
                handleChange={handleChange}
              />
              )}
               {!!(algorithm.algorithmType == ALGORITHMTYPE.Markovian) && (
              <MarkovianPropertiesBox
                name={parameterNames[i]}
                values={(algorithm as MarkovianValues).values}
                valueSuffix={(value: number) => {
                  if (parameterNames[i] != "noteP") return "";
                  else return " ".concat(toNote(value));
                }}
                min={0}
                max={127}
                step={0.1}
                handleChange={handleChange}
              />
              )}
               {!!(algorithm.algorithmType == ALGORITHMTYPE.Wiener) && (
              <WienerPropertiesBox
                name={parameterNames[i]}
                values={(algorithm as WienerValues).values}
                handleChange={handleChange}
                min={0}
                max={127}
                step={0.001}
                valueSuffix={(value: number) => {
                  if (parameterNames[i] != "noteP") return "";
                  else return " ".concat(toNote(value));
                }}
              />
              )}
               {!!(algorithm.algorithmType == ALGORITHMTYPE.Constant) && (
              <ConstantPropertiesBox
                name={parameterNames[i]}
                values={(algorithm as ConstantValues).values}
                handleChange={handleChange}
                min={0}
                max={127}
                step={0.001}
                valueSuffix={(value: number) => {
                  if (parameterNames[i] != "noteP") return "";
                  else return " ".concat(toNote(value));
                }}
              />
              )}
               {!!(algorithm.algorithmType == ALGORITHMTYPE.Autoregressive) &&
              (
              <AutoregressivePropertiesBox
                name={parameterNames[i]}
                values={(algorithm as AutoregressiveValues).values}
                handleChange={handleChange}
                min={0}
                max={127}
                step={0.001}
                valueSuffix={(value: number) => {
                  if (parameterNames[i] != "noteP") return "";
                  else return " ".concat(toNote(value));
                }}
              />
              )}
               {!!(algorithm.algorithmType == ALGORITHMTYPE.Sequencer) && (
              <SequencerPropertiesBox
                attributeType={Attributes[i]}
                name={parameterNames[i]}
                values={algorithm.values as SequenceType}
                handleChange={handleChange}
              />
              )}
            </>
          </div>
        </div>
        <hr />
      </>
    );
  });
  return newElements;
}
