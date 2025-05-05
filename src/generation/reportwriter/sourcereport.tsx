import {
  GENERATIONMODE,
  GENERATORTYPE,
  GeneratorType,
  RawSourceData,
} from "../../types";
import { Algorithmic, AudioFile, Silent } from "../../classes/generators";
import { buildSources } from "../../generation/buildsources";
import ReadyGenerate from "../../generation/readygenerate";
import CMGFile from "../../classes/cmgfile";

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
      AlgorithmicGenerators,
      AudioFileGenerators,
      SilentGenerators,
    });
    sources = result.sources;
    error = result.error;
  } else {
    const { AlgorithmicGenerators, AudioFileGenerators, SilentGenerators } =
      ReadyGenerate({
        mode: GENERATIONMODE.preview,
        generator: null,
        fileContents,
        timeInterval: { startOffset: 0, endOffset: 0 },
      });
    const result = buildSources({
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
        <h5>Generators Sources for {generator.name}</h5>
      ) : (
        <h5>Generator Sources for Composition in Start Time Order</h5>
      )}
      <table>
        <thead>
          <tr>
            {!generator ? <th>Generator</th> : null}
            <th>Start Time</th>
            <th>Stop Time</th>
            <th>Duration</th>
            <th>Note</th>
            <th>Sample Count</th>
            <th>
              Playback
              <br />
              Rate
            </th>
            <th>
              Delay
              <br />
              (sec)
            </th>
            <th>
              Attack
              <br />
              (sec)
            </th>
            <th>
              Hold
              <br />
              (sec)
            </th>
            <th>
              Decay
              <br />
              (sec)
            </th>
            <th>
              Sustain
              <br />
              (sec)
            </th>
            <th>
              Sustain
              <br />
              Level
            </th>
            <th>
              Release
              <br />
              (sec)
            </th>
            <th>
              Attenuation
              <br />
              (dB)
            </th>
            <th>
              Vol
              <br />
              Value
            </th>
            <th>
              Pan
              <br />
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s: RawSourceData) => (
            <tr>
              {!generator ? <th>{s.gen.name}</th> : null}
              <td>{s.source.startTime.toFixed(3)}</td>
              <td>{s.source.stopTime.toFixed(3)}</td>
              <td>{s.source.duration.toFixed(3)}</td>
              <td>{s.source.note.toFixed(2)}</td>
              <td>{s.source.sample[0].length}</td>
              <td>{s.source.playbackRate.toFixed(3)}</td>
              <td>{(s.source.startTime + s.vol.delayInterval).toFixed(3)}</td>
              <td>
                {(
                  s.source.startTime +
                  s.vol.delayInterval +
                  s.vol.attackInterval
                ).toFixed(3)}
              </td>
              <td>
                {(
                  s.source.startTime +
                  s.vol.delayInterval +
                  s.vol.attackInterval
                ).toFixed(3)}
              </td>
              <td>
                {(
                  s.source.startTime +
                  s.vol.delayInterval +
                  s.vol.attackInterval +
                  s.vol.decayInterval
                ).toFixed(3)}
              </td>
              <td>
                {(
                  s.source.startTime +
                  s.vol.delayInterval +
                  s.vol.attackInterval +
                  s.vol.decayInterval +
                  s.vol.sustainInterval
                ).toFixed(3)}
              </td>
              <td>{s.vol.sustainLevel}</td>
              <td>{s.source.stopTime.toFixed(3)}</td>
              <td>{s.vol.initialAttenuation.toFixed(0)}</td>
              <td>{s.vol.value.toFixed(3)}</td>
              <td>{s.panner.value.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
