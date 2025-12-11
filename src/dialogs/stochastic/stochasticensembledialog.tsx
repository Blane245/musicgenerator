import Stochastic from "classes/generators/stochastic";
import { ChangeEvent } from "react";
import { TIMBRE } from "types";

export interface StochasticEnsemnleDialogProps {
    formData: Stochastic;
    handleChange: (
      event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => void; 
}

export default function StochasticEnsemnleDialog(props: StochasticEnsemnleDialogProps): JSX.Element {
  const { formData, handleChange } = props;

  return (
    <>
    {!!(formData.values.timbres.findIndex((t:TIMBRE) => TIMBRE.Glissando) >= 0) &&
    <div className="stochastic-ensemble">
        <div className="name">
            {TIMBRE.Glissando}
        </div>
        <div className="frequency">
            <label>
                Frequency 
                <input 
                name="Glissando.density"
                type='number'
                value={formData.values.composition.cell.}
            </label>
        </div>
    </div>
    }
    </>
  )
}