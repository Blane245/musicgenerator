import CMGFile from "classes/cmgfile";
import Track from "classes/track";
import { ReactNode } from "react";
import SourceReport from "./sourcereport";
import TrackReport from "./trackreport";
import { ReportSourceData } from "types";
import getSourceData from "./getsourcedata";
import reportStyles from './report.css?inline';

export default function Report(fileContents: CMGFile): ReactNode {
  const sourceData: ReportSourceData[] = getSourceData({generator: null, fileContents,});
  return (
    <html>
      <head>
        <style>{reportStyles}</style>
      </head>
      <body>
        <div className="report">
          <h1>
            {"File: " +
              fileContents.name +
              "\tCMG Version: " +
              fileContents.version}
          </h1>
          <h2>Tracks</h2>
          {fileContents.tracks.map((t: Track) => (
            <TrackReport track={t} sourceData={sourceData} />
          ))}
          <hr />
          <SourceReport generator={null} sourceData={sourceData} />
          <hr />
        </div>
      </body>
    </html>
  );
}
