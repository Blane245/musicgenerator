// only displays the status
import CMG2 from "assets/CMG2.svg";
import SignalLevel from "classes/signallevel";
import { useCMGContext } from "cmgcontext";
import React, { SyntheticEvent, useEffect, useRef, useState } from "react";
import {
  AiFillCloseCircle,
  AiFillPauseCircle,
  AiFillPlayCircle,
  AiFillSave,
  AiFillStepBackward,
} from "react-icons/ai";
import { FcAddressBook, FcOk } from "react-icons/fc";
import { dBToGain, toNote } from "sfcomponents/util";
import { SAMPLERATE, PlayData } from "types";
import { debug } from "utils/debug";
import secondsToMMSS from "utils/secondstommss";

// as this function is non-reactive except for exit, stop, pause, resume, many of its props
// are CMG context variables
export interface PlayProps {
  playData: PlayData | null;
}
const IMAGEPADDING: number = 50; //px

// Display the Play window to render the audio and play image
// UI includes play/pause/restart/exit controls
// along with volume, voice legend, and save audio functions
// the playData will be nulled to signal completion of this component
export default function Play(params: PlayProps): JSX.Element {
  let { playData } = params;
  const {
    screenWidth: windowWidth,
    screenHeight: windowHeight,
    setStatus,
    headerHeight,
    footerHeight,
    appName,
    appVersion,
    fileContents,
    recordFormat,
    setPlayData,
  } = useCMGContext();
  const isPlaying = useRef<boolean>(false);
  const [showLegend, setShowLegend] = useState<boolean>(false);
  const [containerElem, setContainerElem] = useState<HTMLDivElement | null>(
    null,
  );
  const [labelElem, setLabelElem] = useState<HTMLDivElement | null>(
    null,
  );
  const [audioElem, setAudioElem] = useState<HTMLAudioElement | null>(null);
  const [imageElem, setImageElem] = useState<HTMLImageElement | null>(null);
  const [audioSrc, setAudioSrc] = useState<string>("");
  const [audioVolume, setAudioVolume] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0); // total duration of the audio (sec)
  const [imageDuration, setImageDuration] = useState<number>(0); // the time frame of the image (60 minute intervals)
  const [imageWidth, setImageWidth] = useState<number>(0); // the window size times the number of minutes in the image
  const [audioPosition, setAudioPosition] = useState<number>(0); // the current time of the audio, either playing or positioning
  const [signalLevel, setSignalLevel] = useState<{
    average: number[];
    maximum: number[];
  }>({ average: Array<number>(2).fill(0), maximum: Array<number>(2).fill(0) });

  const resetTime = useRef<number>(0);
  const RESETINCREMENT: number = 100; // sec
  const levelObject = useRef<SignalLevel>(new SignalLevel(2));
  const timerId = useRef<number>(0);
  const TIMERDELTA: number = 20; //ms
  const timerIncrement = useRef<number>(0);
  const SIGNALWINDOW: number = 1024;
  const LEVELHEIGHT: string = "20";
  const LEVELWIDTH: number = 150;
  const LEVELSTROKE: string[] = ["green", "red"];
  const LEVELAVERAGE: string = "black";
  const LEVELMAXIMUM: string = "gray";

  // #region useeffect
  // capture the audio and image elements at start up
  // load the audiodata to the audio tag
  useEffect(() => {
    const aElem: HTMLElement | null = document.getElementById("audio");
    if (aElem) {
      setAudioElem(aElem as HTMLAudioElement);
      (aElem as HTMLAudioElement).pause();
    }
    const cElem: HTMLElement | null =
      document.getElementById("image-container");
    if (cElem) {
      setContainerElem(cElem as HTMLDivElement);
    }
    const lElem: HTMLElement | null =
      document.getElementById("play-label");
    if (lElem) {
      setLabelElem(lElem as HTMLDivElement);
    }
  }, []);

  // Cleanup on unmount to ensure timers and listeners are cleared
  useEffect(() => {
    return () => {
      if (timerId.current) {
        clearTimeout(timerId.current);
      }
      if (audioElem) {
        audioElem.pause();
      }
    };
  }, [audioElem]);

  useEffect(() => {
    if (!playData) return;
    const objectUrl = URL.createObjectURL(playData.audio);
    setAudioSrc(objectUrl);
    debug.info("Play: audio loaded");
  }, [playData?.audio]);

  // when playdata image arrives load the image
  // into the image element and add the annotations
  useEffect(() => {
    if (!containerElem || !labelElem || !playData)
      return;
    const img: HTMLImageElement = playData.image;
    img.style.paddingLeft = IMAGEPADDING.toString() + "px";
    setImageElem(playData.image);
    while (containerElem.firstChild) containerElem.firstChild.remove();
    containerElem.appendChild(img);

    // add the current time line and vertical axis labels
    const labelElement: SVGSVGElement = buildLabels();
    while (labelElem.firstChild) labelElem.firstChild.remove();
    labelElem.appendChild(labelElement);
    debug.info("Play: image appended to image-container, width", img.style.width);
  }, [playData?.image, containerElem, labelElem]);

  // #endregion

  // #region utilities

  // when playing get the signal level from the current time to some number of samples in the past
  const getSignalLevel = (time: number) => {
    if (!playData) return;
    const startSample: number = Math.trunc(time * SAMPLERATE - SIGNALWINDOW);
    if (startSample >= 0) {
      const { average, maximum } = levelObject.current.getSignalLevel(
        playData.audioBuffer,
        startSample,
        SIGNALWINDOW,
      );
      setSignalLevel({ average, maximum });
    } else {
      setSignalLevel({
        average: Array<number>(2).fill(0),
        maximum: Array<number>(2).fill(0),
      });
    }
  };

  // build the labels for the image
  const buildLabels = (): SVGSVGElement => {
    const svgElem: SVGSVGElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    svgElem.setAttribute("height", windowWidth.toString());
    svgElem.setAttribute("width", "100px");
    svgElem.setAttribute("x", "0px");
    svgElem.setAttribute("y", "0px");

    // add vertical labels
    let currentY: number = 0;
    for (let i = 127; i >= 0; i--) {
      if (i % 12 == 0) {
        const label: SVGTextElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text",
        );
        label.setAttribute("x", (IMAGEPADDING - 10).toString() + "px");
        label.setAttribute("y", (currentY - 6).toString() + "px");
        label.textContent = toNote(i);
        label.setAttribute("font-size", "10pt");
        label.setAttribute("fill", "black");
        svgElem.appendChild(label);
      }
      currentY += (windowHeight - 40) / 128;
    }

    // add current time line
    const t0: SVGLineElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line",
    );
    t0.setAttribute("x1", (IMAGEPADDING - 20).toString() + "px");
    t0.setAttribute("y1", "0px");
    t0.setAttribute("x2", (IMAGEPADDING - 20).toString() + "px");
    t0.setAttribute("y2", windowWidth.toString() + "px");
    t0.setAttribute("stroke", "red");
    t0.setAttribute("fill", "red");
    t0.setAttribute("stroke-width", "4px");
    svgElem.appendChild(t0);
    return svgElem;
  };

  // image scroll timer
  const imageTimer = () => {
    if (!imageElem) return;
    if (isPlaying.current) {
      timerId.current = window.setTimeout(imageTimer, TIMERDELTA);
      timerIncrement.current += TIMERDELTA / 1000;
      imageElem.style.transform = `translateX(-${(timerIncrement.current / imageDuration) * imageWidth}px)`;
    } else clearTimeout(timerId.current);
  };

  // change the state of the system when isPlaying changes
  // time is the audio time to use to set the image translation
  const triggerPlayState = (time: number) => {
    if (!imageElem || !audioElem) return;

    // reset the maximum every RESETINCREMENT seconds
    if (time > resetTime.current) {
      resetTime.current += RESETINCREMENT;
      levelObject.current.resetMaximum();
    }

    getSignalLevel(time);
    if (isPlaying.current) {
      // stop the timer and adjust the position to the scroll position
      if (timerId.current) {
        clearTimeout(timerId.current);
        debug.log("Play: timerId cleared", timerId.current);
      }

      // discipline the image translation to account for timer drift
      imageElem.style.transform = `translateX(-${(time / imageDuration) * imageWidth}px)`;

      // tell the audio to play (it will already be playing if this is a audio position update)
      if (audioElem.paused) audioElem.play();
      // restart the timer at the current audio position
      timerIncrement.current = time;
      timerId.current = window.setTimeout(imageTimer, TIMERDELTA);
      debug.log("Play: audio playing at audio time, timerId", time, timerId.current);
    } else {
      if (timerId.current) {
        clearTimeout(timerId.current);
        debug.log("Play: pause: timerId cleared", timerId.current);
      }
      if (!audioElem.paused) audioElem.pause();
      // make the image align on the proper scroll position
      imageElem.style.transform = `translateX(-${(time / imageDuration) * imageWidth}px)`;
      debug.log("Play: audio paused at audio time, timerId", time, timerId.current);
    }
  };

  // #endregion

  // #region pointeractions
  const handleExit = () => {
    if (timerId.current) clearTimeout(timerId.current);
    setPlayData(null);
    setShowLegend(false);
    isPlaying.current = false;
    setStatus(`Play Terminated`);
  };

  // either start the play or exit
  const handlePlayPauseClick = () => {
    isPlaying.current = !isPlaying.current;
    triggerPlayState(audioPosition);
    debug.log(`Play: playing toggled to ${isPlaying.current} at time ${audioPosition}`);
  };

  // restart the piece at the beginning
  const handleRestart = () => {
    if (!imageElem) {
      debug.warn("Play: handleRestart: image element not yet defined");
      return;
    }
    setAudioPosition(0);
    levelObject.current.resetMaximum();
    setSignalLevel({ average: [0, 0], maximum: [0, 0] });
    if (audioElem) audioElem.currentTime = 0;
    imageElem.classList.remove("scrolling");
    imageElem.style.setProperty("transform", "translateX(0px)");
    imageElem.style.animationDelay = "0px";
    isPlaying.current = false;
    triggerPlayState(0);
    debug.log("restart");
  };

  // save the audio file
  const handleSave = async () => {
    if (isPlaying.current) return;
    try {
      if (!playData) return;

      // Determine file extension and MIME type
      const isMP3 = recordFormat === "mp3";
      const fileExt = isMP3 ? ".mp3" : ".wav";
      const mimeType = isMP3 ? "audio/mpeg" : "audio/wav";

      // Extract base filename from CMG file
      const cmgTypeIndex: number = fileContents.name.lastIndexOf(".cmg");
      let suggestedName = "output" + fileExt;
      if (cmgTypeIndex > 0) {
        const baseName = fileContents.name.substring(
          fileContents.name.lastIndexOf("\\") + 1,
          cmgTypeIndex,
        );
        suggestedName = baseName + fileExt;
      }

      // Ask user where to save the file
      const handle: FileSystemFileHandle = await window.showSaveFilePicker({
        suggestedName: suggestedName,
        types: [
          {
            description: isMP3 ? "MP3 Audio File" : "WAV Audio File",
            accept: { [mimeType]: [fileExt] },
          },
        ],
      });
      if (!handle) return;
      // Write the audio blob to the file
      const writable: FileSystemWritableFileStream =
      await handle.createWritable();
      await writable.write(playData.audio);
      await writable.close();
      window.alert(`File saved successfully as ${handle.name}`);
    } catch (e) {
      const error = e as Error;
      // Don't show error if user cancelled the dialog
      if (error.name !== "AbortError") {
        debug.error(`Play: Exception error while writing audio file - ${error.message}`);
        window.alert(`Error saving file: ${error.message}`);
      }
    }
  };

  // pointer down on range input.
  // cancel playing mode
  // set the scroll position to the new range value
  // enter manual image positionion mode
  const handleRangeMouseDown = (event: React.MouseEvent<HTMLInputElement>) => {
    if (!imageElem) {
      debug.warn("Play: handleRangeMouseDown: image is not yet defined");
      return;
    }
    isPlaying.current = false;
    const time: number = parseFloat(event.currentTarget.value);
    setAudioPosition(time);
    triggerPlayState(time);
    debug.log("Play: start manual scrolling at time ", time);
  };

  // pointer moved while down in range element
  // move the scroll position and change the image offset
  const handleRangeMouseChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!imageElem) {
      debug.warn("Play: handleRangeMouseChange: image is not yet defined");
      return;
    }

    const time: number = parseFloat(event.currentTarget.value);
    setAudioPosition(time);
    triggerPlayState(time);
    debug.log("Play: continue manual scrolling at time", time);
  };

  // mouse up on range element
  // set the latest image position and audio time
  // start audio playing and image scrolling
  const handleRangeMouseUp = (event: React.MouseEvent<HTMLInputElement>) => {
    if (!imageElem || !audioElem) {
      debug.warn("Play: handleRangeMouseChange: image and audio is not yet defined");
      return;
    }
    const time: number = parseFloat(event.currentTarget.value);
    levelObject.current.resetMaximum();
    setSignalLevel({ average: [0, 0], maximum: [0, 0] });
    setAudioPosition(time);
    audioElem.currentTime = time;
    isPlaying.current = true;
    triggerPlayState(time);
  };

  // #endregion

  // #region audioactions
  // get the audio duration and set the duration and windowing parameters
  // this should load the image data
  const handleAudioMetaData = (event: SyntheticEvent<HTMLAudioElement>) => {
    // when the audio duration is known, set the scales
    // for the image time and width
    // 60 seconds / window width
    const duration: number = event.currentTarget.duration;
    setAudioDuration(duration);
    const imageTime: number = (Math.trunc(duration / 60) + 1) * 60;
    setImageDuration(imageTime);
    setImageWidth((imageTime * windowWidth) / 60);
    debug.log("Play: audio metadata loaded, duration", duration);
  };

  // as the audio advances update the scroll position for user reporting
  // on the range element
  const handleAudioTimeUpdate = (
    event: SyntheticEvent<HTMLAudioElement, Event>,
  ) => {
    if (audioDuration == 0 || !imageElem) {
      if (audioDuration == 0)
        debug.warn(
          "Play: handleAudioTimeUpdate: audio time updating before duration has been defined",
        );
      if (!imageElem)
        debug.warn(
          "Play: handleAudioTimeUpdate: attempt to update audio time when image has not been defined",
        );
      return;
    }
    const currentTime: number = event.currentTarget
      ? event.currentTarget["currentTime"]
      : 0;
    setAudioPosition(currentTime);
    // force pause when at the end
    if (currentTime >= audioDuration) isPlaying.current = false;
    triggerPlayState(currentTime);

    debug.log(`Play: new audio time ${currentTime}`);
  };

  // adjust the playback volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioElem) return;
    const value: number = parseFloat(e.currentTarget.value);
    levelObject.current.resetMaximum();
    setSignalLevel({ average: [0, 0], maximum: [0, 0] });
    setAudioVolume(value);
    audioElem.volume = dBToGain((value - 10) * 2);
  };

  // stop the audio playing and the image scrolling
  const handleAudioEnded = () => {
    if (!imageElem) {
      debug.warn("handleAudioEnded: image is not yet defined");
      return;
    }
    isPlaying.current = false;
    setAudioPosition(audioDuration);
    triggerPlayState(audioDuration);
    debug.log("Play: playback ended");
  };
  // #endregion

  // #region HTML
  return (
    <>
      <div className="play">
        <div
          className="play-header"
          style={{ width: windowWidth, height: headerHeight }}
        >
          <div className="icon">
            <img src={CMG2} alt="CMG" />
          </div>
          <div className="buttons">
            <button type="button" onClick={() => handlePlayPauseClick()}>
              {isPlaying.current ? <AiFillPauseCircle /> : <AiFillPlayCircle />}
            </button>
            <input
              type="range"
              onChange={(e) => handleVolumeChange(e)}
              min={-10}
              max={10}
              step={1}
              value={audioVolume}
            />
            <button type="button" onClick={() => handleRestart()}>
              <AiFillStepBackward />
            </button>
            <button type="button" onClick={() => setShowLegend(!showLegend)}>
              <FcAddressBook />
            </button>
            <label>
              <span style={{ width: "6em" }}>
                {secondsToMMSS(audioPosition)}
              </span>
              <input
                type="range"
                value={audioPosition}
                min={0}
                max={audioDuration}
                step={5}
                onMouseDownCapture={(event) => handleRangeMouseDown(event)}
                onChange={(event) => handleRangeMouseChange(event)}
                onMouseUp={(event) => handleRangeMouseUp(event)}
              />
              <span style={{ width: "6em" }}>{secondsToMMSS(audioDuration)}</span>
            </label>
            <button
              type="button"
              disabled={isPlaying.current}
              onClick={() => handleSave()}
            >
              <AiFillSave />
            </button>
            <button type="button" onClick={() => handleExit()}>
              <AiFillCloseCircle />
            </button>
          </div>
          <div className="levels">
            <svg
              width={LEVELWIDTH.toString() + "px"}
              height={LEVELHEIGHT + "px"}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d={`M 0 0 V ${LEVELHEIGHT} H ${LEVELWIDTH.toString()} V 0`}
                stroke={LEVELSTROKE[0]}
                fill="transparent"
                strokeWidth={2}
              />
              <path
                d={`M ${Math.min(signalLevel.average[0] * LEVELWIDTH, LEVELWIDTH)} 0 V ${LEVELHEIGHT}`}
                stroke={LEVELAVERAGE}
                fill="transparent"
                strokeWidth={2}
              />
              <path
                d={`M ${Math.min(signalLevel.maximum[0] * LEVELWIDTH, LEVELWIDTH)} 0 V ${LEVELHEIGHT}`}
                stroke={LEVELMAXIMUM}
                fill="transparent"
                strokeWidth={2}
              />
            </svg>
            <svg
              width={LEVELWIDTH.toString() + "px"}
              height={LEVELHEIGHT + "px"}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d={`M 0 0 V ${LEVELHEIGHT} H ${LEVELWIDTH.toString()} V 0`}
                stroke={LEVELSTROKE[1]}
                fill="transparent"
                strokeWidth={2}
              />
              <path
                d={`M ${Math.min(signalLevel.average[1] * LEVELWIDTH, LEVELWIDTH)} 0 V ${LEVELHEIGHT}`}
                stroke={LEVELAVERAGE}
                fill="transparent"
                strokeWidth={2}
              />
              <path
                d={`M ${Math.min(signalLevel.maximum[1] * LEVELWIDTH, LEVELWIDTH)} 0 V ${LEVELHEIGHT}`}
                stroke={LEVELMAXIMUM}
                fill="transparent"
                strokeWidth={2}
              />
            </svg>
          </div>
          <div className="title" style={{ fontWeight: "bold" }}>
            {`${appName}: ${appVersion} (${fileContents.name})${fileContents.dirty ? "*" : ""}`}
          </div>
        </div>
        <audio
          id={"audio"}
          src={audioSrc != "" ? audioSrc : undefined}
          controls={false}
          onLoadedMetadata={(event) => handleAudioMetaData(event)}
          onTimeUpdate={(event) => handleAudioTimeUpdate(event)}
          onEnded={() => handleAudioEnded()}
        ></audio>
        <div
          className="play-body"
          hidden={!imageElem}
          style={{ width: `${windowWidth}px`, height: `${windowWidth}px` }}
        >
          <div id="image-container" />
          <div
            id="play-label"
            style={{
              // zIndex: 2001,
              position: "absolute",
              top: "40px",
              left: "20px",
              height: windowHeight.toString() + "px",
            }}
          />
        </div>
        <div
          className="play-footer"
          style={{ width: windowWidth, height: footerHeight }}
        ></div>
      </div>
      {showLegend && (
        <div
          className="modal-content"
          style={{
            position: "absolute",
            top: "40px",
            left: (windowWidth - 500).toString() + "px",
            backgroundColor: "white",
            zIndex:2001,
          }}
        >
          <div className="modal-header">Voice Legend</div>
          <div className="modal-body">
            <table>
              <thead>
                <tr>
                  <th>SoundFont</th>
                  <th>Preset</th>
                  <th>Hue</th>
                </tr>
              </thead>
              <tbody>
                <>
                  {!!playData &&
                    Array.from(playData.voiceHues).map((value) => {
                      const splitName: string[] = value[0].split("|");
                      return (
                        <tr key={value[0]}>
                          <td>{splitName[0]}</td>
                          <td>{splitName[1]}</td>
                          <td style={{ backgroundColor: "lightgray" }}>
                            <svg width="50px" height="50px">
                              <rect
                                fill={
                                  "hsl(" + value[1].toString() + ",100%,55%)"
                                }
                                stroke="none"
                                width="50px"
                                height="50px"
                              ></rect>
                            </svg>
                          </td>
                        </tr>
                      );
                    })}
                </>
              </tbody>
            </table>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => setShowLegend(false)}>
              <FcOk />
            </button>
          </div>
        </div>
      )}
    </>
  );
  // #endregion
}
