import { ChangeEvent } from "react";
import { EuclideanAttributes, EuclideanParameterTypes } from "../types";
import OscillatorAttributeBox from "./oscillatorattributebox";

//TODO hold off until mixed dialog advances
export interface EuclideanAttributeBoxProps {
  name: string;
  parameter: EuclideanParameterTypes;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}
export default function EuclideanAttributeBox(props: EuclideanAttributeBoxProps) {
  const { name, parameter, handleChange } = props;
  return (
    <div className='euclidean'>
        <div className='measurelength'>
        <label>Measure Length:&nbsp;
        <input
          name={name.concat(".measureLength")}
          type="number"
          onChange={handleChange}
          value={parameter.measureLength}
        />
       </label>
        </div>
        <div className='beatcount'>
        <label>Measure Length:&nbsp;
        <input
          name={name.concat(".beatCount")}
          type="number"
          onChange={handleChange}
          value={parameters.beatCount}
        />
       </label>
        </div>
        <div className='notecount'>
        <label>Measure Length:&nbsp;
        <input
          name={name.concat(".noteCount")}
          type="number"
          onChange={handleChange}
          value={parameters.noteCount}
        />
       </label>
        </div>
        <div className='gentype'>
            <label>Generator Type:&nbsp;
                <select
                name={name.concat(".parameterName")}
                onChange={handleChange}
                value={parameters.parameterName}
                >
                    {['Oscillator', 'Markovian', 'Wiener'].map((pn) => {
                    return (
                     <option key={name.concat("-").concat(pn)}>{pn}</option>   
                    )}
                    )}
                </select>
            </label>
        </div>
        <div className='genparameters'>
            <EuclideanGenerator type={parameters.parameterName}/>
        </div>
    </div>
  );

  function EuclideanGenerator (props: {type: string}) {
    const {type} = props;
    switch (type) {
        case 'Oscillator': {
            return (<OscillatorAttributeBox
            name = {name.concat('.noteP')}
            type={}
            center ={}
            frequency={}
            amplitude={}
            phase={}
            handleChange={handleChange}
                />
            )
        }
        default:
            break;
    }
    return(<></>);
  }
}
