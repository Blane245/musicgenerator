// https://github.com/Blane245/musicgenerator/issues/5#issue-2550789485

import { useEffect, useState } from "react";
import { useCMGContext } from "../cmgcontext";
import {
  CMGeneratorType,
  GENERATIONMODE,
  SAMPLERATE,
  SourceData,
} from "../types";
import { buildSources } from "./buildsources";
import Preview from "./preview";
import ReadyGenerate from "./readygenerate";
import Record from "./record";

// the state of the system changes here when the audio context is defined
// the audio render graph is built
// each of the active generators are responsible for define the needed
// audio nodes and connecting them together.
// using the defined cm generators for all tracks, create a web audio
// if a generator is provided
export interface GeneratorProps {
  mode: GENERATIONMODE;
  setMode: Function;
  generator: CMGeneratorType | null;
}
export default function Generate(props: GeneratorProps) {
  const { mode, setMode, generator } = props;
  const { setStatus, playing, setTimeProgress, fileContents, timeInterval, setGeneratorsPlaying } = useCMGContext();
  const [error, setError] = useState<string>("");

  // all of the work of the generator is done by this hook when the
  // mode changes to to anything but idle
  useEffect(() => {
    if (mode != GENERATIONMODE.idle) {
      const {
        SFPGenerators,
        SFRGenerators,
        NoiseGenerators,
        playbackLength,
        offsetTime,
        error,
      } = ReadyGenerate({
        mode,
        generator,
        fileContents,
        timeInterval,
      });
      setError(error);
      if (error == "") {
        playing.current = true;
        setTimeProgress(0);

        // the audio context is either on active speaker context of an offline one depending on the mode
        const live: boolean =
          mode == GENERATIONMODE.preview || mode == GENERATIONMODE.solo;

        // set the context and suspend live performance until the source data
        // is assembled
        const context: AudioContext | OfflineAudioContext = live
          ? new AudioContext()
          : new OfflineAudioContext(2, SAMPLERATE * playbackLength, SAMPLERATE);
        if (live) (context as AudioContext).suspend();

        // set up the room equalizer and compressor
        fileContents.equalizer.setContext(context);
        fileContents.compressor.setContext(context);
        const roomConcentrator: GainNode = context.createGain();
        roomConcentrator.connect(fileContents.equalizer.front());
        if (fileContents.compressor.effect) {
          fileContents.equalizer.back().connect(fileContents.compressor.effect);
          fileContents.compressor.effect.connect(context.destination);
        } else console.log("generator: compressor missing");

        // build the generator sources and connect to the room concentrator
        const sourceData: SourceData[] = buildSources({
          context,
          roomConcentrator,
          SFPGenerators,
          SFRGenerators,
          NoiseGenerators,
        });

        if (live) {
          Preview({
            context: context as AudioContext,
            playbackLength,
            offsetTime,
            sourceData,
            setMode,
            playing,
            setTimeProgress,
            setGeneratorsPlaying,
            setStatus,
          });
        } else if (mode == GENERATIONMODE.record) {
          Record({
            context: context as OfflineAudioContext,
            sourceData,
            setMode,
            setStatus,
            playing,
          });
        }
      }
    }
  }, [mode]);

  function handleErrorClose() {
    setError("");
    setMode(GENERATIONMODE.idle);
    setStatus(``);
  }

  return (
    <div
      style={{ display: error == "" ? "none" : "block" }}
      className="modal-content"
    >
      <div className="modal-header">
        <span className="close" onClick={handleErrorClose}>
          &times;
        </span>
        <h2>Error occurred during audio generation</h2>
      </div>
      <div className="modal-body">
        <p>{error}</p>
      </div>
      <div className="modal-footer">
        <button id={"generator-error"} onClick={handleErrorClose}>
          OK
        </button>
      </div>
    </div>
  );
}
