import { ChangeEvent } from "react";
import Noise from "../classes/noise";
import { NOISETYPE } from "../types";
import ModulationAttributeBox from "./modulationattributebox";

// provides the form fields and validators for the noise generator
export interface NoiseProps {
  formData: Noise;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}
export default function NoiseDialog(props: NoiseProps): JSX.Element {
  const { formData, handleChange } = props;

  const INPUTSIZE: number = 6;

  // we are in the middle of the generator dialog form
  return (
    <>
      <label htmlFor="noiseType">Type:</label>
      <select
        name="noiseType"
        onChange={handleChange}
        value={formData.noiseType}
      >
        {Object.keys(NOISETYPE).map((t) => {
          if (!parseInt(t) && t != "0")
            return (
              <option key={"noiseType-" + t} value={t}>
                {t}
              </option>
            );
        })}
      </select>
      <label>
        {" "}
        Sample Rate:
        <input
          name="sampleRate"
          value={formData.sampleRate}
          onChange={handleChange}
          type="number"
          min={15000}
          max={50000}
          step={100}
        />
        <span> (Hz)</span>
      </label>
      <label>
        {" "}
        Random Seed:&nbsp;
        <input
          name="seed"
          value={formData.seed}
          onChange={handleChange}
          type="text"
        />
      </label>
      {formData.noiseType == NOISETYPE.gaussian ? (
        <>
          <label>
            {" "}
            Frequency:&nbsp;
            <input
              size={INPUTSIZE}
              name="mean"
              value={formData.mean}
              onChange={handleChange}
              type="number"
              min={20}
              max={20000}
              step={0.01}
            />
            <span> (Hz)</span>
          </label>
          <label>
            {" "}
            Standard Deviation:&nbsp;
            <input
              size={INPUTSIZE}
              name="std"
              value={formData.std}
              onChange={handleChange}
              type="number"
              min={0}
              max={100}
              step={0.01}
            />
            <span> </span>
          </label>
        </>
      ) : null}
      <hr />
      <label>
        &nbsp;Interval:&nbsp;
        <input
          name="duration"
          value={formData.duration}
          onChange={handleChange}
          type="number"
          min={0.1}
          max={100}
          step={0.1}
        />
        <span> (s)</span>
      </label>
      <hr />
      <div className="modulation-table">
        <div>Name</div>
        <div>Type</div>
        <div>Center</div>
        <div>Frequency</div>
        <div>Amplitude</div>
        <div>Phase</div>
        <ModulationAttributeBox
          title={"Volume"}
          name={"volumeM"}
          type={formData.volumeM.type.toString()}
          center={{
            value: formData.volumeM.center,
            lo: -20,
            hi: 20,
            step: 1,
            suffix: "(-20 to +20 dB)",
          }}
          frequency={{
            value: formData.volumeM.frequency,
            lo: 0,
            hi: 1000000,
            step: 1,
            suffix: "(mHz)",
          }}
          amplitude={{
            value: formData.volumeM.amplitude,
            lo: 0,
            hi: 40,
            step: 1,
            suffix: "(0 - 20 dB)",
          }}
          phase={{
            value: formData.volumeM.phase,
            lo: -360,
            hi: 360,
            step: 1,
            suffix: "(degrees)",
          }}
          handleChange={handleChange}
        />
        <ModulationAttributeBox
          title={"Pan"}
          name={"panM"}
          type={formData.panM.type.toString()}
          center={{
            value: formData.panM.center,
            lo: -1,
            hi: +1,
            step: 0.1,
            suffix: "(-1 to +1)",
          }}
          frequency={{
            value: formData.panM.frequency,
            lo: 0,
            hi: 1000000,
            step: 1,
            suffix: "(mHz)",
          }}
          amplitude={{
            value: formData.panM.amplitude,
            lo: 0,
            hi: 2,
            step: 0.1,
            suffix: "(0 - 1)",
          }}
          phase={{
            value: formData.panM.phase,
            lo: -360,
            hi: 360,
            step: 1,
            suffix: "(degrees)",
          }}
          handleChange={handleChange}
        />
      </div>
    </>
  );
}

// all values are validated by range checks
export function validateNoiseValues(_: Noise): string[] {
  const result: string[] = [];
  return result;
}
