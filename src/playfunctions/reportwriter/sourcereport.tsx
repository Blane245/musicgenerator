import CMGFile from "classes/cmgfile";
import { Algorithmic, AudioFile, Silent } from "classes/generators";
import { buildSources } from "playfunctions/buildsources";
import ReadyPlay from "playfunctions/readyplay";
import { signalLevel } from "utils/signallevel";
import {
  GENERATORTYPE,
  GeneratorType,
  PLAYMODE,
  RawSourceData,
} from "../../types";

export interface SourceReportProps {
  generator: GeneratorType | undefined; // undefined if for all generators
  fileContents: CMGFile;
}

export default function SourceReport(props: SourceReportProps): JSX.Element {
  const { generator, fileContents } = props;
  let sources: RawSourceData[] = [];
  let error: string = "";
  if (generator != undefined) {
    const AlgorithmicGenerators: Algorithmic[] = [];
    const AudioFileGenerators: AudioFile[] = [];
    const SilentGenerators: Silent[] = [];
    if (generator.type == GENERATORTYPE.Silent)
      SilentGenerators.push(generator as Silent);
    else if (generator.type == GENERATORTYPE.Algorithmic)
      AlgorithmicGenerators.push(generator as Algorithmic);
    else if (generator.type == GENERATORTYPE.AudioFile)
      AudioFileGenerators.push(generator as AudioFile);
    const result = buildSources({
      fileContents,
      AlgorithmicGenerators,
      AudioFileGenerators,
      SilentGenerators,
    });
    sources = result.sources;
    error = result.error;
  } else {
    const {
      AlgorithmicGenerators,
      AudioFileGenerators,
      SilentGenerators,
    } = ReadyPlay({
      mode: PLAYMODE.preview,
      generator: null,
      fileContents,
      timeInterval: { startOffset: 0, endOffset: 0 },
    });
    const result = buildSources({
      fileContents,
      AlgorithmicGenerators,
      AudioFileGenerators,
      SilentGenerators,
    });
    sources = result.sources;
    error = result.error;
  }
  return (
    <>
      {error != "" ? <h5>Error in source construction - {error}</h5> : null}
      {generator ? (
        <h5>
          Generators Sources for {generator.name}:{generator.type}, start/stop{" "}
          {generator.startTime.toFixed(3)}/{generator.stopTime.toFixed(3)}
        </h5>
      ) : (
        <h5>Generator Sources for Composition in Start Time Order</h5>
      )}
      <table>
        <thead>
          <tr>
            <th>Start Time (sec)</th>
            <th>Stop Time (sec)</th>
            <th>Instrument Name</th>
            <th>Sample Rate (samples/sec)</th>
            <th>Sample Count</th>
            <th>Looping?</th>
            <th>Root Key (pitch)</th>
            <th>Pitch Correction (cents)</th>
            <th>Playback Rate</th>
            <th>Attack Enabled?</th>
            <th>Delay (sec)</th>
            <th>Attack (sec)</th>
            <th>Hold (sec)</th>
            <th>Decay (sec)</th>
            <th>End (sec)</th>
            <th>Release (sec)</th>
            <th>Total Duration (sec)</th>
          </tr>
          <tr>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th></th>
            <th>Volume Gain</th>
            <th>Attenuation Gain</th>
            <th>Sustain Gain</th>
            <th>End Gain</th>
            <th>Average Signal Level</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s: RawSourceData) => (
            <>
              <tr>
                <td>{s.source.startTime.toFixed(2)}</td>
                <td>{s.source.stopTime.toFixed(2)}</td>
                <td>{s.instrument?.name}</td>
                <td>{s.source.sampleRate.toFixed(0)}</td>
                <td>{s.source.sample[0].length}</td>
                <td>{s.instrument?.loop ? "true" : "false"}</td>
                <td>{s.instrument?.rootKey.toFixed(0)}</td>
                <td>{s.instrument?.cents.toFixed(0)}</td>
                <td>{s.source.playbackRate.toFixed(6)}</td>
                <td>{(s.gen as Algorithmic).attackEnabled? "true": "false"}</td>
                <td>{s.instrument?.delayEnd.toFixed(3)}</td>
                <td>{s.instrument?.attackEnd.toFixed(3)}</td>
                <td>{s.instrument?.holdEnd.toFixed(3)}</td>
                <td>{s.instrument?.decayEnd.toFixed(3)}</td>
                <td>{s.instrument?.noteEnd.toFixed(3)}</td>
                <td>{s.instrument?.releaseEnd.toFixed(3)}</td>
                <td>{s.instrument?.totalTime.toFixed(3)}</td>
              </tr>
              <tr>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td>{s.instrument?.volumeGain.toFixed(3)}</td>
                <td>{s.instrument?.attenuation.toFixed(3)}</td>
                <td>{s.instrument?.sustainGain.toFixed(3)}</td>
                <td>{s.instrument?.noteEndGain.toFixed(3)}</td>
                <td>{signalLevel(s.source.sample[0]).toFixed(5)}</td>
              </tr>
            </>
          ))}
        </tbody>
      </table>
    </>
  );
}
