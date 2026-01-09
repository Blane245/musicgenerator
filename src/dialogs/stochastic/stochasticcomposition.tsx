import Stochastic from "classes/generators/stochastic";
import RandomNumber from "classes/randomnumber";
import { useCMGContext } from "cmgcontext";
import buildComposition from "helpers/buildcomposition";
import { ChangeEvent, MouseEvent, useEffect } from "react";
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
} from "types";
import { fetchDBData } from "utils/fetchdata";
import loadEnsembleList from "utils/loadEnsembleList";

export interface StochasticCompostionProps {
  formData: Stochastic;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  setMessages: Function;
}

export default function StochasticComposition(
  props: StochasticCompostionProps
): JSX.Element {
  const { formData, handleChange, setMessages } = props;
  const { setEnsembleList, setStatus } = useCMGContext();

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

  function reloadEnsembleList() {
    loadEnsembleList(setEnsembleList);
  }

  function reloadEnsembleVoices(ensemble: EnsembleType | null) {
    if (!ensemble) return;
    loadVoices(ensemble.name);
  }

  function loadVoices(ensembleName: string) {
    try {
      loadEnsembleandVoices(ensembleName);
      async function loadEnsembleandVoices(name: string) {
        const voices: Voice[] = [];
        const ensembleResponse: DbResponseType = await fetchDBData(
          `/ensemble/${name}`,
          "GET"
        );
        if (ensembleResponse.type == "ensemble") {
          // fetch each of the voice details
          const data: DbEnsembleType = ensembleResponse as DbEnsembleType;
          formData.values.ensemble = { ...data.value };
          const voiceList: string[] = data.value.voices.split(",");
          for (let i = 0; i < voiceList.length; i++) {
            const vName: string = voiceList[i];
            const voiceData: DbResponseType = await fetchDBData(
              `/voice/${vName}`,
              "GET"
            );

            if (voiceData.type == DBRESPONSETYPE.voice) {
              const vData: dBVoiceType = voiceData as dBVoiceType;
              // get the preset for this voice
              const {soundFont} = await SFPool(vData.value.soundFontFile);
              const {preset} = presetNameToPreset(vData.value.presetName, soundFont.presets as Preset[]);
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
              };
              voices.push(nv);
            }
          }
          // load the voices onto the form and trigger a change event
          formData.values.voices = [...voices];
          let event: {} = {
            target: {
              name: "voices",
              value: voices.length.toString(),
              type: "string",
            },
          };
          // only reset the composition of the number of voices loaded
          // do not agree with the dimenion of the composition
          if (formData.values.composition.length > 0 && voices.length != formData.values.composition[1].length)
            formData.values.composition = [];
          handleChange(event as ChangeEvent<HTMLInputElement>);
        }
      }
    } catch (e) {
      setStatus(`Error while loading ensemble ${ensembleName} voices`);
    }
  }

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
    const rN = new RandomNumber(formData.values.seed);
    const composition: Composition = buildComposition({
      nColumns: formData.getNe(),
      nRows: formData.values.Nt,
      lambda: formData.values.lambda,
      rN: rN,
    });

    // sneak in an update to the stop time
    formData.stopTime = formData.startTime + formData.values.Tc;
    updateComposition(composition);
  }

  function updateComposition(composition: Composition) {
    // get the composition back to the updated form
    let compositionString: string = "";
    for (let row of composition) {
      for (let value of row) {
        compositionString += value + ",";
      }
    }
    let event: {} = {
      target: { name: "composition", value: compositionString, type: "string" },
    };
    handleChange(event as ChangeEvent<HTMLInputElement>);
  }

  // swap a composition column wiht the one to teh left or right of it
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
      <thead>
        <tr>
          <th>Reload</th>
          <th colSpan={4} align="left">
            {formData.values.voices.length != 0 ? "Voices" : ""}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <button
              className="submitbutton"
              type="button"
              onClick={() => reloadEnsembleList()}
            >
              Ensembles
            </button>
            <br />
            <button
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
              className="submitbutton"
              type="button"
              onClick={() => createComposition()}
            >
              Build Composition
            </button>
          </td>
          {!!(formData.values.voices.length > 0) && (
            <td colSpan={4}>
              <table border={1}>
                <thead>
                  <tr>
                    <td>Mute</td>
                    <td>Name</td>
                    <td>Description</td>
                    <td>Timbre</td>
                    <td>Register (lo, hi) (midi)</td>
                    <td>Duration (sec)</td>
                    <td>SoundFont</td>
                    <td>Preset</td>
                  </tr>
                </thead>
                <tbody>
                  {formData.values.voices.map((voice: Voice, i) => (
                    <tr key={`voice-${voice.name}`}>
                      <td>
                        <input
                          type="checkbox"
                          name={`muted-${i}`}
                          checked={formData.values.muted[i]}
                          onChange={(e) => handleChange(e)}
                        />
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
        {!!(formData.values.composition.length > 0) && (
          <tr>
            <td colSpan={5}>
              <table border={1}>
                <thead>
                  <tr>
                    <th colSpan={formData.values.voices.length + 3}>Composition</th>
                  </tr>
                  <tr>
                    <th>Move</th>
                    <th>Time (sec)</th>
                    <>
                      {formData.values.voices.map((v: Voice, i) => (
                        <th key={`cheader1-${i}`}>{v.name}</th>
                      ))}
                    </>
                    <th>Sum</th>
                  </tr>
                  <tr>
                    <th></th>
                    <th></th>
                    <>
                      {formData.values.voices.map((_v: Voice, i) => (
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
                            hidden={i == formData.values.voices.length - 1}
                            className="submitbutton"
                            key={"time-right:" + i}
                            onClick={(e) => handleVoiceLeftRight(e, "right", i)}
                          >
                            <AiFillCaretRight />
                          </button>
                        </th>
                      ))}
                    </>
                    <th>Sum</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.values.composition.map((row, i) => (
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
                          hidden={i == formData.values.composition.length - 1}
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
                      {row.map((value, i) => (
                        <td
                          key={`voice-${value}-${i}`}
                          style={{ textAlign: "center" }}
                        >
                          {value}
                        </td>
                      ))}
                      <td style={{ textAlign: "center" }}>
                        {row
                          .reduce(function (x, y) {
                            return x + y;
                          }, 0)
                          .toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>
        )}
      </tbody>
    </>
  );
}
