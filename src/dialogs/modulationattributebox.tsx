import { ChangeEvent } from "react";
import { ModulationAttributeData, MODULATOR } from "../types";

  type ModulationAttributeBoxProps = {
    title: string;
    name: string;
    type: string;
    frequency: ModulationAttributeData;
    center: ModulationAttributeData | null;
    amplitude: ModulationAttributeData;
    phase: ModulationAttributeData;
    handleChange: (
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
      ) => void;
  };

  // build and manage the ui for modulator attributes
  export default function ModulationAttributeBox(props: ModulationAttributeBoxProps): JSX.Element {
    const { title, name, type, center, frequency, amplitude, phase, handleChange } = props;
    return (
      <>
        <div ><h3>{title}</h3></div>
        <div style={{marginTop:'1em'}} >
          <select
            name={name.concat("Type")}
            onChange={handleChange}
            value={type}
          >
            {Object.keys(MODULATOR).map((t) => {
              if (!parseInt(t) && t != "0")
                return (
                  <option key={name.concat("-").concat(t.toString())}>
                    {t}
                  </option>
                );
            })}
          </select>
        </div>
        {center ? (
          <div style={{marginTop:'1em'}}>
            <input
              name={name.concat("Center")}
              type="number"
              min={center.lo}
              max={center.hi}
              step={center.step}
              onChange={handleChange}
              value={center.value}
            />
            <span style={{fontSize:'small'}}>&nbsp;{center.suffix}</span>
          </div>
        ) : <div></div>}
        <div style={{marginTop:'1em'}}>
          <input
            name={name.concat("Frequency")}
            type="number"
            min={frequency.lo}
            max={frequency.hi}
            step={frequency.step}
            onChange={handleChange}
            value={frequency.value}
          />
          <span style={{fontSize:'small'}} >&nbsp;{frequency.suffix}</span>
        </div>
        <div style={{marginTop:'1em'}}>
          <input
            name={name.concat("Amplitude")}
            type="number"
            min={amplitude.lo}
            max={amplitude.hi}
            step={amplitude.step}
            onChange={handleChange}
            value={amplitude.value}
          />
          <span style={{fontSize:'small'}}>&nbsp;{amplitude.suffix}</span>
        </div>
        <div style={{marginTop:'1em'}}>
          <input
            name={name.concat("Phase")}
            type="number"
            min={phase.lo}
            max={phase.hi}
            step={phase.step}
            onChange={handleChange}
            value={phase.value}
          />
          <span style={{fontSize:'small'}}>&nbsp;{phase.suffix}</span>
        </div>
      </>
    );
  }

