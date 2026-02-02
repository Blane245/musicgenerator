// // the source data contains the audio to play and the image to scroll
// import { useCMGContext } from "cmgcontext";
// import { useEffect, useRef, useState } from "react";
// import { PLAYMODE, SourceData } from "types";
// import { debug } from "utils/debug";
// import Header from "./header";
// import Footer from "./footer";
// import Timeline from "./timeline";
// import TimeLine from "classes/timeline";

// interface PlayProps {
//   sourceData: SourceData;
//   setMode: React.Dispatch<React.SetStateAction<PLAYMODE>>;
// }
// export default function Play(props: PlayProps) {
//   const { sourceData, setMode } = props;
//   const {screenWidth: windowWidth
    
//   } = useCMGContext();
//   const chartHeight: number = (windowWidth * 4) / 9; // HD aspect ratio
//   const isPlaying = useRef<boolean>(false);
//   const [audioElem, setAudioElem] = useState<HTMLAudioElement | null>(null);
//   const [audioSrc, setAudioSrc] = useState<string>("");
//   const [scrollLeftRule, setScrollLeftRule] = useState<CSSKeyframesRule | null>(
//     null,
//   );
//   const [chartElem, setChartElem] = useState<HTMLDivElement | null>(null);
//   const [imageElem, setImageElem] = useState<HTMLImageElement | null>(null);
//   const [scrollPosition, setScrollPosition] = useState<number>(0); // 0-1 on the range input when not seeking
//   const [duration, setDuration] = useState<number>(0); // total duration of the audio (sec)
//   const [chartWidth, setChartWidth] = useState<number>(0); // pixel size of the chart (window width * duration / 60)
//   const timerId = useRef<number>(0);
//   const TIMERDELTA: number = 20; //ms
//   const timerIncrement = useRef<number>(0);
//     const previewTimeline = useRef<TimeLine | null>(null);
  

//   // #region useeffect
//   // capture the audio and chart elements at start up
//   // load the audiodata to the audio tag
//   useEffect(() => {
//     const aElem: HTMLElement | null = document.getElementById("audio");
//     if (aElem) {
//       setAudioElem(aElem as HTMLAudioElement);
//       (aElem as HTMLAudioElement).pause();
//     }
//     const cElem: HTMLElement | null =
//       document.getElementById("image-container");
//     if (cElem) {
//       setChartElem(cElem as HTMLDivElement);
//     }
//     const objectUrl = URL.createObjectURL(sourceData.audio);
//     setAudioSrc(objectUrl);
//   }, []);

//   // when image arrives load the chart
//   // into the image
//   useEffect(() => {
//     if (!chartElem) return;
//       setImageElem(sourceData.image);
//       while (chartElem.firstChild) chartElem.firstChild.remove();
//       chartElem.appendChild(sourceData.image);
//       debug.log("image appended to chart, length", sourceData.image.attributes.length);
//   }, [sourceData.image]);
//   // #endregion

//   // #region utilities

//   // play and pause
//   // turn the audio on and off
//   // position the image to the current scroll poistion
//   // when playing, start a timer that will update the image position
//   // it must keep in step with the scroll position
//   const imageTimer = () => {
//     if (!imageElem) return;
//     if (isPlaying.current) {
//       timerId.current = window.setTimeout(imageTimer, TIMERDELTA);
//       timerIncrement.current += TIMERDELTA / 1000;
//       imageElem.style.transform = `translateX(-${(timerIncrement.current / duration) * chartWidth}px)`;
//       // debug.log('timer: increment, duration, chart width', timerIncrement.current, duration, chartWidth);
//     } else clearTimeout(timerId.current);
//   };

//   // change the state of the system when isPlaying changes
//   const triggerPlayState = (_position: number) => {
//     if (!imageElem || !audioElem) return;
//     if (isPlaying.current) {
//       // stop the timer and adjust the position to the scroll position
//       if (timerId.current) {
//         clearTimeout(timerId.current);
//         debug.log("play: timerId cleared", timerId.current);
//       }
//       imageElem.style.transform = `translateX(-${_position * chartWidth}px)`;

//       // tell the audio to play (it will aready be playing if this is a scroll position update)
//       if (audioElem.paused) audioElem.play();
//       // restart the timer at the current scroll position
//       timerIncrement.current = _position * duration;
//       timerId.current = window.setTimeout(imageTimer, TIMERDELTA);
//       debug.log(
//         "audio playing at scroll position, time, timerId",
//         _position,
//         audioElem.currentTime,
//         timerId.current,
//       );
//     } else {
//       if (timerId.current) {
//         clearTimeout(timerId.current);
//         debug.log("pause: timerId cleared", timerId.current);
//       }
//       if (!audioElem.paused) audioElem.pause();
//       // make the image align on the proper scroll position
//       imageElem.style.transform = `translateX(-${_position * chartWidth}px)`;
//       debug.log(
//         "audio paused at scroll position, time, timerId",
//         _position,
//         audioElem.currentTime,
//         timerId.current,
//       );
//     }
//   };

//   const secondsToMMSS = (time: number | undefined): string => {
//     if (time == undefined) return "";
//     const seconds: number = time % 60;
//     const minutes: number = Math.trunc(time / 60);
//     return (
//       minutes.toFixed(0).padStart(2, "0") +
//       ":" +
//       seconds.toFixed(0).padStart(2, "0")
//     );
//   };

//   const getScrollTime = (): string => {
//     return secondsToMMSS(scrollPosition * duration);
//   };
//   // #endregion

//   // #region pointeractions
//   // toggle the play/pause mode on button click
//   function handlePlayPauseClick() {
//     isPlaying.current = !isPlaying.current;
//     triggerPlayState(scrollPosition);
//     debug.log(`play mode toggled to ${!isPlaying.current}`);
//   }

//   // restart the piece at the beginning
//   const handleRestart = () => {
//     if (!imageElem) {
//       debug.warn("handleRestart: image element not yet defined");
//       return;
//     }
//     setScrollPosition(0);
//     if (audioElem) audioElem.currentTime = 0;
//     // imageElem.classList.remove("scrolling");
//     // imageElem.style.setProperty("transform", "translateX(0px)", "important");
//     // imageElem.style.animationDelay = "0px";
//     isPlaying.current = false;
//     triggerPlayState(0);
//     debug.log("restart");
//   };

//   // pointer down on range input.
//   // cancel playing mode
//   // set the scroll position to the new range value
//   // enter manual image positionion mode
//   const handleRangeMouseDown = (event: React.MouseEvent<HTMLInputElement>) => {
//     if (!imageElem) {
//       debug.warn("handleRangeMouseDown: image is not yet defined");
//       return;
//     }
//     isPlaying.current = false;
//     const _position: number = parseFloat(event.currentTarget.value);
//     setScrollPosition(_position);
//     triggerPlayState(_position);
//     debug.log("start manual scrolling at ", _position);
//   };

//   // pointer moved while down in range element
//   // move the scroll position and change the image offset
//   const handleRangeMouseChange = (
//     event: React.ChangeEvent<HTMLInputElement>,
//   ) => {
//     if (!imageElem) {
//       debug.warn("handleRangeMouseChange: image is not yet defined");
//       return;
//     }

//     const _position: number = parseFloat(event.currentTarget.value);
//     setScrollPosition(_position);
//     triggerPlayState(_position);
//     debug.log("continue manual scrolling at ", _position);
//   };

//   // mouse up on range element
//   // set the latest image position and audio time
//   // start audio playing and image scrolling
//   const handleRangeMouseUp = (event: React.MouseEvent<HTMLInputElement>) => {
//     if (!imageElem || !audioElem) {
//       debug.warn("handleRangeMouseChange: image and audio is not yet defined");
//       return;
//     }
//     const _position: number = parseFloat(event.currentTarget.value);
//     setScrollPosition(_position);
//     audioElem.currentTime = _position * duration;
//     isPlaying.current = true;
//     triggerPlayState(_position);
//   };
//   // #endregion
//   // #region audioactions
//   // get the audio duration and set the duration and windowing parameters
//   // this should load the image data
//   const handleAudioMetaData = (
//     event: React.SyntheticEvent<HTMLAudioElement>,
//   ) => {
//     const _duration: number = event.currentTarget.duration;
//     setDuration(_duration);
//     debug.log("audio metadata loaded, duration", _duration);
//   };

//   // as the audio advances update the scroll position for user reporting
//   // on the range element
//   const handleAudioTimeUpdate = (
//     event: React.SyntheticEvent<HTMLAudioElement>,
//   ) => {
//     if (duration == 0 || !imageElem) {
//       if (duration == 0)
//         debug.warn(
//           "handleAudioTimeUpdate: audio time updating before duration has been defined",
//         );
//       if (!imageElem)
//         debug.warn(
//           "handleAudioTimeUpdate: attempt to update audio time when image has not been defined",
//         );
//       return;
//     }
//     const _currentTime: number = event.currentTarget.currentTime;
//     const _position: number = _currentTime / duration;
//     setScrollPosition(_position);
//     // force pause when at the end
//     if (_position >= 1) isPlaying.current = false;
//     triggerPlayState(_position);

//     debug.log(
//       `new scroll position ${_currentTime / duration}, time ${_currentTime}`,
//     );
//   };

//   // stop the audio playing and the image scrolling
//   const handleAudioEnded = () => {
//     if (!imageElem) {
//       debug.warn("handleAudioEnded: image is not yet defined");
//       return;
//     }

//     isPlaying.current = false;
//     setScrollPosition(1);
//     triggerPlayState(1);
//     debug.log("playback ended");
//   };
//   // #endregion


//   // #region HTML
//   return (
//     <div className="play">
//       <Header
//       running={running}
//       isPaused={!isPlaying}
//       onExit={onExit}
//       OnStartStop={onStopStart}
//       onPauseResume={onPauseResume}/>
//       <Timeline playTimeline={playTimeLine} ticks={ticks}/>
//             <audio
//         id={"audio"}
//         src={audioSrc != ""? audioSrc : undefined}
//         controls={false}
//         onLoadedMetadata={(event) => handleAudioMetaData(event)}
//         onTimeUpdate={(event) => handleAudioTimeUpdate(event)}
//         onEnded={() => handleAudioEnded()}
//       ></audio>
//       <div
//         id="image-container"
//         // className={`scroll-container`}
//         style={{ width: "100vw", height: "52vw", backgroundColor: "white" }}
//       />
//     <Footer 
//     voiceHues={voiceHues}
//     />



//     <div style={{ width: "100vw", height: "52vw" }}>
//       <button 
//         type="button"
//         style={{
//           marginBottom: "10px",
//           padding: "8px 16px",
//           fontSize: "16px",
//           marginRight: "10px",
//         }}
//         onClick={() => setMode(PLAYMODE.idle)}
//       >
//         {isPlaying.current ? "Pause" : "Play"}
//       </button>
//       <button
//         type="button"
//         style={{
//           marginBottom: "10px",
//           padding: "8px 16px",
//           fontSize: "16px",
//           marginRight: "10px",
//         }}
//         onClick={() => handlePlayPauseClick()}
//       >
//         {isPlaying.current ? "Pause" : "Play"}
//       </button>
//       <button
//         type="button"
//         onClick={() => handleRestart()}
//         style={{
//           marginBottom: "10px",
//           padding: "8px 16px",
//           fontSize: "16px",
//           marginRight: "10px",
//         }}
//       >
//         Restart
//       </button>
//       <label>
//         <span style={{ width: "6em" }}>{getScrollTime()}</span>
//         <input
//           type="range"
//           value={scrollPosition}
//           min={0}
//           max={1}
//           step={0.01}
//           onMouseDownCapture={(event) => handleRangeMouseDown(event)}
//           onChange={(event) => handleRangeMouseChange(event)}
//           onMouseUp={(event) => handleRangeMouseUp(event)}
//         />
//         <span>{secondsToMMSS(duration)}</span>
//       </label>
//     </div>
//     </div>
//   );
//   // #endregion
// }
