// import {
//   AlgorithmValues,
//   AutoregressiveValues,
//   ConstantValues,
//   MarkovianValues,
//   OscillatorValues,
//   WienerValues,
// } from "classes/algorithmvalues";
// import SequenceValues from "classes/sequencevalues";
// import Sequencer from "classes/sequencegenerator";
// import { useCMGContext } from "cmgcontext";
// import ToolsMenu from "menus/toolsmenu";
// import { ChangeEvent, useEffect, useState } from "react";
// import { bankPresettoName, toNote } from "sfcomponents/util";
// import {
//   ALGORITHMTYPE,
//   AttributeType,
//   AttributeTypes,
//   SEQUENCEATTRIBUTE,
//   SequenceName,
// } from "types";
// import { loadValidSequenceNames } from "utils/loadvalidsequencenames";
// import AutoregressivePropertiesBox from "./autoregresivepropertiesbox";
// import ConstantPropertiesBox from "./constantpropertiesbox";
// import MarkovianPropertiesBox from "./markovianpropertiesbox";
// import MidiFrequencyDialog from "./midifrequencydialog";
// import OscillatorPropertiesBox from "./oscillatorpropertiesbox";
// import PresetDialog from "./presetdialog";
// import SequencerPropertiesBox from "./sequencerpropertiesbox";
// import WienerPropertiesBox from "./wienerpropertiesbox";
// import DraggablePopup from "panels/draggablepopup";
// import ItemTable from "panels/itemtable";
// import { loadSequenceItems } from "utils/loadsequenceitems";
// import { calulateSequencerGeneratorStopTime } from "utils/calculatesequencergeneratorstoptime";
// import { SequenceItem } from "classes/sequenceitems";

// // provides the form fields and validators for the algorithmic generator

// export interface SequencerDialogProps {
//   formData: Sequencer;
//   handleChange: (
//     event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => void;
// }

// export default function SequencerDialog(
//   props: SequencerDialogProps
// ): JSX.Element {
//   const { formData, handleChange } = props;
//   const { SFFileList } = useCMGContext();
//   const [open, setOpen] = useState<boolean>(false);
//   const [viewPreset, setViewPreset] = useState<boolean>(false);
//   const [viewNote, setViewNote] = useState<boolean>(false);
//   const [validSequences, setValidSequences] = useState<SequenceName[]>([]);
//   const [attributeTypes, setAttributeTypes] = useState<AttributeTypes>({
//     speed: AttributeType.Algorithm,
//     attack: AttributeType.Algorithm,
//     duration: AttributeType.Algorithm,
//     volume: AttributeType.Algorithm,
//     pan: AttributeType.Algorithm,
//   });
//   // hold the last speedP object to compare to the new one
//   // const [holdSpeedP, setHoldSpeedP] = useState<Algorithm | SequenceValues | null>(null);

//   useEffect(() => {
//     loadValidSequenceNames(SEQUENCEATTRIBUTE.note, setValidSequences);
//     console.log("loaded valid note sequences");
//   }, []);

//   // when the speed changes load the new sequence, calculate the stop time and
//   // and update both the name and the stop time
//   // this probably not work since formData changes everytime it is copied
//   // need a way to check if speedp's values changed, not just copied
//   // useEffect(()=> {

//   //   formData.speedP
//   //   // if the held speedp is null we will update the stop time
//   //   if (!holdSpeedP) {
//   //     // if we have a helpd speed that is equal to the new speedP then
//   //     // compare them
//   //     if (holdSpeedP && formData.speedP.isEqual(holdSpeedP)) return;

//   //     // speedp is new, so update the stop time and the help speedp
//   //     setHoldSpeedP((formData.speedP as ConstantValues));

//   //   const noteItems: SequenceItem[]  = formData.note.values.items
//   //   formData.note.values.items = noteItems;
//   //   const stopTime: number = calulateSequencerGeneratorStopTime(
//   //     formData.startTime,
//   //     formData.note.values.items,
//   //     formData.speedP
//   //   );
//   //   if (stopTime == formData.startTime) formData.stopTime = stopTime;
//   //   handleChange({
//   //     target: { name: "stopTime", value: stopTime.toString() },
//   //   } as ChangeEvent<HTMLInputElement>);
//   // }

//   // },[formData.speedP]);

//   // reload the note items when requested and update the stop time - used when the db changes
//   async function reloadItems() {
//     const noteItems = (formData.note.values.items = await loadSequenceItems(
//       SEQUENCEATTRIBUTE.note,
//       formData.note.values.name
//     ));
//     formData.note.values.items = noteItems;
//     const stopTime: number = calulateSequencerGeneratorStopTime(
//       formData.startTime,
//       formData.note.values.items,
//       formData.speedP
//     );
//     handleChange({
//       target: { name: "stopTime", value: stopTime.toString() },
//     } as ChangeEvent<HTMLInputElement>);
//   }

//   function changeAttributeType(type: string, value: string) {
//     setAttributeTypes((prev) => ({
//       ...prev,
//       [type]: value,
//     }));
//   }

//   // when the note name changes load the new sequence, calcualte the stop time and
//   // and update botn the name and the stop time
//   async function handleNoteNameClick(e: ChangeEvent<HTMLSelectElement>) {
//     const noteName = e.currentTarget.value;
//     const noteItems: SequenceItem[] = await loadSequenceItems(
//       SEQUENCEATTRIBUTE.note,
//       e.currentTarget.value
//     );
//     formData.note.values.name = noteName;
//     formData.note.values.items = noteItems;
//     const stopTime: number = calulateSequencerGeneratorStopTime(
//       formData.startTime,
//       formData.note.values.items,
//       formData.speedP
//     );
//     if (stopTime == formData.startTime) formData.stopTime = stopTime;
//     handleChange({
//       target: { name: "note", value: noteName.toString() },
//     } as ChangeEvent<HTMLInputElement>);
//     handleChange({
//       target: { name: "stopTime", value: stopTime.toString() },
//     } as ChangeEvent<HTMLInputElement>);
//   }

//   return (
//     <>
//       <label>
//         SoundFont File:&nbsp;
//         <select
//           name="soundfontfile"
//           onChange={handleChange}
//           value={formData.soundFontFile}
//         >
//           <option key="SF-none" value="None">
//             None
//           </option>
//           {SFFileList.map((p) => {
//             return (
//               <option key={`SF-${p}`} value={p}>
//                 {p}
//               </option>
//             );
//           })}
//         </select>
//         <span>&nbsp;</span>
//       </label>
//       <label>
//         Preset:&nbsp;
//         <select
//           name="presetName"
//           onChange={handleChange}
//           value={formData.presetName}
//         >
//           {formData.presets.map((p) => {
//             const pName = bankPresettoName(p);
//             return (
//               <option key={`preset-${pName}`} value={pName}>
//                 {pName}
//               </option>
//             );
//           })}
//         </select>
//       </label>
//       <label style={{ paddingLeft: "5px" }}>
//         &nbsp;Looping?:&nbsp;
//         <input
//           name="isLooping"
//           type="checkbox"
//           checked={formData.isLooping ? true : false}
//           onChange={handleChange}
//         />
//         <span>&nbsp;</span>
//       </label>
//       <button
//         type="button"
//         disabled={!formData.preset}
//         style={{ fontSize: "12px", paddingLeft: "5px" }}
//         onClick={() => setViewPreset(true)}
//       >
//         {"View Preset"}
//       </button>
//       <div style={{ height: "21px", width: "100px" }}>
//         <ToolsMenu />
//       </div>
//       <br />
//       <label>
//         Note Sequence: &nbsp;
//         <select
//           name={"note"}
//           onChange={(e) => handleNoteNameClick(e)}
//           value={formData.note.values.name}
//         >
//           <option>&nbsp;</option>
//           {!!validSequences &&
//             validSequences.map((s) => {
//               return (
//                 <option key={"validnames-".concat(s.name)}>{s.name}</option>
//               );
//             })}
//         </select>
//         &nbsp;
//       </label>
//       <button
//         type="button"
//         style={{ fontSize: "12px", paddingLeft: "5px" }}
//         onClick={() => reloadItems()}
//       >
//         {"Reload Sequence"}
//       </button>
//       <button
//         type="button"
//         style={{ fontSize: "12px", paddingLeft: "5px" }}
//         onClick={() => setViewNote(true)}
//       >
//         {"View Sequence"}
//       </button>
//       <label>
//         &nbsp;Key Transposition: &nbsp;
//         <input
//           name={"transpose"}
//           onChange={handleChange}
//           value={formData.note.values.transpose}
//           min={-127}
//           max={127}
//         ></input>
//         &nbsp;
//       </label>
//       <br />
//       <label>
//         Noise Seed:&nbsp;
//         <input
//           name="noiseSeed"
//           type="string"
//           onChange={handleChange}
//           value={formData.noiseSeed}
//         />
//       </label>
//       <label>
//         &nbsp;Noise Frequency:&nbsp;
//         <input
//           name="noiseFrequency"
//           type="number"
//           min={0}
//           max={1000}
//           step={0.001}
//           onChange={handleChange}
//           value={formData.noiseFrequency}
//         />
//         <span> (Hz) </span>
//       </label>
//       <label>
//         &nbsp;Noise Level:&nbsp;
//         <input
//           name="noiseAmplitude"
//           type="number"
//           min={0}
//           max={1000}
//           step={0.001}
//           onChange={handleChange}
//           value={formData.noiseAmplitude}
//         />
//         <span> (gain) </span>
//       </label>
//       <label>
//         &nbsp;Reverb Duration:&nbsp;
//         <input
//           name="reverbDuration"
//           type="number"
//           min={0}
//           max={10}
//           step={0.01}
//           onChange={handleChange}
//           value={formData.reverbDuration}
//         />
//         <span> (sec) </span>
//       </label>
//       <label>
//         &nbsp;Reverb Decay:&nbsp;
//         <input
//           name="reverbDecay"
//           type="number"
//           min={0}
//           max={10}
//           step={0.01}
//           onChange={handleChange}
//           value={formData.reverbDecay}
//         />
//         <span> (sec) </span>
//       </label>
//       <hr />
//       <div className="attribute-table">
//         <div className="attribute">{"Attack [0-127]"}</div>
//         <div className="method">
//           <SetAttributeType
//             type={"attack"}
//             attributeTypes={attributeTypes}
//             changeAttributeType={changeAttributeType}
//           />
//         </div>
//         <div className="methodvalues">
//           {!!(attributeTypes.attack == AttributeType.Algorithm) && (
//             <div className="algorithm">
//               <div className="type">
//                 <SetAlgorithmType
//                   name={"attackP"}
//                   type={(formData.attackP as AlgorithmValues).algorithmType}
//                   handleChange={handleChange}
//                 />
//               </div>
//               <div className="parameters">
//                 {!!(
//                   (formData.attackP as AlgorithmValues).algorithmType ==
//                   ALGORITHMTYPE.Oscillator
//                 ) && (
//                   <OscillatorPropertiesBox
//                     name="attackP.oscillator.values"
//                     type={(formData.attackP as OscillatorValues).values.type}
//                     center={{
//                       value: (formData.attackP as OscillatorValues).values
//                         .center,
//                       lo: 0,
//                       hi: 127,
//                       step: 1,
//                       suffix: "(0-127)",
//                     }}
//                     centerSuffix={(value: number) => {
//                       if (value < 0) return "";
//                       else return "(0-127)";
//                     }}
//                     frequency={{
//                       value: (formData.attackP as OscillatorValues).values
//                         .frequency,
//                       lo: 0,
//                       hi: 1000000,
//                       step: 0.001,
//                       suffix: "(mHz)",
//                     }}
//                     amplitude={{
//                       value: (formData.attackP as OscillatorValues).values
//                         .amplitude,
//                       lo: 0,
//                       hi: 127,
//                       step: 0.001,
//                       suffix: "(0-127)",
//                     }}
//                     phase={{
//                       value: (formData.attackP as OscillatorValues).values
//                         .phase,
//                       lo: -360,
//                       hi: 360,
//                       step: 1,
//                       suffix: "(degrees)",
//                     }}
//                     handleChange={handleChange}
//                   />
//                 )}
//                 {!!(
//                   (formData.attackP as AlgorithmValues).algorithmType ==
//                   ALGORITHMTYPE.Markovian
//                 ) && (
//                   <MarkovianPropertiesBox
//                     name="attackP.markovian.values"
//                     values={(formData.attackP as MarkovianValues).values}
//                     valueSuffix={(value: number) => {
//                       if (value < 0) return "";
//                       else return " ".concat(toNote(value));
//                     }}
//                     stepSuffix={() => "(0-127)"}
//                     min={0}
//                     max={127}
//                     step={1}
//                     handleChange={handleChange}
//                   />
//                 )}
//                 {!!(
//                   (formData.attackP as AlgorithmValues).algorithmType ==
//                   ALGORITHMTYPE.Wiener
//                 ) && (
//                   <WienerPropertiesBox
//                     name="attackP.wiener.values"
//                     values={(formData.attackP as WienerValues).values}
//                     handleChange={handleChange}
//                     min={0}
//                     max={127}
//                     step={1}
//                     valueSuffix={() => "(0-127)"}
//                   />
//                 )}
//                 {!!(
//                   (formData.attackP as AlgorithmValues).algorithmType ==
//                   ALGORITHMTYPE.Constant
//                 ) && (
//                   <ConstantPropertiesBox
//                     name="attackP.constant.values"
//                     values={(formData.attackP as ConstantValues).values}
//                     handleChange={handleChange}
//                     min={0}
//                     max={127}
//                     step={1}
//                     valueSuffix={() => "(0-127)"}
//                   />
//                 )}
//                 {!!(
//                   (formData.attackP as AlgorithmValues).algorithmType ==
//                   ALGORITHMTYPE.Autoregressive
//                 ) && (
//                   <AutoregressivePropertiesBox
//                     name="attackP.autogregressive.values"
//                     values={(formData.attackP as AutoregressiveValues).values}
//                     handleChange={handleChange}
//                     min={0}
//                     max={127}
//                     step={1}
//                     valueSuffix={() => "(0-127)"}
//                   />
//                 )}
//               </div>
//             </div>
//           )}
//           {!!(attributeTypes.attack == AttributeType.Sequence) && (
//             <SequencerPropertiesBox
//               attributeType={SEQUENCEATTRIBUTE.attack}
//               name={"attackP.sequencer.values"}
//               values={(formData.attackP as SequenceValues).values}
//               handleChange={handleChange}
//             />
//           )}
//         </div>
//       </div>
//       <hr />
//       <div className="attribute-table">
//         <div className="attribute">Speed (BPM)</div>
//         <div className="method">
//           <SetAttributeType
//             type={"speed"}
//             attributeTypes={attributeTypes}
//             changeAttributeType={changeAttributeType}
//           />
//         </div>
//         <div className="methodvalues">
//           {!!(attributeTypes.speed == AttributeType.Algorithm) && (
//             <>
//               <div className="algorithm">
//                 <div className="type">
//                   <SetAlgorithmType
//                     name={"speedP"}
//                     type={(formData.speedP as AlgorithmValues).algorithmType}
//                     handleChange={(e) => handleChange(e)}
//                   />
//                 </div>
//                 <div className="parameters">
//                   {!!(
//                     (formData.speedP as AlgorithmValues).algorithmType ==
//                     ALGORITHMTYPE.Oscillator
//                   ) && (
//                     <OscillatorPropertiesBox
//                       name="speedP.oscillator.values"
//                       type={(formData.speedP as OscillatorValues).values.type}
//                       center={{
//                         value: (formData.speedP as OscillatorValues).values
//                           .center,
//                         lo: 0,
//                         hi: 1000,
//                         step: 0.01,
//                         suffix: "(BPM)",
//                       }}
//                       centerSuffix={() => "BPM"}
//                       frequency={{
//                         value: (formData.speedP as OscillatorValues).values
//                           .frequency,
//                         lo: 0,
//                         hi: 1000000,
//                         step: 1,
//                         suffix: "(mHz)",
//                       }}
//                       amplitude={{
//                         value: (formData.speedP as OscillatorValues).values
//                           .amplitude,
//                         lo: 0,
//                         hi: 1000,
//                         step: 0.001,
//                         suffix: "(BPM)",
//                       }}
//                       phase={{
//                         value: (formData.speedP as OscillatorValues).values
//                           .phase,
//                         lo: -360,
//                         hi: 360,
//                         step: 1,
//                         suffix: "(degrees)",
//                       }}
//                       handleChange={(e) => handleChange(e)}
//                     />
//                   )}
//                   {!!(
//                     (formData.speedP as AlgorithmValues).algorithmType ==
//                     ALGORITHMTYPE.Markovian
//                   ) && (
//                     <MarkovianPropertiesBox
//                       name="speedP.markovian.values"
//                       valueSuffix={() => {
//                         return "";
//                       }}
//                       stepSuffix={() => "BPM"}
//                       values={(formData.speedP as MarkovianValues).values}
//                       min={1}
//                       max={1000}
//                       step={1}
//                       handleChange={(e) => handleChange(e)}
//                     />
//                   )}
//                   {!!(
//                     (formData.speedP as AlgorithmValues).algorithmType ==
//                     ALGORITHMTYPE.Wiener
//                   ) && (
//                     <WienerPropertiesBox
//                       name="speedP.wiener.values"
//                       values={(formData.speedP as WienerValues).values}
//                       min={1}
//                       max={1000}
//                       step={0.1}
//                       valueSuffix={() => ""}
//                       handleChange={(e) => handleChange(e)}
//                     />
//                   )}
//                   {!!(
//                     (formData.speedP as AlgorithmValues).algorithmType ==
//                     ALGORITHMTYPE.Constant
//                   ) && (
//                     <ConstantPropertiesBox
//                       name="speedP.constant.values"
//                       values={(formData.speedP as ConstantValues).values}
//                       handleChange={(e) => handleChange(e)}
//                       min={1}
//                       max={1000}
//                       step={1}
//                       valueSuffix={() => "BPM"}
//                     />
//                   )}
//                   {!!(
//                     (formData.speedP as AlgorithmValues).algorithmType ==
//                     ALGORITHMTYPE.Autoregressive
//                   ) && (
//                     <AutoregressivePropertiesBox
//                       name="speedP.autogregressive.values"
//                       values={(formData.speedP as AutoregressiveValues).values}
//                       handleChange={(e) => handleChange(e)}
//                       min={1}
//                       max={1000}
//                       step={0.001}
//                       valueSuffix={() => "BPM"}
//                     />
//                   )}
//                 </div>
//               </div>
//             </>
//           )}
//           {!!(attributeTypes.speed == AttributeType.Sequence) && (
//             <SequencerPropertiesBox
//               attributeType={SEQUENCEATTRIBUTE.speed}
//               name={"speedP.sequencer.values"}
//               values={(formData.speedP as SequenceValues).values}
//               handleChange={(e) => handleChange(e)}
//             />
//           )}
//         </div>
//       </div>
//       <hr />
//       <div className="attribute-table">
//         <div className="attribute">Duration (sec)</div>
//         <div className="method">
//           <SetAttributeType
//             type={"duration"}
//             attributeTypes={attributeTypes}
//             changeAttributeType={changeAttributeType}
//           />
//         </div>
//         <div className="methodvalues">
//           {!!(attributeTypes.duration == AttributeType.Algorithm) && (
//             <>
//               <div className="algorithm">
//                 <div className="type">
//                   <SetAlgorithmType
//                     name={"durationP"}
//                     type={(formData.durationP as AlgorithmValues).algorithmType}
//                     handleChange={handleChange}
//                   />
//                 </div>
//                 <div className="parameters">
//                   {!!(
//                     (formData.durationP as AlgorithmValues).algorithmType ==
//                     ALGORITHMTYPE.Oscillator
//                   ) && (
//                     <OscillatorPropertiesBox
//                       name="durationP.oscillator.values"
//                       type={
//                         (formData.durationP as OscillatorValues).values.type
//                       }
//                       center={{
//                         value: (formData.durationP as OscillatorValues).values
//                           .center,
//                         lo: 1,
//                         hi: 100,
//                         step: 1,
//                         suffix: "(%)",
//                       }}
//                       centerSuffix={() => "%"}
//                       frequency={{
//                         value: (formData.durationP as OscillatorValues).values
//                           .frequency,
//                         lo: 0,
//                         hi: 1000000,
//                         step: 1,
//                         suffix: "(mHz)",
//                       }}
//                       amplitude={{
//                         value: (formData.durationP as OscillatorValues).values
//                           .amplitude,
//                         lo: 0,
//                         hi: 100,
//                         step: 1,
//                         suffix: "(%)",
//                       }}
//                       phase={{
//                         value: (formData.durationP as OscillatorValues).values
//                           .phase,
//                         lo: -360,
//                         hi: 360,
//                         step: 1,
//                         suffix: "(degrees)",
//                       }}
//                       handleChange={handleChange}
//                     />
//                   )}
//                   {!!(
//                     (formData.durationP as AlgorithmValues).algorithmType ==
//                     ALGORITHMTYPE.Markovian
//                   ) && (
//                     <MarkovianPropertiesBox
//                       name="durationP.markovian.values"
//                       valueSuffix={() => {
//                         return "";
//                       }}
//                       stepSuffix={() => "%"}
//                       values={(formData.durationP as MarkovianValues).values}
//                       min={1}
//                       max={100}
//                       step={1}
//                       handleChange={handleChange}
//                     />
//                   )}
//                   {!!(
//                     (formData.durationP as AlgorithmValues).algorithmType ==
//                     ALGORITHMTYPE.Wiener
//                   ) && (
//                     <WienerPropertiesBox
//                       name="durationP.wiener.values"
//                       values={(formData.durationP as WienerValues).values}
//                       min={1}
//                       max={100}
//                       step={1}
//                       valueSuffix={() => "%"}
//                       handleChange={handleChange}
//                     />
//                   )}
//                   {!!(
//                     (formData.durationP as AlgorithmValues).algorithmType ==
//                     ALGORITHMTYPE.Constant
//                   ) && (
//                     <ConstantPropertiesBox
//                       name="durationP.constant.values"
//                       values={(formData.durationP as ConstantValues).values}
//                       handleChange={handleChange}
//                       min={1}
//                       max={100}
//                       step={1}
//                       valueSuffix={() => "%"}
//                     />
//                   )}
//                   {!!(
//                     (formData.durationP as AlgorithmValues).algorithmType ==
//                     ALGORITHMTYPE.Autoregressive
//                   ) && (
//                     <AutoregressivePropertiesBox
//                       name="durationP.autogregressive.values"
//                       values={
//                         (formData.durationP as AutoregressiveValues).values
//                       }
//                       handleChange={handleChange}
//                       min={1}
//                       max={100}
//                       step={1}
//                       valueSuffix={() => "%"}
//                     />
//                   )}
//                 </div>
//               </div>
//             </>
//           )}
//           {!!(attributeTypes.duration == AttributeType.Sequence) && (
//             <SequencerPropertiesBox
//               attributeType={SEQUENCEATTRIBUTE.duration}
//               name={"durationP.sequencer.values"}
//               values={(formData.durationP as SequenceValues).values}
//               handleChange={handleChange}
//             />
//           )}
//         </div>
//       </div>
//       <hr />
//       <div className="attribute-table">
//         <div className="attribute">Volume (dB)</div>
//         <div className="method">
//           <SetAttributeType
//             type={"volume"}
//             attributeTypes={attributeTypes}
//             changeAttributeType={changeAttributeType}
//           />
//         </div>
//         <div className="methodvalues">
//           {!!(attributeTypes.volume == AttributeType.Algorithm) && (
//             <>
//               <div className="algorithm">
//                 <div className="type">
//                   <SetAlgorithmType
//                     name={"volumeP"}
//                     type={(formData.volumeP as AlgorithmValues).algorithmType}
//                     handleChange={handleChange}
//                   />
//                 </div>
//                 <div className="parameters">
//                   {!!(
//                     (formData.volumeP as AlgorithmValues).algorithmType ==
//                     ALGORITHMTYPE.Oscillator
//                   ) && (
//                     <OscillatorPropertiesBox
//                       name="volumeP.oscillator.values"
//                       type={(formData.volumeP as OscillatorValues).values.type}
//                       center={{
//                         value: (formData.volumeP as OscillatorValues).values
//                           .center,
//                         lo: -10,
//                         hi: 10,
//                         step: 1,
//                         suffix: "(dB)",
//                       }}
//                       centerSuffix={() => "dB"}
//                       frequency={{
//                         value: (formData.volumeP as OscillatorValues).values
//                           .frequency,
//                         lo: 0,
//                         hi: 1000000,
//                         step: 0.001,
//                         suffix: "(mHz)",
//                       }}
//                       amplitude={{
//                         value: (formData.volumeP as OscillatorValues).values
//                           .amplitude,
//                         lo: 0,
//                         hi: 10,
//                         step: 0.001,
//                         suffix: "(dB)",
//                       }}
//                       phase={{
//                         value: (formData.volumeP as OscillatorValues).values
//                           .phase,
//                         lo: -360,
//                         hi: 360,
//                         step: 1,
//                         suffix: "(degrees)",
//                       }}
//                       handleChange={handleChange}
//                     />
//                   )}
//                   {!!(
//                     (formData.volumeP as AlgorithmValues).algorithmType ==
//                     ALGORITHMTYPE.Markovian
//                   ) && (
//                     <MarkovianPropertiesBox
//                       name="volumeP.markovian.values"
//                       valueSuffix={() => {
//                         return "";
//                       }}
//                       stepSuffix={() => "dB"}
//                       values={(formData.volumeP as MarkovianValues).values}
//                       min={-50}
//                       max={50}
//                       step={0.1}
//                       handleChange={handleChange}
//                     />
//                   )}
//                   {!!(
//                     (formData.volumeP as AlgorithmValues).algorithmType ==
//                     ALGORITHMTYPE.Wiener
//                   ) && (
//                     <WienerPropertiesBox
//                       name="volumeP.wiener.values"
//                       values={(formData.volumeP as WienerValues).values}
//                       min={-50}
//                       max={50}
//                       step={0.1}
//                       valueSuffix={() => ""}
//                       handleChange={handleChange}
//                     />
//                   )}
//                   {!!(
//                     (formData.volumeP as AlgorithmValues).algorithmType ==
//                     ALGORITHMTYPE.Constant
//                   ) && (
//                     <ConstantPropertiesBox
//                       name="volumeP.constant.values"
//                       values={(formData.volumeP as ConstantValues).values}
//                       handleChange={handleChange}
//                       min={-50}
//                       max={50}
//                       step={1}
//                       valueSuffix={() => "dB"}
//                     />
//                   )}
//                   {!!(
//                     (formData.volumeP as AlgorithmValues).algorithmType ==
//                     ALGORITHMTYPE.Autoregressive
//                   ) && (
//                     <AutoregressivePropertiesBox
//                       name="volumeP.autogregressive.values"
//                       values={(formData.volumeP as AutoregressiveValues).values}
//                       handleChange={handleChange}
//                       min={-50}
//                       max={50}
//                       step={1}
//                       valueSuffix={() => "dB"}
//                     />
//                   )}
//                 </div>
//               </div>
//             </>
//           )}
//           {!!(attributeTypes.volume == AttributeType.Sequence) && (
//             <SequencerPropertiesBox
//               attributeType={SEQUENCEATTRIBUTE.pan}
//               name={"volumeP.sequencer.values"}
//               values={(formData.volumeP as SequenceValues).values}
//               handleChange={handleChange}
//             />
//           )}
//         </div>
//       </div>
//       <hr />
//       <div className="attribute-table">
//         <div className="attribute">{"Pan [-1,+1]"}</div>
//         <div className="method">
//           <SetAttributeType
//             type={"pan"}
//             attributeTypes={attributeTypes}
//             changeAttributeType={changeAttributeType}
//           />
//         </div>
//         <div className="methodvalues">
//           {!!(attributeTypes.pan == AttributeType.Algorithm) && (
//             <>
//               <div className="algorithm">
//                 <div className="type">
//                   <SetAlgorithmType
//                     name={"panP"}
//                     type={(formData.panP as AlgorithmValues).algorithmType}
//                     handleChange={handleChange}
//                   />
//                 </div>
//                 <div className="parameters">
//                   {!!(
//                     (formData.panP as AlgorithmValues).algorithmType ==
//                     ALGORITHMTYPE.Oscillator
//                   ) && (
//                     <OscillatorPropertiesBox
//                       name="panP.oscillator.values"
//                       type={(formData.panP as OscillatorValues).values.type}
//                       center={{
//                         value: (formData.panP as OscillatorValues).values
//                           .center,
//                         lo: -1,
//                         hi: 1,
//                         step: 0.1,
//                         suffix: "[-1,1]",
//                       }}
//                       centerSuffix={() => "[-1,1]"}
//                       frequency={{
//                         value: (formData.panP as OscillatorValues).values
//                           .frequency,
//                         lo: 0,
//                         hi: 1000000,
//                         step: 0.01,
//                         suffix: "(mHz)",
//                       }}
//                       amplitude={{
//                         value: (formData.panP as OscillatorValues).values
//                           .amplitude,
//                         lo: 0,
//                         hi: 2,
//                         step: 0.001,
//                         suffix: "[0,2]",
//                       }}
//                       phase={{
//                         value: (formData.panP as OscillatorValues).values.phase,
//                         lo: -360,
//                         hi: 360,
//                         step: 1,
//                         suffix: "(degrees)",
//                       }}
//                       handleChange={handleChange}
//                     />
//                   )}
//                   {!!(
//                     (formData.panP as AlgorithmValues).algorithmType ==
//                     ALGORITHMTYPE.Markovian
//                   ) && (
//                     <MarkovianPropertiesBox
//                       name="panP.markovian.values"
//                       valueSuffix={() => {
//                         return "";
//                       }}
//                       stepSuffix={() => "[-1,+]"}
//                       values={(formData.panP as MarkovianValues).values}
//                       min={-1}
//                       max={1}
//                       step={0.1}
//                       handleChange={handleChange}
//                     />
//                   )}
//                   {!!(
//                     (formData.panP as AlgorithmValues).algorithmType ==
//                     ALGORITHMTYPE.Wiener
//                   ) && (
//                     <WienerPropertiesBox
//                       name="panP.wiener.values"
//                       values={(formData.panP as WienerValues).values}
//                       handleChange={handleChange}
//                       min={-1}
//                       max={1}
//                       step={0.1}
//                       valueSuffix={() => ""}
//                     />
//                   )}
//                   {!!(
//                     (formData.panP as AlgorithmValues).algorithmType ==
//                     ALGORITHMTYPE.Constant
//                   ) && (
//                     <ConstantPropertiesBox
//                       name="panP.constant.values"
//                       values={(formData.panP as ConstantValues).values}
//                       handleChange={handleChange}
//                       min={-1}
//                       max={1}
//                       step={0.1}
//                       valueSuffix={() => "[-1,+1]"}
//                     />
//                   )}
//                   {!!(
//                     (formData.panP as AlgorithmValues).algorithmType ==
//                     ALGORITHMTYPE.Autoregressive
//                   ) && (
//                     <AutoregressivePropertiesBox
//                       name="panP.autogregressive.values"
//                       values={(formData.panP as AutoregressiveValues).values}
//                       handleChange={handleChange}
//                       min={-1}
//                       max={1}
//                       step={0.1}
//                       valueSuffix={() => "[-1,+1]"}
//                     />
//                   )}
//                 </div>
//               </div>
//             </>
//           )}
//           {!!(attributeTypes.pan == AttributeType.Sequence) && (
//             <SequencerPropertiesBox
//               attributeType={SEQUENCEATTRIBUTE.pan}
//               name={"panP.sequencer.values"}
//               values={(formData.panP as SequenceValues).values}
//               handleChange={handleChange}
//             />
//           )}
//         </div>
//       </div>
//       {open ? <MidiFrequencyDialog setOpen={setOpen} /> : null}
//       {viewPreset ? (
//         <PresetDialog generator={formData} setViewPreset={setViewPreset} />
//       ) : null}
//       {/* TODO need draggable popup for each sequencer attribute */}
//       <DraggablePopup
//         isOpen={viewNote}
//         onClose={() => setViewNote(false)}
//         headerText={`Items for Note sequence '${formData.note.values.name}' `}
//       >
//         <ItemTable
//           attributeType={SEQUENCEATTRIBUTE.note}
//           items={formData.note.values.items}
//         />
//       </DraggablePopup>
//     </>
//   );
// }

// interface SetAttributeTypeProps {
//   type: string;
//   attributeTypes: AttributeTypes;
//   changeAttributeType: Function;
// }

// function SetAttributeType(props: SetAttributeTypeProps): JSX.Element {
//   const { type, attributeTypes, changeAttributeType } = props;
//   return (
//     <label>
//       Attribute Type&nbsp;
//       <select
//         name={`${type.toString()}.attributetype`}
//         onChange={(e) => changeAttributeType(type, e.currentTarget.value)}
//         value={attributeTypes[type]}
//       >
//         {Object.values(AttributeType).map((t) => (
//           <option key={`attributetype-${t}`} value={t}>
//             {t}
//           </option>
//         ))}
//       </select>
//     </label>
//   );
// }

// interface SetAlgorithmTypeProps {
//   handleChange: (
//     event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
//   ) => void;
//   type: ALGORITHMTYPE;
//   name: string;
// }

// function SetAlgorithmType(props: SetAlgorithmTypeProps): JSX.Element {
//   const { name, type, handleChange } = props;
//   return (
//     <label>
//       Algorithm:&nbsp;
//       <select name={`${name}.type`} onChange={handleChange} value={type}>
//         {Object.values(ALGORITHMTYPE).map((p) => {
//           return (
//             <option key={`${name}algorithm-${p}`} value={p}>
//               {p}
//             </option>
//           );
//         })}
//       </select>
//     </label>
//   );
// }
