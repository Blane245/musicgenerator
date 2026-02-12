import Track from "classes/track";
import { Fragment } from "react/jsx-runtime";
import { GeneratorType, ReportSourceData } from "types";
import GeneratorReport from "./generatorreport";

export interface TrackReportProps {
  track: Track;
  sourceData: ReportSourceData[];
}

export default function TrackReport(props: TrackReportProps): JSX.Element {
  const { track, sourceData } = props;

  return (
    <>
      <h2>Track Name: {track.name} (Muted? {(track.mute)?"true":"false"} Soloed? {(track.solo)?"true":"false"} Volume (dB): {track.volume.toFixed(0)})</h2>
      {track.generators
        .sort((a, b) => a.startTime - b.startTime)
        .map((g: GeneratorType) => (
          <Fragment key={`t-${track.name}-g-${g.name}`}>
            <GeneratorReport generator={g} sourceData={sourceData} />
            <hr />
          </Fragment>
        ))}
    </>
  );
}
