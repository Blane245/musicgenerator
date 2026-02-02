// // Construct the data from each active generator that will be used to
// // realize them when they are inserted into the audio node graph
// import CMGFile from "classes/cmgfile";
// import { RawSourceData } from "../types";
// import { getBufferSourceNodesFromAlgorithmic } from "./algorithmicnodes";
// import { getBufferSourceNodesFromAudioFile } from "./audiofilenodes";
// import { getBufferSourceNodesFromSilent } from "./silentnodes";
// import Algorithmic from "classes/generators/algorithmic";
// import AudioFile from "classes/generators/audiofile";
// import Silent from "classes/generators/silent";
// import Stochastic from "classes/generators/stochastic";
// import { getBufferSourceNodesFromStochastic } from "./stochasticnodes";

// interface buildSourcesProps {
//   fileContents: CMGFile;
//   AlgorithmicGenerators: Algorithmic[];
//   AudioFileGenerators: AudioFile[];
//   SilentGenerators: Silent[];
//   StochasticGenerators: Stochastic[];
// }
// export function buildSources(params: buildSourcesProps): {
//   sources: RawSourceData[];
//   error: string;
// } {
//   const {
//     AlgorithmicGenerators,
//     AudioFileGenerators,
//     SilentGenerators,
//     StochasticGenerators,
//   } = params;

//   let sourceCount: number = 0;
//   let error: string = "";
//   const sourceData: RawSourceData[] = [];
//   try {
//     StochasticGenerators.forEach((g) => {
//       const StochasticData: RawSourceData[] =
//         getBufferSourceNodesFromStochastic(g, sourceCount);
//       sourceData.push(...StochasticData);
//       sourceCount = sourceData.length;
//     });

//     AlgorithmicGenerators.forEach((g) => {
//       const AlgorithmicData: RawSourceData[] =
//         getBufferSourceNodesFromAlgorithmic(g, sourceCount);
//       sourceData.push(...AlgorithmicData);
//       sourceCount = sourceData.length;
//     });

//     AudioFileGenerators.forEach((g) => {
//       const AudioFileData: RawSourceData[] = getBufferSourceNodesFromAudioFile(
//         g,
//         sourceCount
//       );
//       sourceData.push(...AudioFileData);
//       sourceCount = sourceData.length;
//     });

//     SilentGenerators.forEach((g) => {
//       const CMGData: RawSourceData[] = getBufferSourceNodesFromSilent(
//         g,
//         sourceCount
//       );
//       sourceData.push(...CMGData);
//       sourceCount = sourceData.length;
//     });

//     return {
//       sources: sourceData.sort(
//         (a: RawSourceData, b: RawSourceData) =>
//           a.source.startTime - b.source.startTime
//       ),
//       error: error,
//     };
//   } catch (e) {
//     error = (e as Error).message;
//     return { sources: sourceData, error: error };
//   }
// }
