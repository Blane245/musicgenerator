import { Fragment } from "react";
import { GeneratorType, ReportInstrument, ReportSourceData } from "../../types";

export interface SourceReportProps {
  generator: GeneratorType | null; // undefined if for all generators
  playData: ReportSourceData[];
}

export default function SourceReport(props: SourceReportProps): JSX.Element {
  // this will report on a single generator or all generators

  const { generator, playData: playData } = props;

  // report produced for all generators or a specific one
  const sources: ReportSourceData[] = generator
    ? playData.filter(
        (s: ReportSourceData) => generator.name == s.generatorName,
      )
    : playData;
      const key: string = generator? generator.name: 'all';
  // draw the gain envelope for one instrument, scaling the time to account for all of the instrument's in the source
  const ENVELOPEWIDTH: number = 500;
  const ENVELOPEHEIGHT: number = 50;
  const getGainEnvelope = (
    instrument: ReportInstrument,
    source: ReportSourceData,
  ): JSX.Element[] => {
    const result: JSX.Element[] = [];

    // get the longest total time of all of the instruments for scaling
    let maxTime: number = 0;
    source.instrument.forEach((i) => {
      i.envelope.forEach((e) => {
        maxTime = Math.max(e.t, maxTime);
      });
    });
    if (maxTime == 0 || instrument.envelope.length == 0)
      return [<div>No Signal Envelopes to Display</div>];

    const xScale: number = ENVELOPEWIDTH / maxTime;
    const yScale: number = ENVELOPEHEIGHT / 1; // max gain is one

    const lineTo = (x: number, y: number): string => {
      return `L${x * xScale} ${yScale * (1 - y)} `;
    };

    let path: string = "";
    path += `M0 ${ENVELOPEHEIGHT} `;
    instrument.envelope.forEach((e: { t: number; g: number }) => {
      path += lineTo(e.t, e.g);
    });
    path += "Z";
    result.push(
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height={ENVELOPEHEIGHT.toString() + "px"}
        width={ENVELOPEWIDTH.toString() + "px"}
        key={`envelope-${source.generatorName}-${instrument.name}`}
      >
        <path d={path} fill="black" />
      </svg>,
    );
    result.push(<div>{`duration: ${maxTime.toFixed(2)} (sec)`}</div>);
    return result;
  };
  return (
    <>
      {sources.length > 0 ? (
        <>
          {generator ? (
            <h4>Sources</h4>
          ) : (
            <h1>Generator Sources for Composition</h1>
          )}
          <table>
            <thead>
              <tr>
                <th>Start Time (sec)</th>
                <th>Stop Time (sec)</th>
                <th>SoundFont</th>
                <th>Preset</th>
                <th>Start Pitch (midi)</th>
                <th>End Pitch (midi)</th>
                <th>Instrument Name</th>
                <th>Looping?</th>
                <th>Start Loop (samples)</th>
                <th>End Loop (samples)</th>
                <th>Root Key (midi)</th>
                <th>Start cents</th>
                <th>End cents</th>
                <th>Sample Rate (samples/sec)</th>
                <th>Sample Count</th>
                <th>Attack Enabled?</th>
                <th>Gain Envelope</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s: ReportSourceData, sIndex: number) => (
                <Fragment key={`g-${key}-source-${sIndex}`}>
                  {s.instrument.map((i: ReportInstrument, iIndex: number) => (
                    <tr key={`g-${key}-source-${sIndex}-instrument${iIndex}`}>
                      <td>{s.startTime.toFixed(2)}</td>
                      <td>{s.stopTime.toFixed(2)}</td>
                      <td>{s.soundFontName}</td>
                      <td>{s.presetName}</td>
                      <td>{s.startPitch.toFixed(2)}</td>
                      <td>{s.endPitch.toFixed(2)}</td>
                      <td>{i.name}</td>
                      <td>{i.loopEnabled ? "true" : "false"}</td>
                      <td>{i.loopStart.toFixed(0)}</td>
                      <td>{i.loopEnd.toFixed(0)}</td>
                      <td>{i.rootKey.toFixed(0)}</td>
                      <td>{i.startCents.toFixed(0)}</td>
                      <td>{i.endCents.toFixed(0)}</td>
                      <td>{i.sampleRate.toFixed(0)}</td>
                      <td>{i.sampleCount.toFixed(0)}</td>
                      <td>{i.attackEnabled ? "true" : "false"}</td>
                      <td>{getGainEnvelope(i, s)}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <h4>No sources</h4>
      )}
    </>
  );
}
