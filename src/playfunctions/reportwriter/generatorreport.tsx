import SequenceValues, {
  AutoregressiveValues,
  ConstantValues,
  MarkovianValues,
  OscillatorValues,
  WienerValues,
} from "classes/algorithmvalues";
import CMGFile from "classes/cmgfile";
import { Algorithmic, AudioFile } from "classes/generators/generators";
import { ALGORITHMTYPE, GENERATORTYPE, GeneratorType } from "types";
import SourceReport from "./sourcereport";

export interface GeneratorReportProps {
  generator: GeneratorType;
  fileContents: CMGFile;
}

export default function GeneratorReport(
  props: GeneratorReportProps
): JSX.Element {
  const { generator, fileContents } = props;

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>
              Start Time
              <br />
              (sec)
            </th>
            <th>
              Stop Time
              <br />
              (sec)
            </th>
          </tr>
        </thead>
        <tbody>
          <td>{generator.name}</td>
          <td>{generator.type}</td>
          <td>{generator.startTime}</td>
          <td>{generator.stopTime}</td>
        </tbody>
      </table>
      {generator.type == GENERATORTYPE.Algorithmic ? (
        <AlgorithmicReport generator={generator as Algorithmic} />
      ) : null}
      {generator.type == GENERATORTYPE.AudioFile ? (
        <AudioFileReport generator={generator as AudioFile} />
      ) : null}
      <SourceReport generator={generator} fileContents={fileContents} />
    </>
  );
}
interface AlgorithmicReportProps {
  generator: Algorithmic;
}

function AlgorithmicReport(props: AlgorithmicReportProps): JSX.Element {
  const { generator: g } = props;
  return (
    <>
      <table>
        <thead>
          <tr>
            <th> Soundfont File </th>
            <th> Preset </th>
            <th> Looping </th>
            <th> Attack Enabled? </th>
            <th> Measure Length </th>
            <th> On Beats </th>
            <th> Notes in Octave </th>
            <th> Noise seed </th>
            <th>
              {" "}
              Noise Frequency
              <br />
              (Hz)
            </th>
            <th>
              {" "}
              Noise Amplitude
              <br />
              (gain)
            </th>
            <th>
              {" "}
              Reverb Duration
              <br />
              (sec)
            </th>
            <th>
              {" "}
              Reverb Decay
              <br />
              (sec)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td> {g.soundFontFile} </td>
            <td> {g.presetName} </td>
            <td> {g.isLooping.toString()} </td>
            <td> {g.attackEnabled.toString()} </td>
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
      <div className="container">
        <div>
          <h4>Note (pitch) Algorithm Type: {g.noteP?.algorithmType}</h4>
        </div>
        <div>
          {!!(g.noteP.algorithmType == ALGORITHMTYPE.Constant) && (
            <ConstantReport values={g.noteP as ConstantValues} />
          )}
          {!!(g.noteP?.algorithmType == ALGORITHMTYPE.Autoregressive) && (
            <AutoregressiveReport values={g.noteP as AutoregressiveValues} />
          )}
          {!!(g.noteP?.algorithmType == ALGORITHMTYPE.Markovian) && (
            <MarkovianReport values={g.noteP as MarkovianValues} />
          )}
          {!!(g.noteP?.algorithmType == ALGORITHMTYPE.Wiener) && (
            <WeinerReport values={g.noteP as WienerValues} />
          )}
          {!!(g.noteP?.algorithmType == ALGORITHMTYPE.Sequencer) && (
            <SequencerReport values={g.noteP as SequenceValues} />
          )}
        </div>
      </div>
      <div className="container">
        <div>
          <h4>Attack (0-127) Algorithm Type: {g.attackP?.algorithmType}</h4>
        </div>
        <div>
          {!!(g.attackP?.algorithmType == ALGORITHMTYPE.Constant) && (
            <ConstantReport values={g.attackP as ConstantValues} />
          )}
          {!!(g.attackP?.algorithmType == ALGORITHMTYPE.Autoregressive) && (
            <AutoregressiveReport values={g.attackP as AutoregressiveValues} />
          )}
          {!!(g.attackP?.algorithmType == ALGORITHMTYPE.Markovian) && (
            <MarkovianReport values={g.attackP as MarkovianValues} />
          )}
          {!!(g.attackP?.algorithmType == ALGORITHMTYPE.Wiener) && (
            <WeinerReport values={g.attackP as WienerValues} />
          )}
          {!!(g.attackP?.algorithmType == ALGORITHMTYPE.Sequencer) && (
            <SequencerReport values={g.attackP as SequenceValues} />
          )}
        </div>
      </div>
      <div className="container">
        <div>
          <h4>Speed (BPM) Algorithm Type: {g.speedP?.algorithmType}</h4>
        </div>
        <div>
          {!!(g.speedP?.algorithmType == ALGORITHMTYPE.Constant) && (
            <ConstantReport values={g.speedP as ConstantValues} />
          )}
          {!!(g.speedP?.algorithmType == ALGORITHMTYPE.Autoregressive) && (
            <AutoregressiveReport values={g.speedP as AutoregressiveValues} />
          )}
          {!!(g.speedP?.algorithmType == ALGORITHMTYPE.Oscillator) && (
            <OscillatorReport values={g.speedP as OscillatorValues} />
          )}
          {!!(g.speedP?.algorithmType == ALGORITHMTYPE.Markovian) && (
            <MarkovianReport values={g.speedP as MarkovianValues} />
          )}
          {!!(g.speedP?.algorithmType == ALGORITHMTYPE.Wiener) && (
            <WeinerReport values={g.speedP as WienerValues} />
          )}
          {!!(g.speedP?.algorithmType == ALGORITHMTYPE.Sequencer) && (
            <SequencerReport values={g.speedP as SequenceValues} />
          )}
        </div>
      </div>
      <div className="container">
        <div>
          <h4>Duration (%) Algorithm Type: {g.durationP?.algorithmType}</h4>
        </div>
        <div>
          {!!(g.durationP?.algorithmType == ALGORITHMTYPE.Constant) && (
            <ConstantReport values={g.durationP as ConstantValues} />
          )}
          {g.durationP?.algorithmType == ALGORITHMTYPE.Autoregressive ? (
            <AutoregressiveReport
              values={g.durationP as AutoregressiveValues}
            />
          ) : null}
          {!!(g.durationP?.algorithmType == ALGORITHMTYPE.Oscillator) && (
            <OscillatorReport values={g.durationP as OscillatorValues} />
          )}
          {!!(g.durationP?.algorithmType == ALGORITHMTYPE.Markovian) && (
            <MarkovianReport values={g.durationP as MarkovianValues} />
          )}
          {!!(g.durationP?.algorithmType == ALGORITHMTYPE.Wiener) && (
            <WeinerReport values={g.durationP as WienerValues} />
          )}
          {!!(g.durationP?.algorithmType == ALGORITHMTYPE.Sequencer) && (
            <SequencerReport values={g.durationP as SequenceValues} />
          )}
        </div>
      </div>
      <div className="container">
        <h4>Volume (dB) Algorithm Type: {g.volumeP?.algorithmType}</h4>
        <div>
          {!!(g.volumeP?.algorithmType == ALGORITHMTYPE.Constant) && (
            <ConstantReport values={g.volumeP as ConstantValues} />
          )}
          {!!(g.volumeP?.algorithmType == ALGORITHMTYPE.Autoregressive) && (
            <AutoregressiveReport values={g.volumeP as AutoregressiveValues} />
          )}
          {!!(g.volumeP?.algorithmType == ALGORITHMTYPE.Oscillator) && (
            <OscillatorReport values={g.volumeP as OscillatorValues} />
          )}
          {!!(g.volumeP?.algorithmType == ALGORITHMTYPE.Markovian) && (
            <MarkovianReport values={g.volumeP as MarkovianValues} />
          )}
          {!!(g.volumeP?.algorithmType == ALGORITHMTYPE.Wiener) && (
            <WeinerReport values={g.volumeP as WienerValues} />
          )}
          {!!(g.volumeP?.algorithmType == ALGORITHMTYPE.Sequencer) && (
            <SequencerReport values={g.volumeP as SequenceValues} />
          )}
        </div>
      </div>
      <div className="container">
        <div>
          <h4>Pan Algorithm Type: {g.panP?.algorithmType}</h4>
        </div>
        <div>
          {!!(g.panP?.algorithmType == ALGORITHMTYPE.Constant) && (
            <ConstantReport values={g.panP as ConstantValues} />
          )}
          {!!(g.panP?.algorithmType == ALGORITHMTYPE.Autoregressive) && (
            <AutoregressiveReport values={g.panP as AutoregressiveValues} />
          )}
          {!!(g.panP?.algorithmType == ALGORITHMTYPE.Oscillator) && (
            <OscillatorReport values={g.panP as OscillatorValues} />
          )}
          {!!(g.panP?.algorithmType == ALGORITHMTYPE.Markovian) && (
            <MarkovianReport values={g.panP as MarkovianValues} />
          )}
          {!!(g.panP?.algorithmType == ALGORITHMTYPE.Wiener) && (
            <WeinerReport values={g.panP as WienerValues} />
          )}
          {!!(g.panP?.algorithmType == ALGORITHMTYPE.Sequencer) && (
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
  return (
    <table>
      <thead>
        <tr>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{v.values.value}</td>
        </tr>
      </tbody>
    </table>
  );
}
interface AutoregressiveReportProps {
  values: AutoregressiveValues;
}
function AutoregressiveReport(props: AutoregressiveReportProps): JSX.Element {
  const { values: v } = props;
  return (
    <table>
      <thead>
        <tr>
          <th>Initial Value</th>
          <th>Seed</th>
          <th>Alpha</th>
          <th>Dispersion</th>
          <th>Lo</th>
          <th>Hi</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{v.values.initialValue}</td>
          <td>{v.values.seed}</td>
          <td>{v.values.alpha}</td>
          <td>{v.values.sigma}</td>
          <td>{v.values.lo}</td>
          <td>{v.values.hi}</td>
        </tr>
      </tbody>
    </table>
  );
}
interface OscillatorReportProps {
  values: OscillatorValues;
}

function OscillatorReport(props: OscillatorReportProps): JSX.Element {
  const { values: v } = props;
  return (
    <table>
      <thead>
        <tr>
          <th>Modulator Type</th>
          <th>Center</th>
          <th>
            Frequency
            <br />
            (mHz)
          </th>
          <th>Amplitude</th>
          <th>
            Phase
            <br />
            (deg)
          </th>
        </tr>
      </thead>
      <tbody>
        <td>{v.values.type}</td>
        <td>{v.values.center}</td>
        <td>{v.values.frequency}</td>
        <td>{v.values.amplitude}</td>
        <td>{v.values.phase}</td>
      </tbody>
    </table>
  );
}

interface MarkovianReportProps {
  values: MarkovianValues;
}

function MarkovianReport(props: MarkovianReportProps): JSX.Element {
  const { values: v } = props;
  return (
    <>
      <div className="container">
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
    <table>
      <thead>
        <tr>
          <th>Seed</th>
          <th>Initial Value</th>
          <th>
            Trend
            <br />
            (1/sec)
          </th>
          <th>
            Dispersion
            <br />
            (1/sqrt(sec))
          </th>
          <th>Lo</th>
          <th>Hi</th>
        </tr>
      </thead>
      <tbody>
        <td>{v.values.seed}</td>
        <td>{v.values.initialValue}</td>
        <td>{v.values.alpha}</td>
        <td>{v.values.sigma}</td>
        <td>{v.values.lo}</td>
        <td>{v.values.hi}</td>
      </tbody>
    </table>
  );
}

interface SequencerReportProps {
  values: SequenceValues;
}

function SequencerReport(props: SequencerReportProps): JSX.Element {
  const { values: v } = props;
  return (
    <table>
      <thead>
        <tr>
          <th>Sequence Name</th>
          <th>Tansposition</th>
        </tr>
      </thead>
      <tbody>
        <td>{v.values.name}</td>
        <td>{v.values.transpose}</td>
      </tbody>
    </table>
  );
}

interface AudioFileReportProps {
  generator: AudioFile;
}

function AudioFileReport(props: AudioFileReportProps): JSX.Element {
  const { generator: g } = props;
  return (
    <table>
      <thead>
        <tr>
          <th>File Name</th>
          <th>Sample Count</th>
          <th>Sample Rate</th>
          <th>Duration</th>
          <th>Volume</th>
        </tr>
      </thead>
      <tbody>
        <td>{g.fileName}</td>
        <td>{g.samples.length}</td>
        <td>{g.sampleRate}</td>
        <td>{g.duration}</td>
        <td>{g.volume}</td>
      </tbody>
    </table>
  );
}
