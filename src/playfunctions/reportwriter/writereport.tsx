// import CMGFile from "classes/cmgfile";
// import { renderToString } from "react-dom/server";
// import Report from "./report";

// export default function writeReport(
//   fileContents: CMGFile,
//   setStatus: React.Dispatch<React.SetStateAction<string>>,
// ) {
//   try {
//     const page: HTMLElement | null = document.getElementById("page");
//     // ask for a file
//     window
//       .showSaveFilePicker({
//         types: [
//           {
//             description: "Computer Music Generator Report File",
//             accept: { "application/html": [".html"] },
//           },
//         ],
//       })
//       .then(async (handle) => {
//         // if (page) page.inert = true;
//         // build the html for the file contents
//         const theReport: React.ReactNode = Report({
//           fileContents: fileContents,
//         });
//         const out: string = renderToString(theReport);
//         try {
//           const writeable: FileSystemWritableFileStream =
//             await handle.createWritable();
//           await writeable.write(out);
//           await writeable.close();
//           if (page) page.inert = false;
//         } catch (err) {
//           if (page) page.inert = false;
//           const e = err as Error;
//           setStatus(
//             `Error saving cmg file, type: '${e.name}' message: '${e.message}'`,
//           );
//         }
//       });
//   } catch (e) {
//     throw new Error(`Error while writing the report ${(e as Error).message}`);
//   }
// }
