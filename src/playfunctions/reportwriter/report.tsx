import CMGFile from "classes/cmgfile";
import Track from "classes/track";
import { ReactNode } from "react";
import SourceReport from "./sourcereport";
import TrackReport from "./trackreport";
import { ReportSourceData } from "types";
import getReportData from "./getreportdata";
import reportStyles from './report.css?inline';

export default function Report(fileContents: CMGFile): ReactNode {
  const reportData: ReportSourceData[] = getReportData({generator: null, fileContents,});
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
            <TrackReport track={t} reportData={reportData} />
          ))}
          <hr />
          <SourceReport generator={null} playData={reportData} />
          <hr />
        </div>
      </body>
    </html>
  );
}
