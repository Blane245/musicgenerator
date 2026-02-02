// import { ActiveSource } from "types";
// import { debug } from "utils/debug";

// // determine which generators are currently playing
// export function playingGenerators(
//   paused: React.MutableRefObject<boolean>,
//   playing: React.MutableRefObject<boolean>,
//   playingId: number,
//   audioContext: AudioContext,
//   playbackLength: number,
//   activeSources: React.MutableRefObject<ActiveSource[]>,
//   activeGenerators: React.MutableRefObject<string[]>,
//   setActiveGeneratorsCount: React.Dispatch<React.SetStateAction<number>>,
  
// ) {
//   if (paused.current) {
//     debug.info("playingGenerators paused");
//     if (playingId !=0) clearTimeout(playingId);
//     return;
//   }
//   if (!audioContext) return;
//   // update the generators playing list
//   if (playing.current && audioContext.currentTime <= playbackLength) {
//     const newActiveGenerators: string[] = [];
//     debug.info(
//       "playingGenrators: checking",
//       activeSources.current.length,
//       "sources for active generators at",
//       audioContext.currentTime
//     );
//     activeSources.current.forEach((s: ActiveSource) => {
//       if (
//         newActiveGenerators.findIndex((name: string) => name == s.gen.name) < 0
//       ) {
//         if (
//           audioContext.currentTime >= s.gen.startTime &&
//           audioContext.currentTime <= s.gen.stopTime
//         ) {
//           debug.info(
//             "playingGenerators: active generator at time",
//             audioContext.currentTime,
//             s.gen.name
//           );
//           newActiveGenerators.push(s.gen.name);
//         }
//       }
//       activeGenerators.current = newActiveGenerators;
//       setActiveGeneratorsCount(newActiveGenerators.length);
//     });
//     playingId = window.setTimeout(
//       playingGenerators,
//       500,
//       paused,
//       playing,
//       playingId,
//       audioContext,
//       playbackLength,
//       activeSources,
//       activeGenerators,
//       setActiveGeneratorsCount
//     );
//   } else {
//     if (playingId !=0) clearTimeout(playingId);
//   }
// }
