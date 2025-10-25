// provides CRUD for all types of generators
import { Algorithmic, AudioFile, Silent } from "classes/generators";
import Track from "classes/track";
import { useCMGContext } from "cmgcontext";
import { buildSources } from "playfunctions/buildsources";
import Play from "playfunctions/play";
import ReadyPlay from "playfunctions/readyplay";
import { ChangeEvent, FormEvent, MouseEvent, useEffect, useState } from "react";
import { SFPool } from "sfcomponents/sfpool";
import { Preset } from "sfcomponents/types";
import { bankPresettoName, precision } from "sfcomponents/util";
import { SoundFont2 } from "soundfont2";
import { GeneratorType, GENERATORTYPE, PLAYMODE, TIMELINETYPE } from "types";
import { addGenerator, modifyGenerator } from "utils/cmfiletransactions";
import { getGeneratorUID } from "utils/getgeneratoruid";
import GeneratorTypeForm from "./generatortypeform";

// The icon starts at the generator's start time and ends at the generators endtime
export interface GeneratorDialogProps {
  track: Track;
  generatorType: string;
  generator: GeneratorType | null;
  newGenerator: boolean;
}

export default function GeneratorDialog(props: GeneratorDialogProps) {
  const { track, generatorType, generator, newGenerator } = props;
  type SFDataType = {
    soundFont: SoundFont2 | undefined;
    presets: Preset[];
    preset: Preset | undefined;
    presetName: string;
  };

  const {
    fileContents,
    setFileContents,
    setStatus,
    timeLine,
    timeInterval,
    playing,
    setMode,
    setSourceData,
    setGeneratorDialogVisible,
  } = useCMGContext();
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [oldName, setOldName] = useState<string>("");
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [formData, setFormData] = useState<GeneratorType>(new Silent(0));
  const [soundFontData, setSoundFontData] = useState<SFDataType>({
    soundFont: undefined,
    presets: [],
    preset: undefined,
    presetName: "",
  });
  const [audioFileData, setAudioFileData] = useState<AudioFile>(
    new AudioFile(0)
  );
  const [locked, setLocked] = useState<boolean>(false);

  useEffect(() => {
    // either get the generator from the track or build a new one if being added
    if (newGenerator && !generator) {
      // create a generator with a unique name
      let next = getGeneratorUID(fileContents.tracks);
      switch (generatorType) {
        case GENERATORTYPE.Silent:
          {
            const g = new Silent(next);
            setFormData(g);
            setOldName(g.name);
          }
          break;
        case GENERATORTYPE.Algorithmic:
          {
            const g = new Algorithmic(next);
            setFormData(g);
            setOldName(g.name);
          }
          break;
        case GENERATORTYPE.AudioFile:
          {
            const g = new AudioFile(next);
            setFormData(g);
            setOldName(g.name);
          }
          break;
      }
    } else if (generator) {
      setFormData(generator);
      if (generator.type == GENERATORTYPE.Algorithmic) {
        const g = generator as Algorithmic;
        setSoundFontData({
          soundFont: g.soundFont,
          presets: g.presets,
          preset: g.preset,
          presetName: g.presetName,
        });
      }
      if (oldName == "") setOldName(generator.name);
    } else {
      setStatus(
        "Generator dialog entered with wron mode. newGenerator is false and generator is null"
      );
    }
    setErrorMessages([]);
  }, [generator]);

  // when the soundfont data has been loaded, update the algorithmic generator form
  useEffect(() => {
    setFormData((prev: GeneratorType) => {
      const n: Algorithmic = (prev as Algorithmic).copy();
      n.soundFont = soundFontData.soundFont;
      n.preset = soundFontData.preset;
      n.presetName = soundFontData.presetName;
      n.presets = soundFontData.presets;
      setLocked(false);
      return n;
    });
  }, [soundFontData]);

  // when the audio file is loaded, update the form to reveal its properties
  useEffect(() => {
    setFormData((prev: GeneratorType) => {
      const n: AudioFile = (prev as AudioFile).copy();
      return n;
    });
    setLocked(false);
  }, [audioFileData]);

  // when playing stops take down the stop preview popup
  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ): void {
    if (!timeLine) return;
    // update the form with the new attribute value
    setFormData((prev: GeneratorType) => {
      let eventName: string | null = event.target["name"];
      let eventValue: string =
        event.target["type"] != "checkbox"
          ? event.target["value"]
          : event.target.checked.toString();

      if (!eventName || !eventValue) return prev;

      function measureBeatToTime (measure: number, beat: number, measureLength: number, beatsPerMeasure: number): number {
        return (measure - 1 + (beat - 1) / beatsPerMeasure) * measureLength;
      }

      // handle the measure and beat items, changing them to 
      // start and stop time changes
      switch (eventName) {
        case 'startMeasure': {
          eventName = 'startTime'
          const startBeatValue:number = parseInt((document.getElementById('startBeat') as HTMLInputElement).value);
          eventValue = measureBeatToTime(
            parseInt(eventValue),
            startBeatValue,
            timeLine.measureSize,
            timeLine.beatsPerMeasure).toString();
          }
          break;
        case 'startBeat': {
          eventName = 'startTime'
          const startMeasureValue:number = parseInt((document.getElementById('startMeasure') as HTMLInputElement).value);
          eventValue = measureBeatToTime(
            startMeasureValue,
            parseInt(eventValue),
            timeLine.measureSize,
            timeLine.beatsPerMeasure).toString();
          }
          break;
        case 'stopMeasure': {
          eventName = 'stopTime'
          const stopBeatValue:number = parseInt((document.getElementById('stopBeat') as HTMLInputElement).value);
          eventValue = measureBeatToTime(
            parseInt(eventValue),
            stopBeatValue,
            timeLine.measureSize,
            timeLine.beatsPerMeasure).toString();
          }
          break;
        case 'stopBeat': {
          eventName = 'stopTime'
          const stopMeasureValue:number = parseInt((document.getElementById('stopMeasure') as HTMLInputElement).value);
          eventValue = measureBeatToTime(
            stopMeasureValue,
            parseInt(eventValue),
            timeLine.measureSize,
            timeLine.beatsPerMeasure).toString();
          }
          break;
      }

      // select the proper generator type
      switch (formData.type) {
        case GENERATORTYPE.Silent: {
          const newFormData: Silent = (prev as Silent).copy();
          newFormData.setAttribute(eventName, eventValue);
          return newFormData;
        }
        case GENERATORTYPE.Algorithmic: {
          const newFormData: Algorithmic = (prev as Algorithmic).copy();
          const isSet: boolean = newFormData.setAttribute(eventName, eventValue);
          if (!isSet) console.log('value not set eventname, eventvalue', eventName, eventValue);

          // when the soundfont filename changes, load the new soundfont and presets
          if (eventName == "soundfontfile") {
            loadSoundFontandUpdate(eventValue);
          }
          return newFormData;
        }
        case GENERATORTYPE.AudioFile: {
          const newFormData: AudioFile = (prev as AudioFile).copy();
          newFormData.setAttribute(eventName, eventValue);
          // when the filename is given, the stop time will been to update
          if (newFormData.fileName != "") {
            setAudioFileData(newFormData);
          }
          return newFormData;
        }
        default:
          console.log(
            `generator dialog: improper generator type ${formData.type}`
          );
          return prev as Silent;
      }
    });
  }

  function validate(): string[] {
    const msgs: string[] = [];
    switch (formData.type) {
      case GENERATORTYPE.Silent:
        {
          const newMessages = Silent.validate(
            formData as Silent,
            fileContents,
            oldName
          );
          msgs.push(...newMessages);
          setErrorMessages(msgs);
        }
        break;
      case GENERATORTYPE.Algorithmic:
        {
          const newMessages = Algorithmic.validate(
            formData as Algorithmic,
            fileContents,
            oldName
          );
          msgs.push(...newMessages);
          setErrorMessages(msgs);
        }
        break;
      case GENERATORTYPE.AudioFile:
        {
          const newMessages = AudioFile.validate(
            formData as AudioFile,
            fileContents,
            oldName
          );
          msgs.push(...newMessages);
          setErrorMessages(msgs);
        }
        break;
      default: {
        msgs.push(`Invalid generator type ${formData.type}`);
        setErrorMessages(msgs);
      }
    }
    return msgs;
  }
  function handleSubmit(event: FormEvent<Element>): void {
    event.preventDefault();

    const msgs: string[] = validate();
    if (msgs.length == 0) {
      if (newGenerator) {
        // add a new generator to the current track
        addGenerator(track, formData, setFileContents);
        setStatus(
          `Generator '${formData.name}' added to track '${track.name}'`
        );
      } else {
        // this is a modify. change the generator on the active track
        modifyGenerator(track, formData, oldName, setFileContents);
        setStatus(
          `Generator '${formData.name}' modified on track '${track.name}'`
        );
      }
      setGeneratorDialogVisible(false);
      setOldName("");
    }
  }

  function handlePreview() {
    const msgs: string[] = validate();
    if (formData.name != oldName)
      msgs.push(
        "Cannot preview after renaming the generator. Modify or add first and then preview."
      );
    if (msgs.length != 0) return;
    const {
      AlgorithmicGenerators,
      AudioFileGenerators,
      SilentGenerators,
      error,
    } = ReadyPlay({
      mode: PLAYMODE.solo,
      generator: formData,
      fileContents,
      timeInterval,
    });
    setStatus(error);
    if (error != "") return;
    const { sources: builtSourceData, error: buildError } = buildSources({
      fileContents,
      AlgorithmicGenerators,
      AudioFileGenerators,
      SilentGenerators,
    });
    if (buildError != "") {
      setStatus(
        `Error occurred while building source to preview: ${buildError}`
      );
      return;
    }
    // catch any errors during build
    setStatus(buildError);
    if (buildError != "") return;
    setSourceData(builtSourceData);
    playing.current = true;
    
    setPreviewVisible(true);
    setMode(PLAYMODE.solo);
    setStatus(``);
  }

  function handleCancelClick(event: MouseEvent<Element>) {
    event.preventDefault();
    setGeneratorDialogVisible(false);
    setOldName("");
    setStatus("");
  }

  function loadSoundFontandUpdate(fileName: string) {
    try {
      setLocked(true);
      LoadFile(fileName);
      // load the soundfont file and set the presets
      async function LoadFile(fileName: string) {
        const { soundFont } = await SFPool(fileName);
        setSoundFontData(() => {
          const presets: Preset[] = (soundFont.presets as Preset[]).sort(
            (a, b) => {
              if (a.header.bank < b.header.bank) return -1;
              if (a.header.bank > b.header.bank) return 1;
              return a.header.preset - b.header.preset;
            }
          );
          const preset: Preset = presets[0] as Preset;
          const presetName: string = bankPresettoName(preset);
          const newSoundFontData: SFDataType = {
            soundFont: soundFont,
            presets: presets,
            preset: preset,
            presetName: presetName,
          };
          return newSoundFontData;
        });
      }
    } catch (e: any) {
      setStatus(e);
    }
  }

  function timeToBeat (time: number): number {
    if (!timeLine) return 1;
    const beat: number = Math.trunc((time % timeLine.measureSize) * timeLine.beatsPerMeasure) + 1;
        return beat;
  }
  function timeToMeasure (time: number) : number {
    if (!timeLine) return 1;
    const measure: number = Math.trunc(time / timeLine.measureSize) + 1;
    return measure;
  }

  return (
    <fieldset disabled={locked}>
      <div
        className="generator-content"
        aria-modal="true"
        style={{ display: "block" }}
      >
        <div className="generator-header">
          <span className="close" onClick={handleCancelClick}>
            &times;
          </span>
          <span>
            {newGenerator
              ? "  Add " + formData.type + " Generator"
              : "  Generator: " + formData.name}
          </span>
        </div>
        <div className="generator-body">
          <form
            name="generator_CRUD"
            id="generator_CRUD"
            onSubmit={handleSubmit}
          >
            <label>
              Name:&nbsp;
              <input
                name="name"
                type="text"
                onChange={handleChange}
                value={formData.name}
              />
            </label>
            {timeLine?.mode == TIMELINETYPE.Time ? (
              <>
                <label>
                  &nbsp;Start Time:&nbsp;
                  <input
                    name="startTime"
                    type="number"
                    min={0}
                    step={0.01}
                    onChange={handleChange}
                    value={precision(formData.startTime, 2)}
                  />
                  <span> (sec) </span>
                </label>
                <label>
                  &nbsp;Stop Time:&nbsp;
                  <input
                    name="stopTime"
                    type="number"
                    min={0}
                    step={0.01}
                    onChange={handleChange}
                    value={precision(formData.stopTime, 2)}
                  />
                  <span> (sec) </span>
                </label>
              </>
            ) : null}
            {timeLine?.mode == TIMELINETYPE.Measure? (
              <>
              <label>
                &nbsp;Start Measure:&nbsp;
                <input 
                name='startMeasure'
                id='startMeasure'
                type='number'
                min={1}
                step={1}
                onChange={handleChange}
                value={timeToMeasure(formData.startTime)}
                />
              </label>
              <label>
                &nbsp;Start Beat:&nbsp;
                <input 
                name='startBeat'
                id='startBeat'
                type='number'
                min={1}
                step={1}
                max={timeLine.beatsPerMeasure}
                onChange={handleChange}
                value={timeToBeat(formData.startTime)}
                />
              </label>
              <label>
                &nbsp;Stop Measure:&nbsp;
                <input 
                name='stopMeasure'
                id='stopMeasure'
                type='number'
                min={1}
                step={1}
                onChange={handleChange}
                value={timeToMeasure(formData.stopTime)}
                />
              </label>
              <label>
                &nbsp;Stop Beat:&nbsp;
                <input 
                name='stopBeat'
                id='stopBeat'
                type='number'
                min={1}
                step={1}
                max={timeLine.beatsPerMeasure}
                onChange={handleChange}
                value={timeToBeat(formData.stopTime)}
                />
              </label>
              </>
            ):null}
            <br />
            <GeneratorTypeForm
              formData={formData}
              handleChange={handleChange}
            />
            <hr />
            <input type="submit" value={newGenerator ? "Add" : "Modify"} />
          </form>
        </div>
        <div className="generator-footer">
          <button
            type="button"
            id={"generator-preview:" + formData.name}
            onClick={handlePreview}
          >
            Preview
          </button>
          <button
            id={"generator-update:" + formData.name}
            onClick={handleCancelClick}
          >
            Cancel
          </button>
          {errorMessages.map((m, i) => (
            <h3 color="red" key={`error-${i}`}>
              {m}
            </h3>
          ))}
        </div>
      </div>
      {previewVisible ? <Play generator={formData} /> : null}
    </fieldset>
  );
}
