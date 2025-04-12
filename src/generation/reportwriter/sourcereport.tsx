import {
  GENERATIONMODE,
  GENERATORTYPE,
  GeneratorType,
  RawSourceData,
} from "../../types";
import { Algorithmic, AudioFile, CMG } from "../../classes/generators";
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
    const CMGenerators: CMG[] = [];
    if (generator.type == GENERATORTYPE.CMG)
      CMGenerators.push(generator as CMG);
    else if (generator.type == GENERATORTYPE.Algorithmic)
      AlgorithmicGenerators.push(generator as Algorithmic);
    else if (generator.type == GENERATORTYPE.AudioFile)
      AudioFileGenerators.push(generator as AudioFile);
    const result = buildSources({
      AlgorithmicGenerators,
      AudioFileGenerators,
      CMGenerators,
    });
    sources = result.sources;
    error = result.error;
  } else {
    const { AlgorithmicGenerators, AudioFileGenerators, CMGenerators } =
      ReadyGenerate({
        mode: GENERATIONMODE.preview,
        generator: null,
        fileContents,
        timeInterval: { startOffset: 0, endOffset: 0 },
      });
    const result = buildSources({
      AlgorithmicGenerators,
      AudioFileGenerators,
      CMGenerators,
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
            {!generator? 
            (<th>Generator</th>)
            :null}
            <th>Start Time</th>
            <th>Stop Time</th>
            <th>Duration</th>
            <th>Note</th>
            <th>Sample Count</th>
            <th>
              Vol
              <br />
              Delay
            </th>
            <th>
              Vol
              <br />
              Attack
            </th>
            <th>
              Vol
              <br />
              Hold
            </th>
            <th>
              Vol
              <br />
              Decay
            </th>
            <th>
              Vol
              <br />
              Sustain
            </th>
            <th>
              Vol
              <br />
              Sustain
              <br />
              Level
            </th>
            <th>
              Vol
              <br />
              Release
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
            {!generator? 
            (<th>{s.gen.name}</th>)
            :null}
              <td>{s.source.startTime.toFixed(3)}</td>
              <td>{s.source.stopTime.toFixed(3)}</td>
              <td>{s.source.duration.toFixed(3)}</td>
              <td>{s.source.note.toFixed(2)}</td>
              <td>{s.source.sample[0].length}</td>
              <td>{(s.source.startTime + s.vol.delayInterval).toFixed(3)}</td>
              <td>{(s.source.startTime + s.vol.attackInterval).toFixed(3)}</td>
              <td>{(s.source.startTime + s.vol.holdInterval).toFixed(3)}</td>
              <td>{(s.source.startTime + s.vol.decayInterval).toFixed(3)}</td>
              <td>{(s.source.startTime + s.vol.sustainInterval).toFixed(3)}</td>
              <td>{s.vol.sustainLevel}</td>
              <td>{(s.source.startTime + s.vol.releaseInterval).toFixed(3)}</td>
              <td>{s.vol.value.toFixed(3)}</td>
              <td>{s.panner.value.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
