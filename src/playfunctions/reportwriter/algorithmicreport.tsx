import AutoregressiveValues from "classes/algorithms/autoregressivevalues";
import ConstantValues from "classes/algorithms/constantvalues";
import MarkovianValues from "classes/algorithms/markovianvalues";
import OscillatorValues from "classes/algorithms/oscillatorvalues";
import SequenceValues from "classes/algorithms/sequencevalues";
import WienerValues from "classes/algorithms/wienervalues";
import Algorithmic from "classes/generators/algorithmic";
import { ALGORITHMTYPE } from "types";

interface AlgorithmicReportProps {
  generator: Algorithmic;
}
export default function AlgorithmicReport(
  props: AlgorithmicReportProps,
): JSX.Element {
  const { generator: g } = props;
  return (
    <>
      <table>
        <thead>
          <tr>
            <th> Soundfont File </th>
            <th> Preset </th>
            <th> Looping? </th>
            <th> Attack Enabled? </th>
            <th> Microtones? </th>
            <th> Measure Length (beats) </th>
            <th> On Beats </th>
            <th> Notes in Octave </th>
            <th> Noise seed </th>
            <th> Noise Frequency (Hz) </th>
            <th> Noise Amplitude (gain) </th>
            <th> Reverb Duration (sec) </th>
            <th> Reverb Decay (sec) </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td> {g.soundFontFile} </td>
            <td> {g.presetName} </td>
            <td> {g.isLooping.toString()} </td>
            <td> {g.attackEnabled.toString()} </td>
            <td> {g.microtones.toString()} </td>
            <td> {g.measureLength} </td>
            <td> {g.beatCount} </td>
            <td> {g.noteCount} </td>
            <td> {g.noiseSeed} </td>
            <td> {g.noiseFrequency} </td>
            <td> {g.noiseAmplitude} </td>
            <td> {g.reverbDuration} </td>
            <td> {g.reverbDecay} </td>
          </tr>
        </tbody>
      </table>
      <div>
        <div>
          <h4>Note (midi) Algorithm Type: {g.noteP.algorithmType}</h4>
        </div>
        <div>
          {!!(g.noteP.algorithmType == ALGORITHMTYPE.Constant) && (
            <ConstantReport values={g.noteP as ConstantValues} />
          )}
          {!!(g.noteP.algorithmType == ALGORITHMTYPE.Oscillator) && (
            <OscillatorReport values={g.noteP as OscillatorValues} />
          )}
          {!!(g.noteP.algorithmType == ALGORITHMTYPE.Autoregressive) && (
            <AutoregressiveReport values={g.noteP as AutoregressiveValues} />
          )}
          {!!(g.noteP.algorithmType == ALGORITHMTYPE.Markovian) && (
            <MarkovianReport values={g.noteP as MarkovianValues} />
          )}
          {!!(g.noteP.algorithmType == ALGORITHMTYPE.Wiener) && (
            <WeinerReport values={g.noteP as WienerValues} />
          )}
          {!!(g.noteP.algorithmType == ALGORITHMTYPE.Sequencer) && (
            <SequencerReport values={g.noteP as SequenceValues} />
          )}
        </div>
      </div>
      <div>
        <div>
          <h4>Attack (velocity) Algorithm Type: {g.attackP.algorithmType}</h4>
        </div>
        <div>
          {!!(g.attackP.algorithmType == ALGORITHMTYPE.Constant) && (
            <ConstantReport values={g.attackP as ConstantValues} />
          )}
          {!!(g.attackP.algorithmType == ALGORITHMTYPE.Oscillator) && (
            <OscillatorReport values={g.attackP as OscillatorValues} />
          )}
          {!!(g.attackP.algorithmType == ALGORITHMTYPE.Autoregressive) && (
            <AutoregressiveReport values={g.attackP as AutoregressiveValues} />
          )}
          {!!(g.attackP.algorithmType == ALGORITHMTYPE.Markovian) && (
            <MarkovianReport values={g.attackP as MarkovianValues} />
          )}
          {!!(g.attackP.algorithmType == ALGORITHMTYPE.Wiener) && (
            <WeinerReport values={g.attackP as WienerValues} />
          )}
          {!!(g.attackP.algorithmType == ALGORITHMTYPE.Sequencer) && (
            <SequencerReport values={g.attackP as SequenceValues} />
          )}
        </div>
      </div>
      <div>
        <div>
          <h4>Speed (BPM) Algorithm Type: {g.speedP.algorithmType}</h4>
        </div>
        <div>
          {!!(g.speedP.algorithmType == ALGORITHMTYPE.Constant) && (
            <ConstantReport values={g.speedP as ConstantValues} />
          )}
          {!!(g.speedP.algorithmType == ALGORITHMTYPE.Autoregressive) && (
            <AutoregressiveReport values={g.speedP as AutoregressiveValues} />
          )}
          {!!(g.speedP.algorithmType == ALGORITHMTYPE.Oscillator) && (
            <OscillatorReport values={g.speedP as OscillatorValues} />
          )}
          {!!(g.speedP.algorithmType == ALGORITHMTYPE.Markovian) && (
            <MarkovianReport values={g.speedP as MarkovianValues} />
          )}
          {!!(g.speedP.algorithmType == ALGORITHMTYPE.Wiener) && (
            <WeinerReport values={g.speedP as WienerValues} />
          )}
          {!!(g.speedP.algorithmType == ALGORITHMTYPE.Sequencer) && (
            <SequencerReport values={g.speedP as SequenceValues} />
          )}
        </div>
      </div>
      <div>
        <div>
          <h4>Duration (%) Algorithm Type: {g.durationP.algorithmType}</h4>
        </div>
        <div>
          {!!(g.durationP.algorithmType == ALGORITHMTYPE.Constant) && (
            <ConstantReport values={g.durationP as ConstantValues} />
          )}
          {!!(g.durationP.algorithmType == ALGORITHMTYPE.Autoregressive) && (
            <AutoregressiveReport
              values={g.durationP as AutoregressiveValues}
            />
          )}
          {!!(g.durationP.algorithmType == ALGORITHMTYPE.Oscillator) && (
            <OscillatorReport values={g.durationP as OscillatorValues} />
          )}
          {!!(g.durationP.algorithmType == ALGORITHMTYPE.Markovian) && (
            <MarkovianReport values={g.durationP as MarkovianValues} />
          )}
          {!!(g.durationP.algorithmType == ALGORITHMTYPE.Wiener) && (
            <WeinerReport values={g.durationP as WienerValues} />
          )}
          {!!(g.durationP.algorithmType == ALGORITHMTYPE.Sequencer) && (
            <SequencerReport values={g.durationP as SequenceValues} />
          )}
        </div>
      </div>
      <div>
        <h4>Volume (dB) Algorithm Type: {g.volumeP.algorithmType}</h4>
        <div>
          {!!(g.volumeP.algorithmType == ALGORITHMTYPE.Constant) && (
            <ConstantReport values={g.volumeP as ConstantValues} />
          )}
          {!!(g.volumeP.algorithmType == ALGORITHMTYPE.Autoregressive) && (
            <AutoregressiveReport values={g.volumeP as AutoregressiveValues} />
          )}
          {!!(g.volumeP.algorithmType == ALGORITHMTYPE.Oscillator) && (
            <OscillatorReport values={g.volumeP as OscillatorValues} />
          )}
          {!!(g.volumeP.algorithmType == ALGORITHMTYPE.Markovian) && (
            <MarkovianReport values={g.volumeP as MarkovianValues} />
          )}
          {!!(g.volumeP.algorithmType == ALGORITHMTYPE.Wiener) && (
            <WeinerReport values={g.volumeP as WienerValues} />
          )}
          {!!(g.volumeP.algorithmType == ALGORITHMTYPE.Sequencer) && (
            <SequencerReport values={g.volumeP as SequenceValues} />
          )}
        </div>
      </div>
      <div>
        <div>
          <h4>Pan ([-1, +1]) Algorithm Type: {g.panP.algorithmType}</h4>
        </div>
        <div>
          {!!(g.panP.algorithmType == ALGORITHMTYPE.Constant) && (
            <ConstantReport values={g.panP as ConstantValues} />
          )}
          {!!(g.panP.algorithmType == ALGORITHMTYPE.Autoregressive) && (
            <AutoregressiveReport values={g.panP as AutoregressiveValues} />
          )}
          {!!(g.panP.algorithmType == ALGORITHMTYPE.Oscillator) && (
            <OscillatorReport values={g.panP as OscillatorValues} />
          )}
          {!!(g.panP.algorithmType == ALGORITHMTYPE.Markovian) && (
            <MarkovianReport values={g.panP as MarkovianValues} />
          )}
          {!!(g.panP.algorithmType == ALGORITHMTYPE.Wiener) && (
            <WeinerReport values={g.panP as WienerValues} />
          )}
          {!!(g.panP.algorithmType == ALGORITHMTYPE.Sequencer) && (
            <SequencerReport values={g.panP as SequenceValues} />
          )}
        </div>
      </div>
    </>
  );
}
interface ConstantReportProps {
  values: ConstantValues;
}
function ConstantReport(props: ConstantReportProps): JSX.Element {
  const { values: v } = props;
  return <div>{`Value: ${v.values.value}`}</div>;
}
interface AutoregressiveReportProps {
  values: AutoregressiveValues;
}
function AutoregressiveReport(props: AutoregressiveReportProps): JSX.Element {
  const { values: v } = props;
  return (
    <div>
      {`Initial Value: ${v.values.initialValue} Seed: ${v.values.seed} Alpha: ${v.values.alpha} ` +
        `Dispersion: ${v.values.sigma} Lo: ${v.values.lo} Hi: ${v.values.hi}`}
    </div>
  );
}
interface OscillatorReportProps {
  values: OscillatorValues;
}

function OscillatorReport(props: OscillatorReportProps): JSX.Element {
  const { values: v } = props;
  return (
    <div>
      {`Modulator Type: ${v.values.type} Center: ${v.values.center} ` +
        `Frequency (mHz): ${v.values.frequency} Amplitude: ${v.values.amplitude} ` +
        `Phase (deg): ${v.values.phase}`}
    </div>
  );
}

interface MarkovianReportProps {
  values: MarkovianValues;
}

function MarkovianReport(props: MarkovianReportProps): JSX.Element {
  const { values: v } = props;
  return (
    <>
      <div>
        <div>
          <table>
            <thead>
              <tr>
                <th>Seed</th>
                <th>Start</th>
                <th>Lo</th>
                <th>Hi</th>
                <th>Step</th>
              </tr>
            </thead>
            <tbody>
              <td>{v.values.seed}</td>
              <td>{v.values.startValue}</td>
              <td>{v.values.range.lo}</td>
              <td>{v.values.range.hi}</td>
              <td>{v.values.range.step}</td>
            </tbody>
          </table>
        </div>
        <div>
          <table>
            <thead>
              <tr>
                <th>From/To</th>
                <th>Same</th>
                <th>Up</th>
                <th>Down</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Same</td>
                <td>{v.values.same.same}</td>
                <td>{v.values.same.up}</td>
                <td>{v.values.same.down}</td>
              </tr>
              <tr>
                <td>Up</td>
                <td>{v.values.up.same}</td>
                <td>{v.values.up.up}</td>
                <td>{v.values.up.down}</td>
              </tr>
              <tr>
                <td>Down</td>
                <td>{v.values.down.same}</td>
                <td>{v.values.down.up}</td>
                <td>{v.values.down.down}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

interface WeinerReportProps {
  values: WienerValues;
}

function WeinerReport(props: WeinerReportProps): JSX.Element {
  const { values: v } = props;
  return (
    <div>
      {`Seed: ${v.values.seed} Initial Value: ${v.values.initialValue} ` +
        `Trend (1/sec): ${v.values.alpha} Dispersion (1/sqrt(sec)): ${v.values.sigma} ` +
        `Lo: ${v.values.lo} Hi: ${v.values.hi} `}
    </div>
  );
}

interface SequencerReportProps {
  values: SequenceValues;
}

function SequencerReport(props: SequencerReportProps): JSX.Element {
  const { values: v } = props;
  return (
    <div>{`Sequence Name: ${v.values.name} Transpose: ${v.values.transpose}`}</div>
  );
}
