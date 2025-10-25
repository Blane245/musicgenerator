import CMGFile from "classes/cmgfile";
import { Algorithmic, AudioFile, Silent } from "classes/generators";
import { buildSources } from "playfunctions/buildsources";
import ReadyPlay from "playfunctions/readyplay";
import {
  PLAYMODE,
  GENERATORTYPE,
  GeneratorType,
  RawSourceData,
} from "../../types";
import { dBToGain } from "sfcomponents/util";

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
            <th>Instrument</th>
            <th>Start Time</th>
            <th>Duration</th>
            <th>Stop Time</th>
            <th>Note</th>
            <th>Loop</th>
            <th>Loop Start</th>
            <th>Loop End</th>
            <th>Sample Count</th>
            <th>Sample Rate</th>
            <th>Instrument Sample Count</th>
            <th>Instrument Sample Rate</th>
            <th>Volume</th>
            <th>Sustain</th>
            <th>Attenuation</th>
            <th>Pan</th>
          </tr>
          <tr>
            <th>Root Key</th>
            <th>Cents</th>
            <th>Delay</th>
            <th>Attack</th>
            <th>Hold</th>
            <th>Decay</th>
            <th>Interval</th>
            <th>Duration</th>
            <th>Note End</th>
            <th>Release</th>
            <th>Total Time</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s: RawSourceData) => (
            <>
              <tr>
                <td>{s.instrument?.name}</td>
                <td>{s.source.startTime.toFixed(3)}</td>
                <td>{s.source.duration.toFixed(3)}</td>
                <td>{s.source.stopTime.toFixed(3)}</td>
                <td>{s.source.note.toFixed(2)}</td>
                <td>{s.instrument?.loop ? "true" : "false"}</td>
                <td>{s.instrument?.loopStart}</td>
                <td>{s.instrument?.loopEnd}</td>
                <td>{s.source.sample[0].length}</td>
                <td>{s.source.sampleRate.toFixed(0)}</td>
                <td>{s.instrument?.sample.length}</td>
                <td>{s.instrument?.sampleRate.toFixed(0)}</td>
                <td>{dBToGain(s.vol.value).toFixed(1)}</td>
                <td>{s.instrument?.sustainGain.toFixed(1)}</td>
                <td>{s.instrument?.attenuation.toFixed(1)}</td>
                <td>{s.panner.value.toFixed(1)}</td>
              </tr>
              <tr>
                <td>{s.instrument?.rootKey}</td>
                <td>{s.instrument?.cents}</td>
                <td>{s.instrument?.delayEnd.toFixed(3)}</td>
                <td>{s.instrument?.attackEnd.toFixed(3)}</td>
                <td>{s.instrument?.holdEnd.toFixed(3)}</td>
                <td>{s.instrument?.decayEnd.toFixed(3)}</td>
                <td>{s.instrument?.interval.toFixed(3)}</td>
                <td>{s.instrument?.duration.toFixed(3)}</td>
                <td>{s.instrument?.noteEnd.toFixed(3)}</td>
                <td>{s.instrument?.releaseEnd.toFixed(3)}</td>
                <td>{s.instrument?.totalTime.toFixed(3)}</td>
              </tr>
            </>
          ))}
        </tbody>
      </table>
    </>
  );
}
