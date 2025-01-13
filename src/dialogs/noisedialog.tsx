import { ChangeEvent } from "react";
import Noise from "../classes/noise";
import { MODULATOR, NOISETYPE } from "../types";

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
      <label htmlFor="VMType"> VMType:</label>
      <select name="VMType" onChange={handleChange} value={formData.VMType}>
        {Object.keys(MODULATOR).map((t) => {
          if (!parseInt(t) && t != "0")
            return (
              <option key={`NoiseVMType-${t}`} value={t}>
                {t}
              </option>
            );
        })}
      </select>
      <label htmlFor="VMCenter"> VMCenter:</label>
      <input
        name="VMCenter"
        type="number"
        min={0}
        max={10}
        step={1}
        onChange={handleChange}
        value={formData.VMCenter}
      />
      <span> (0-10)</span>
      <label htmlFor="VMAmplitude"> VMAmplitude:</label>
      <input
        name="VMAmplitude"
        type="number"
        min={0}
        max={10}
        step={1}
        onChange={handleChange}
        value={formData.VMAmplitude}
      />
      <span> (0-10)</span>
      <label htmlFor="VMFrequency"> VMFrequency:</label>
      <input
        name="VMFrequency"
        size={INPUTSIZE}
        type="number"
        min={0}
        max={20000}
        onChange={handleChange}
        value={formData.VMFrequency}
      />
      <span> (mHz) </span>
      <label htmlFor="VMPhase"> VMPhase:</label>
      <input
        name="VMPhase"
        type="number"
        min={-360}
        max={360}
        step={1}
        onChange={handleChange}
        value={formData.VMPhase}
      />
      <span> (degrees) </span>
      <hr />
      <label htmlFor="PMType"> PMType:</label>
      <select name="PMType" onChange={handleChange} value={formData.PMType}>
        {Object.keys(MODULATOR).map((t) => {
          if (!parseInt(t) && t != "0")
            return (
              <option key={`NoisePMType-${t}`} value={t}>
                {t}
              </option>
            );
        })}
      </select>
      <label htmlFor="PMCenter"> PMCenter:</label>
      <input
        name="PMCenter"
        type="number"
        size={INPUTSIZE}
        onChange={handleChange}
        value={formData.PMCenter}
        min={-1.0}
        max={1.0}
        step={0.1}
      />
      <span> (-1 to +1) </span>
      <label htmlFor="PMAmplitude"> PMAmplitude:</label>
      <input
        name="PMAmplitude"
        type="number"
        size={INPUTSIZE}
        onChange={handleChange}
        value={formData.PMAmplitude}
        min={0}
        max={1.0}
        step={0.1}
      />
      <span> (0 to 1) </span>
      <label htmlFor="PMFrequency"> PMFrequency:</label>
      <input
        name="PMFrequency"
        type="number"
        min={0}
        max={20000}
        size={INPUTSIZE}
        onChange={handleChange}
        value={formData.PMFrequency}
      />
      <span> (mHz) </span>
      <label htmlFor="PMPhase">PMPhase:</label>
      <input
        name="PMPhase"
        type="number"
        min={-360}
        max={360}
        step={1}
        onChange={handleChange}
        size={INPUTSIZE}
        value={formData.PMPhase}
      />
      <span> (degrees)</span>
    </>
  );
}

// all values are validated by range checks
export function validateNoiseValues(_: Noise): string[] {
  const result: string[] = [];
  return result;
}
