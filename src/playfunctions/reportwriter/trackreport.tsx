// import CMGFile from "classes/cmgfile";
// import Track from "classes/track";
// import { GeneratorType } from "types";
// import GeneratorReport from "./generatorreport";

// export interface TrackReportProps {
//   track: Track;
//   fileContents: CMGFile;
// }

// export default function TrackReport(props: TrackReportProps): JSX.Element {
//   const { track, fileContents } = props;

//   return (
//     <>
//       <h2>Track Name: {track.name}</h2>
//       <h3>Generators</h3>
//       {track.generators
//         .sort((a, b) => a.startTime - b.startTime)
//         .map((g: GeneratorType) => (
//           <>
//             <GeneratorReport generator={g} fileContents={fileContents} />
//             <hr />
//           </>
//         ))}
//     </>
//   );
// }
