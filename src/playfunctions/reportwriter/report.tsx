// import CMGFile from "classes/cmgfile";
// import Track from "classes/track";
// import SourceReport from "./sourcereport";
// import TrackReport from "./trackreport";

// export interface ReportProps {
//   fileContents: CMGFile;
// }

// export default function Report({ fileContents }) {
//   return (
//     <html>
//       <head>
//         <style>
//           {`
// html {
//   width: 11in;
//   tab-size: 8;
// }
// .report {
//   font-family: Arial, sans-serif;
//   padding: 20px;
//   tab-size: inherit;
// }
// h1 {
//   text-align: left;
//   font-size: 18px;
//   tab-size: inherit;
// }
// h2 {
//   text-align: left;
//   font-size: 17px;
//   tab-size: inherit;
// }
// h3 {
//   text-align: left;
//   font-size: 16px;
//   tab-size: inherit;
// }
// h4 {
//   text-align: left;
//   font-size: 15px;
//   tab-size: inherit;
// }
// h5 {
//   text-align: left;
//   font-size: 14px;
//   tab-size: inherit;
// }
// h6 {
//   text-align: left;
//   font-size: 13px;
//   tab-size: inherit;
// }
// h6 {
//   text-align: left;
//   font-size: 12px;
//   tab-size: inherit;
// }
// p {
//   font-size: 10px;
//   tab-size: inherit;
// }
// table {
//   width: fit-content;
//   border-collapse: collapse;
//   margin-top: 20px;
// }
// th {
//   border: 1px solid #ddd;
//   padding: 8px;
//   font-style: italics;
// }
// td {
//   border: 1px solid #ddd;
//   padding: 8px;
// }
// .container {
//   display: grid;
//   grid-template-columns: auto auto;
//   padding: 0px;
// }
// .container > div {
//   border-right: 2px;
//   align:left;
// }            
// `
// }
//         </style>
//       </head>
//       <div className="report">
//         <h1>
//           {"File: " +
//             fileContents.name +
//             "\tCMG Version: " +
//             fileContents.version}
//         </h1>
//         <h3>Reverb</h3>

//         <table>
//           <thead>
//             <tr>
//               <th>
//                 Duration
//                 <br />
//                 (sec)
//               </th>
//               <th>
//                 Decay
//                 <br />
//                 (sec)
//               </th>
//               <th>
//                 Left Wall
//                 <br />
//                 Delay (sec)
//               </th>
//               <th>
//                 Left Wall
//                 <br />
//                 Gain (dB)
//               </th>
//               <th>
//                 Right Wall
//                 <br />
//                 Delay (sec)
//               </th>
//               <th>
//                 Right Wall
//                 <br />
//                 Gain (dB)
//               </th>
//               <th>
//                 Ceiling
//                 <br />
//                 Delay (sec)
//               </th>
//               <th>
//                 Ceiling
//                 <br />
//                 Gain (dB)
//               </th>
//             </tr>
//           </thead>
//           <tbody>
//             <td>{fileContents.reverb.duration}</td>
//             <td>{fileContents.reverb.decay}</td>
//             <td>{fileContents.reverb.leftWall.delay}</td>
//             <td>{fileContents.reverb.leftWall.gain}</td>
//             <td>{fileContents.reverb.rightWall.delay}</td>
//             <td>{fileContents.reverb.rightWall.gain}</td>
//             <td>{fileContents.reverb.ceiling.delay}</td>
//             <td>{fileContents.reverb.ceiling.gain}</td>
//           </tbody>
//         </table>
//         <h3>Compressor</h3>

//         <table>
//           <thead>
//             <tr>
//               <th>
//                 Threshold
//                 <br />
//                 (dB)
//               </th>
//               <th>
//                 Knee
//                 <br />
//                 (dB)
//               </th>
//               <th>Ratio</th>
//               <th>
//                 Attack
//                 <br />
//                 (msec)
//               </th>
//               <th>
//                 Release
//                 <br />
//                 (msec)
//               </th>
//             </tr>
//           </thead>
//           <tbody>
//             <td>{fileContents.compressor.threshold}</td>
//             <td>{fileContents.compressor.knee}</td>
//             <td>{fileContents.compressor.ratio}</td>
//             <td>{fileContents.compressor.attack}</td>
//             <td>{fileContents.compressor.release}</td>
//           </tbody>
//         </table>
//         <h3>Equalizer</h3>

//         <table>
//           <thead>
//             <tr>
//               <th>32 Hz</th>
//               <th>64 Hz</th>
//               <th>125 Hz</th>
//               <th>250 Hz</th>
//               <th>500 Hz</th>
//               <th>1K Hz</th>
//               <th>2K Hz</th>
//               <th>4K Hz</th>
//               <th>8K Hz</th>
//               <th>15K Hz</th>
//             </tr>
//           </thead>
//           <tbody>
//             <td>{fileContents.equalizer.gains[0]}</td>
//             <td>{fileContents.equalizer.gains[1]}</td>
//             <td>{fileContents.equalizer.gains[2]}</td>
//             <td>{fileContents.equalizer.gains[3]}</td>
//             <td>{fileContents.equalizer.gains[4]}</td>
//             <td>{fileContents.equalizer.gains[5]}</td>
//             <td>{fileContents.equalizer.gains[6]}</td>
//             <td>{fileContents.equalizer.gains[7]}</td>
//             <td>{fileContents.equalizer.gains[8]}</td>
//             <td>{fileContents.equalizer.gains[9]}</td>
//           </tbody>
//         </table>
//         <h3>Volume: {fileContents.volume.volume}</h3>
//         <hr />
//         <h2>Tracks</h2>
//         {fileContents.tracks.map((t: Track) => (
//           <TrackReport track={t} fileContents={fileContents} />
//         ))}
//         <hr />
//         <SourceReport generator={undefined} fileContents={fileContents} />
//         <hr />
//       </div>
//     </html>
//   );
// }
