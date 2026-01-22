import Stochastic from "classes/generators/stochastic";
import { useCMGContext } from "cmgcontext";
import { ChangeEvent } from "react";
import {
  INTENSITYOPTION,
  INTENSITYTRANSITIONOPTION,
  PANALGORITHM,
  PANOPTION,
} from "types";
import { generateRandomString } from "utils/randomstring";

export interface StochasticValuesProps {
  formData: Stochastic;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}

export default function StochasticValues(
  props: StochasticValuesProps
): JSX.Element {
  const { formData, handleChange } = props;
  const { ensembleList } = useCMGContext();

  function generateSeed(property: string): void {
    const newSeed: string = generateRandomString(15);
    const event = {
      target: { name: property, value: newSeed, type: "string" },
    };
    if (property == 'compositionSeed') formData.values.composition = [];
    handleChange(event as ChangeEvent<HTMLInputElement>);
  }

  // clear the composition when a property changes that affects its size and/or content
  function handlePropertyChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    formData.values.composition = [];
    handleChange(e);
  }


  return (
    <>
    <table border={1}>
      <thead>
        <tr>
          <th colSpan={5}>Composition Parameters</th>
          <th colSpan={3}>Dynamics Parameters</th>
        </tr>
        <tr>
          <th>Ensemble</th>
          <th>Length (sec)</th>
          <th>Time Cells</th>
          <th>Events/Cell</th>
          <th>Composition Seed</th>
          <th>Sounds/sec</th>
          <th>Dynamics Seed</th>
          <th>Pan Controls</th>
          <th>Intensity Controls</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <select
              onChange={handleChange}
              name="ensembleName"
              value={formData.values.ensembleName}
            >
              <option value="">None</option>
              {ensembleList.map((e) => (
                <option key={`ensemble-${e.name}`} value={e.name}>
                  {e.name}
                </option>
              ))}
            </select>
          </td>
          <td>
            <input
              name="Tc"
              type="number"
              value={formData.values.Tc}
              onChange={handlePropertyChange}
            />
          </td>
          <td>
            <input
              name="Nt"
              type="number"
              value={formData.values.Nt}
              onChange={handlePropertyChange}
            />
          </td>
          <td>
            <input
              name="lambda"
              type="number"
              value={formData.values.lambda}
              onChange={handlePropertyChange}
            />
          </td>
          <td>
            <input
              name="compositionSeed"
              type="string"
              value={formData.values.compositionSeed}
              onChange={handlePropertyChange}
            />
            <button onClick={()=>generateSeed('compositionSeed')} type="button">
              New Seed
            </button>
          </td>
          <td>
            <input
              name="delta"
              type="number"
              value={formData.values.delta}
              onChange={handleChange}
            />
          </td>
          <td>
            <input
              name="dynamicsSeed"
              type="string"
              value={formData.values.dynamicsSeed}
              onChange={handleChange}
            />
            <button onClick={()=>generateSeed('dynamicsSeed')} type="button">
              New Seed
            </button>
          </td>
          <td>
            <label>
              Scope&nbsp;
              <select
                name="panOption"
                value={formData.values.panOption}
                onChange={handleChange}
              >
                <option value={PANOPTION.none}>None</option>
                <option value={PANOPTION.composition}>Composition</option>
                <option value={PANOPTION.voice}>Voice</option>
                <option value={PANOPTION.cloud}>Cloud</option>
              </select>
            </label>
            <br />
            <label>
              &nbsp;Method&nbsp;
              <select
                name="panAlgorithm"
                value={formData.values.panAlgorithm}
                onChange={handleChange}
              >
                <option value={PANALGORITHM.none}>None</option>
                <option value={PANALGORITHM.glide}>Glide</option>
                <option value={PANALGORITHM.walk}>Walk</option>
              </select>
            </label>
            <br />
            <label>
              &nbsp;Cycle Time (sec)&nbsp;
              <input
                name="panParameters.cycleTime"
                min={0}
                value={
                  formData.values.panParameters.cycleTime
                } /* both pan and intensity have the same parameter */
                onChange={handleChange}
              />
            </label>
          </td>
          <td>
            <label>
              Scope&nbsp;
              <select
                name="intensityOption"
                value={formData.values.intensityOption}
                onChange={handleChange}
              >
                <option value={INTENSITYOPTION.none}>None</option>
                <option value={INTENSITYOPTION.composition}>Composition</option>
                <option value={INTENSITYOPTION.cloud}>Cloud</option>
                <option value={INTENSITYOPTION.voice}>Voice</option>
              </select>
            </label>
            <br />
            <label>
              &nbsp;Method&nbsp;
              <select
                name="intensityTransitionOption"
                value={formData.values.intensityTransitionOption}
                onChange={handleChange}
              >
                <option value={INTENSITYTRANSITIONOPTION.none}>None</option>
                <option value={INTENSITYTRANSITIONOPTION.persistent}>
                  Persistent
                </option>
                <option value={INTENSITYTRANSITIONOPTION.random}>Random</option>
              </select>
            </label>
            <br />
            <label>
              &nbsp;Cycle Time (sec)&nbsp;
              <input
                name="intensityParameters.cycleTime"
                min={0}
                value={
                  formData.values.intensityParameters.cycleTime
                } /* both pan and intensity have the same parameter */
                onChange={handleChange}
              />
            </label>
          </td>
        </tr>
      </tbody>
    </table>
      </>
  );
}
