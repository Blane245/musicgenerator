import Stochastic from "classes/generators/stochastic";
import RandomNumber from "classes/randomnumber";
import { useCMGContext } from "cmgcontext";
import buildComposition from "playfunctions/helpers/buildcomposition";
import { ChangeEvent, MouseEvent, useEffect, useState } from "react";
import {
  AiFillCaretDown,
  AiFillCaretLeft,
  AiFillCaretRight,
  AiFillCaretUp,
} from "react-icons/ai";
import { SFPool } from "sfcomponents/sfpool";
import { Preset } from "sfcomponents/types";
import { precision, presetNameToPreset } from "sfcomponents/util";
import {
  Composition,
  DbEnsembleType,
  DBRESPONSETYPE,
  DbResponseType,
  dBVoiceType,
  EnsembleType,
  StochasticValues,
  TIMBRETYPE,
  Voice,
  Voices,
} from "types";
import { fetchDBData } from "utils/fetchdata";
import loadEnsembleList from "utils/loadEnsembleList";

interface StochasticCompostionProps {
  formData: Stochastic;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  setMessages: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function StochasticComposition(
  props: StochasticCompostionProps
): JSX.Element {
  const { formData, handleChange, setMessages } = props;
  const { setEnsembleList, setStatus } = useCMGContext();
  const [composition, setComposition] = useState<Composition>([]);
  const [selectedVoices, setSelectedVoices] = useState<Voices>([]);

  // when a new ensemble is selected, load the ensemble and its voices
  useEffect(() => {
    // loading the voices when a generator is opened for modification is
    // causing the composition to be erased, evem if it exists and is valid.
    // some how we need to stop this from happening.
    // A first cut would be to check the voice dimension of the
    // composition to see if it matches the number of voices being loaded
    //
    if (formData.values.ensembleName == "") return;
    loadVoices(formData.values.ensembleName);
  }, [formData.values.ensembleName]);

  // if the composition on the form is different than the
  // one on the GUI, update the GUI
  useEffect(() => {
    const formComposition: Composition = formData.values.composition;
    if (composition.length != formComposition.length) {
      setComposition(formComposition);
      return;
    }
    for (let iTime = 0; iTime < formComposition.length; iTime++) {
      if (composition[iTime].length != formComposition[iTime].length) {
        setComposition(formComposition);
        return;
      }
      for (let iVoice = 0; iVoice < composition[iTime].length; iVoice++) {
        if (composition[iTime][iVoice] != formComposition[iTime][iVoice]) {
          setComposition(formComposition);
          return;
        }
      }
    }
  }, [formData.values.composition]);

  useEffect(() => {
    const newSelected: Voices = [];
    for (let i = 0; i < formData.values.voices.length; i++) {
      if (!formData.values.voices[i].muted)
        newSelected.push(formData.values.voices[i]);
    }
    setSelectedVoices(newSelected);
  }, [formData]);

  function reloadEnsembleList() {
    loadEnsembleList(setEnsembleList);
  }

  function reloadEnsembleVoices(ensemble: EnsembleType | null) {
    if (!ensemble) return;
    loadVoices(ensemble.name);
  }

  // load the voices from the ensemble and update the formData
  // This should retain the muted and volume properties if
  // they are already on the form for a voice
  const loadVoices = (ensembleName: string) => {
    try {
      loadEnsembleandVoices(ensembleName);
      async function loadEnsembleandVoices(name: string) {
        const voices: Voice[] = [];
        const ensembleResponse: DbResponseType = await fetchDBData(
          `/ensemble/${name}`,
          "GET"
        );
        if (ensembleResponse.type != "ensemble") return;
        // fetch each of the voice details
        const data: DbEnsembleType = ensembleResponse as DbEnsembleType;
        formData.values.ensemble = { ...data.value };

        // get the current voices from the form to match up with the 
        // new ones and carry over the muted and volume properties
        const formVoices: Voices = [...formData.values.voices];

        // load each voice from the dB
        const voiceList: string[] = data.value.voices.split(",");
        for (let i = 0; i < voiceList.length; i++) {
          const vName: string = voiceList[i];
          const voiceData: DbResponseType = await fetchDBData(
            `/voice/${vName}`,
            "GET"
          );

          if (voiceData.type != DBRESPONSETYPE.voice) return;

          const vData: dBVoiceType = voiceData as dBVoiceType;

          // get the preset for this voice
          const { soundFont } = await SFPool(vData.value.soundFontFile);
          const { preset } = presetNameToPreset(
            vData.value.presetName,
            soundFont.presets as Preset[]
          );

          // hold over the muted and voice properties if they were on the form already
          // a match is when the voice name matches that just read
          const voiceIndex: number = formVoices.findIndex((voice: Voice) => (
            voice.name == vData.value.name
          ))
          let muted: boolean = false;
          let volume: number = 0;
          let velocity: number = 0;
          if (voiceIndex >= 0) {
            muted = formVoices[voiceIndex].muted;
            volume = formVoices[voiceIndex].volume;
            velocity = formVoices[voiceIndex].velocity;
          }

          const nv: Voice = {
            name: vData.value.name,
            description: vData.value.description,
            timbre: vData.value.timbre as TIMBRETYPE,
            registerLo: vData.value.registerLo,
            registerHi: vData.value.registerHi,
            duration: vData.value.duration,
            soundFontFile: vData.value.soundFontFile,
            presetName: vData.value.presetName,
            preset,
            muted,
            volume,
            velocity,
          };
          voices.push(nv);
        }
        // load the voices onto the form and trigger a change event
        formData.values.voices = [...voices];
        // formData.values.muted = Array(voices.length).fill(false);
        const event = {
          target: {
            name: "voices",
            value: voices.length.toString(),
            type: "string",
          },
        };
        // only reset the composition of the number of voices loaded
        // do not agree with the dimension of the composition
        if (
          formData.values.composition.length > 0 &&
          voices.length != formData.values.composition[1].length
        )
          formData.values.composition = [];
        setComposition(formData.values.composition);
        handleChange(event as ChangeEvent<HTMLInputElement>);
      }
    } catch (e) {
      setStatus(
        `Error while loading ensemble ${ensembleName} voices: ${
          (e as Error).message
        }`
      );
    }
  };

  // create a new composition from the stochastic parameters on the form
  function createComposition() {
    const v: StochasticValues = formData.values;
    const e: string[] =
      v.Nt <= 0 || v.Tc <= 0 || v.lambda <= 0 || v.ensembleName == ""
        ? ["Composition Parameters have not been set properly."]
        : [];

    if (e.length != 0) {
      setMessages(e);
      return;
    }
    setMessages([]);
    // reset the random number seed before building the composition
    const rN = new RandomNumber(formData.values.compositionSeed);
    formData.values.compositionRN = rN;

    const composition: Composition = buildComposition({
      nColumns: formData.values.voices.length,
      nRows: formData.values.Nt,
      lambda: formData.values.lambda,
      rN: rN,
    });

    // update the composition on the GUI
    setComposition(composition);

    // sneak in an update to the stop time
    formData.stopTime = formData.startTime + formData.values.Tc;
    updateComposition(composition);
  }

  function updateComposition(composition: Composition) {
    // get the composition back to the updated form
    let compositionString: string = "";
    for (const row of composition) {
      for (const value of row) {
        compositionString += value + ",";
      }
    }
    const event = {
      target: { name: "composition", value: compositionString, type: "string" },
    };
    handleChange(event as ChangeEvent<HTMLInputElement>);
  }

  // swap a composition column with the one to teh left or right of it
  function handleVoiceLeftRight(
    e: MouseEvent<HTMLButtonElement>,
    direction: string,
    i: number
  ): void {
    e.stopPropagation();
    e.preventDefault();
    const composition: Composition = formData.values.composition;
    const newComposition: Composition = [];
    if (direction == "left") {
      // move the selected voice column left
      // move the selected voice column right
      composition.forEach((row, ir) => {
        newComposition.push(Array<number>(row.length));
        row.forEach((_value, iv) => {
          if (iv == i) {
            newComposition[ir][i] = composition[ir][i - 1];
            newComposition[ir][i - 1] = composition[ir][i];
          } else if (iv != i && iv != i - 1)
            newComposition[ir][iv] = composition[ir][iv];
        });
      });
    } else {
      // move the selected voice column right
      composition.forEach((row, ir) => {
        newComposition.push(Array<number>(row.length));
        row.forEach((_value, iv) => {
          if (iv == i) {
            newComposition[ir][i + 1] = composition[ir][i];
            newComposition[ir][i] = composition[ir][i + 1];
          } else if (iv != i && iv != i + 1)
            newComposition[ir][iv] = composition[ir][iv];
        });
      });
    }
    updateComposition(newComposition);
  }

  // swap the time row with the one above or below it in the composition
  function handleTimeUpDown(
    e: MouseEvent<HTMLButtonElement>,
    direction: string,
    i: number
  ): void {
    e.stopPropagation();
    e.preventDefault();
    const composition: Composition = formData.values.composition;
    const n: Composition = [];

    if (direction == "up") {
      for (let iv = 0; iv < composition.length; iv++) {
        if (iv == i - 1) {
          n.push(composition[i]);
          n.push(composition[iv]);
        } else if (iv != i) n.push(composition[iv]);
      }
    } else {
      for (let iv = 0; iv < composition.length; iv++) {
        if (iv == i) {
          n.push(composition[i + 1]);
          n.push(composition[iv]);
        } else if (iv != i + 1) n.push(composition[iv]);
      }
    }
    updateComposition(n);
  }

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Reload and Build</th>
            <th colSpan={9} align="left">
              {formData.values.voices.length != 0 ? "Voices" : ""}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <button
                style={{ margin: "1px" }}
                className="submitbutton"
                type="button"
                onClick={() => reloadEnsembleList()}
              >
                Ensembles
              </button>
              <br />
              <button
                style={{ margin: "1px" }}
                className="submitbutton"
                type="button"
                onClick={() => {
                  reloadEnsembleVoices(formData.values.ensemble);
                }}
              >
                Voices
              </button>
              <br />
              <button
                style={{ margin: "1px" }}
                className="submitbutton"
                type="button"
                onClick={() => createComposition()}
              >
                Build Composition
              </button>
            </td>
            {!!(formData.values.voices.length > 0) && (
              <td>
                <table>
                  <thead>
                    <tr>
                      <th>Mute</th>
                      <th>Volume</th>
                      <th>Velocity</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Timbre</th>
                      <th>Register (lo, hi) (midi)</th>
                      <th>Duration (sec)</th>
                      <th>SoundFont</th>
                      <th>Preset</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.values.voices.map((voice: Voice, i) => (
                      <tr key={`voice-${voice.name}`}>
                        <td style={{textAlign: "center"}}>
                          <input
                            type="checkbox"
                            name={`muted-${i}`}
                            checked={formData.values.voices[i].muted}
                            onChange={(e) => handleChange(e)}
                          />
                        </td>
                        <td style={{textAlign: "center"}}>
                          <input
                            type="range"
                            name={`volume-${i}`}
                            value={formData.values.voices[i].volume}
                            min={-10}
                            max={10}
                            step={1}
                            onChange={(e) => handleChange(e)}
                          />
                          {formData.values.voices[i].volume}
                        </td>
                        <td style={{textAlign: "center"}}>
                          <input
                            type="range"
                            name={`velocity-${i}`}
                            value={formData.values.voices[i].velocity}
                            min={0}
                            max={127}
                            step={1}
                            onChange={(e) => handleChange(e)}
                          />
                          {formData.values.voices[i].velocity}
                        </td>
                        <td>{voice.name}</td>
                        <td>{voice.description}</td>
                        <td>{voice.timbre}</td>
                        <td>{`(${voice.registerLo},${voice.registerHi})`}</td>
                        <td>{voice.duration}</td>
                        <td>{voice.soundFontFile}</td>
                        <td>{voice.presetName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
            )}
          </tr>
        </tbody>
      </table>
      {!!(composition.length > 0) && (
        <table border={1} style={{ width: "80%" }}>
          <thead>
            <tr>
              <th colSpan={selectedVoices.length + 3}>Composition</th>
            </tr>
            <tr>
              <th></th>
              <th>Time (sec)</th>
              <>
                {selectedVoices.map((v: Voice, i) => (
                  <th key={`cheader1-${i}`}>{v.name}</th>
                ))}
              </>
              <th>Sum</th>
            </tr>
            <tr>
              <th>Move</th>
              <th></th>
              <>
                {selectedVoices.map((_v: Voice, i) => (
                  <th key={`cheader2-${i}`}>
                    <button
                      className="submitbutton"
                      hidden={i == 0}
                      key={"time-left:" + i}
                      onClick={(e) => handleVoiceLeftRight(e, "left", i)}
                    >
                      <AiFillCaretLeft />
                    </button>
                    <button
                      hidden={i == selectedVoices.length - 1}
                      className="submitbutton"
                      key={"time-right:" + i}
                      onClick={(e) => handleVoiceLeftRight(e, "right", i)}
                    >
                      <AiFillCaretRight />
                    </button>
                  </th>
                ))}
              </>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {composition.map((row, i) => (
              <tr key={`crow-${i}`}>
                <td>
                  <button
                    className="submitbutton"
                    hidden={i == 0}
                    id={"time-up:" + i}
                    key={"time-up:" + i}
                    onClick={(e) => handleTimeUpDown(e, "up", i)}
                  >
                    <AiFillCaretUp />
                  </button>
                  <button
                    hidden={i == composition.length - 1}
                    className="submitbutton"
                    id={"time-down:" + i}
                    key={"time-down:" + i}
                    onClick={(e) => handleTimeUpDown(e, "down", i)}
                  >
                    <AiFillCaretDown />
                  </button>
                </td>
                <td style={{ textAlign: "center" }}>
                  {precision(formData.getDeltaT() * i, 2)}
                </td>
                {row
                  .map((value, i) =>
                    !formData.values.voices[i].muted ? (
                      <td
                        key={`voice-${value}-${i}`}
                        style={{ textAlign: "center" }}
                      >
                        {value}
                      </td>
                    ) : null
                  )
                  .filter((v) => v)}
                <td style={{ textAlign: "center" }}>
                  {row
                    .reduce(function (x, y, i) {
                      if (!formData.values.voices[i].muted) return x + y;
                      else return x;
                    }, 0)
                    .toFixed(0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
