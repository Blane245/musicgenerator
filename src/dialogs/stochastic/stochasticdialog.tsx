import Stochastic from "classes/generators/stochastic";
import { ChangeEvent } from "react";
import { TIMBRE } from "types";

export interface StochasticDialogProps {
  formData: Stochastic;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}

export default function StochasticDialog(
  props: StochasticDialogProps
): JSX.Element {
  const { formData, handleChange } = props;

  return (
    <>
      <div className="stochastic-preamble">
        <div className="ensemble">
          <label style={{ display: "inline-grid", textAlign: "center" }}>
            Ensemble Timbres
            <select
              id={"timbrelist"}
              name="timbres"
              multiple={true}
              size={5}
              value={formData?.values.timbres}
              onChange={(e) => handleChange(e)}
            >
              {Object.values(TIMBRE).map((t: TIMBRE) => (
                <option key={`timbre-${t}`} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="lambda">
          <label>
            Event Density: (events/unit)&nbsp;
            <input
              name="lambda"
              type="number"
              value={formData.values.lambda}
              onChange={handleChange}
            />
          </label>
        </div>
        <div className="length">
          <label>
            Composition Length: (measures)&nbsp;
            <input
              name="length"
              type="number"
              value={formData.values.length}
              onChange={handleChange}
            />
          </label>
        </div>
        <div className="speed">
          <label>
            Measure Speed: (measure/minute)&nbsp;
            <input
              name="B"
              type="number"
              value={formData.values.B}
              onChange={handleChange}
            />
          </label>
        </div>
        <div className="count">
          <label>
            Cell Size: (measures)&nbsp;
            <input
              name="Nm"
              type="number"
              value={formData.values.Nm}
              onChange={handleChange}
            />
          </label>
        </div>
        <div className="delta">
          <label>
            Sound Density: (events/second)&nbsp;
            <input
              name="delta"
              type="number"
              value={formData.values.delta}
              onChange={handleChange}
            />
          </label>
        </div>
      </div>
      {/* TODO add submit 
    along with a build button
    also composition version maintenance
     */}
    </>
  );
}
