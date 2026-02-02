// import { ChangeEvent, useEffect, useState } from "react";
// import Reverb from "classes/roomnodes/reverb";
// import { useCMGContext } from "cmgcontext";
// import { setReverb } from "utils/cmfiletransactions";

// export default function RoomReverbDialog() {
//   const { setFileContents, fileContents } = useCMGContext();
//   const [reverbData, setReverbData] = useState<Reverb>(new Reverb());

//   useEffect(() => {
//     setReverbData(fileContents.reverb);
//   }, [fileContents.reverb]);

//   function handleChange(event: ChangeEvent<HTMLInputElement>): void {
//     const eventName: string | null = event.target["name"];
//     const eventValue: string | null = event.target["value"];
//     if (!reverbData.effectIn) {
//       const n: Reverb = reverbData.copy();
//       if (eventName && eventValue) {
//         n.setAttribute(eventName, eventValue);
//       }
//       setReverb(n, setFileContents);
//     } else {
//       reverbData.setAttribute(eventName, eventValue);
//     }
//   }

//   function handleEnable() {
//     const eventName: string = "reverb.enabled";
//     const eventValue: string = reverbData.enabled ? "false" : "true";
//       const n: Reverb = reverbData.copy();
//       n.setAttribute(eventName, eventValue);
//       setReverb(n, setFileContents);
//   }

//   function reset() {
//     reverbData.reset();
//     const n = reverbData.copy();
//     setReverb(n, setFileContents);
//   }
//   return (
//     <div
//       className="reverb"
//       style={{ backgroundColor: reverbData.enabled ? "white" : "lightpink" }}
//     >
//       <div className="title">
//         <label>
//           <input
//             type="checkbox"
//             onChange={() => handleEnable()}
//             checked={reverbData.enabled}
//           />
//           <span>&nbsp;Enable&nbsp;</span>
//         </label>
//         Reverb Reset:&nbsp;
//         <button className="button" onClick={reset}>
//           &nbsp;
//         </button>
//       </div>
//       <div className="sliders">
//         <div className="slider" key={"roomreverb"}>
//           <span className="param">Duration (sec)</span>
//           <span className="param">{reverbData.duration}</span>
//           <input
//             name="reverb.duration"
//             type="range"
//             min="0"
//             max="10"
//             step="0.1"
//             value={reverbData.duration}
//             onChange={(event) => handleChange(event)}
//           />
//         </div>
//         <div className="slider">
//           <span className="param">Decay (sec)</span>
//           <span className="param">{reverbData.decay}</span>
//           <input
//             name="reverb.decay"
//             type="range"
//             min="0"
//             max="10"
//             step="1"
//             value={reverbData.decay}
//             onChange={(event) => handleChange(event)}
//           />
//         </div>
//         <div className="slider">
//           <span className="param">LW delay</span>
//           <span className="param">{reverbData.leftWall.delay * 1000}</span>
//           <input
//             name="reverb.leftwall.delay"
//             type="range"
//             min="0"
//             max="1000"
//             step="1"
//             value={reverbData.leftWall.delay * 1000}
//             onChange={(event) => handleChange(event)}
//           />
//         </div>
//         <div className="slider">
//           <span className="param">LW gain (dB)</span>
//           <span className="param">{reverbData.leftWall.gain}</span>
//           <input
//             name="reverb.leftwall.gain"
//             type="range"
//             min="-10"
//             max="10"
//             step="1"
//             value={reverbData.leftWall.gain}
//             onChange={(event) => handleChange(event)}
//           />
//         </div>
//         <div className="slider">
//           <span className="param">RW delay</span>
//           <span className="param">{reverbData.rightWall.delay * 1000}</span>
//           <input
//             name="reverb.rightwall.delay"
//             type="range"
//             min="0"
//             max="1000"
//             step="1"
//             value={reverbData.rightWall.delay * 1000}
//             onChange={(event) => handleChange(event)}
//           />
//         </div>
//         <div className="slider">
//           <span className="param">RW gain (dB)</span>
//           <span className="param">{reverbData.rightWall.gain}</span>
//           <input
//             name="reverb.rightwall.gain"
//             type="range"
//             min="-10"
//             max="10"
//             step="1"
//             value={reverbData.rightWall.gain}
//             onChange={(event) => handleChange(event)}
//           />
//         </div>
//         <div className="slider">
//           <span className="param">Ceiling delay</span>
//           <span className="param">{reverbData.ceiling.delay * 1000}</span>
//           <input
//             name="reverb.ceiling.delay"
//             type="range"
//             min="0"
//             max="1000"
//             step="1"
//             value={reverbData.ceiling.delay * 1000}
//             onChange={(event) => handleChange(event)}
//           />
//         </div>
//         <div className="slider">
//           <span className="param">Ceiling gain</span>
//           <span className="param">{reverbData.ceiling.gain}</span>
//           <input
//             name="reverb.ceiling.gain"
//             type="range"
//             min="-10"
//             max="10"
//             step="1"
//             value={reverbData.ceiling.gain}
//             onChange={(event) => handleChange(event)}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }
