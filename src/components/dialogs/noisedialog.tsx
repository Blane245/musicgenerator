import { ChangeEvent } from "react";
import Noise from "../../classes/noise";
import { MODULATOR, NOISETYPE } from "../../types/types";

// provides the form fields and validators for the sfperiodic generator
export interface SFPGDialogProps {
    formData: Noise,
    handleChange: (event: ChangeEvent<HTMLElement>) => void,
}
export default function NoiseDialog(props: SFPGDialogProps): JSX.Element {
    const { formData, handleChange } = props;

    const INPUTSIZE: number = 6;

    // we are in the middle of the generator dialog form
    return (
        <>
            <label htmlFor="noiseType">Type:</label>
            <select name="noiseType"
                onChange={handleChange}
                value={formData.noiseType}
            >
                {Object.keys(NOISETYPE).map((t) => {
                    if (!parseInt(t) && t != '0')
                        return (
                            <option key={'noiseType-' + t} value={t}>{t}</option>
                        )
                })}
            </select>
            <br />
            <label>
                Sample Rate:
                <input
                    size={INPUTSIZE}
                    name="sampleRate"
                    value={formData.sampleRate}
                    onChange={handleChange}
                    type='number' min={15000} max={50000} step={1000}
                /></label>
            <span> (Hz)</span>
            <br />
            <label>
                Sample Level:
                <input size={INPUTSIZE}
                    name="sampleLevel"
                    value={formData.sampleLevel}
                    onChange={handleChange}
                    type='number' min={0} max={10000} step={10}
                /></label>
            {formData.noiseType == NOISETYPE.gaussian ?
                <>
                    <br />
                    <label>
                        Frequency:
                        <input
                            size={INPUTSIZE}
                            name="mean"
                            value={formData.mean}
                            onChange={handleChange}
                            type='number' min={20} max={20000} step={1}
                        />
                        <span> (Hz)</span>
                    </label>
                    <label>
                        Standard Deviation:
                        <input size={INPUTSIZE}
                            name="std"
                            value={formData.std}
                            onChange={handleChange}
                            type='number' min={1} max={1000} step={1}
                        />
                        <span> (Hz)</span>
                    </label>
                </>
                : null}
            <hr />
            <label htmlFor="VMType">VMType:</label>
            <select name="VMType"
                onChange={handleChange}
                value={formData.VMType}
            >
                {Object.keys(MODULATOR).map((t) => {
                    if (!parseInt(t) && t != '0')
                        return (
                            <option key={'VMType-' + t} value={t}>{t}</option>
                        )
                })}
            </select>
            <br />
            <label htmlFor="VMCenter">VMCenter:</label>
            <input name="VMCenter"
                type='number' min={0} max={100} step={1}
                onChange={handleChange}
                value={formData.VMCenter}
            />
            <span> (%)</span>
            <br />
            <label htmlFor="VMAmplitude">VMAmplitude:</label>
            <input name="VMAmplitude"
                type='number' min={0} max={100} step={1}
                onChange={handleChange}
                value={formData.VMAmplitude}
            />
            <span> (%)</span>
            <br />
            <label htmlFor="VMFrequency">VMFrequency:</label>
            <input name="VMFrequency"
                type='number' min={0}
                onChange={handleChange}
                value={formData.VMFrequency}
            />
            <span> (milliHz)</span>
            <br />
            <label htmlFor="VMPhase">VMPhase:</label>
            <input name="VMPhase"
                type='number' min={-360} max={360} step={1}
                onChange={handleChange}
                value={formData.VMPhase}
            />
            <span> (degrees)</span>
            <hr />
            <label htmlFor="PMType">PMType:</label>
            <select name="PMType"
                onChange={handleChange}
                value={formData.PMType}
            >
                {Object.keys(MODULATOR).map((t) => {
                    if (!parseInt(t) && t != '0')
                        return (
                            <option key={'PMType-' + t} value={t}>{t}</option>
                        )
                })}
            </select>
            <br />
            <label htmlFor="PMCenter">PMCenter:</label>
            <input name="PMCenter"
                type='number'
                onChange={handleChange}
                value={formData.PMCenter}
                min={-1.0}
                max={1.0}
                step={0.1}
            />
            <span> (-1 to +1)</span>
            <br />
            <label htmlFor="PMAmplitude">PMAmplitude:</label>
            <input name="PMAmplitude"
                type='number'
                onChange={handleChange}
                value={formData.PMAmplitude}
                min={0}
                max={1.0}
                step={0.1}
            />
            <span> (0 to 1)</span>
            <br />
            <label htmlFor="PMFrequency">PMFrequency:</label>
            <input name="PMFrequency"
                type='number' min={0}
                onChange={handleChange}
                value={formData.PMFrequency}
            />
            <span> (milliHz)</span>
            <br />
            <label htmlFor="PMPhase">PMPhase:</label>
            <input name="PMPhase"
                type='number' min={-360} max={360} step={1}
                onChange={handleChange}
                value={formData.PMPhase}
            />
            <span> (degrees)</span>
        </>
    )
}

export function validateNoiseValues(values: Noise): string[] {
    const result: string[] = [];

    // the input component definitions make this redundant
    if (values.VMCenter < 0 || values.VMCenter > 100)
        result.push('VMCenter must be between 0 and 100');
    if (values.VMAmplitude < 0)
        result.push('VMAmplitude must be greater than zero');
    if (values.VMFrequency < 0)
        result.push('VMFrequency must be greater than zero');
    if (values.VMPhase < -360 || values.VMPhase > 360)
        result.push('VMPhase must be greater than -360 and less than 360');
    if (values.PMCenter < -1.0 || values.PMCenter > 1.0)
        result.push('PMCenter must be between -1 and 1');
    if (values.PMAmplitude < 0)
        result.push('PMAmplitude must be greater than zero');
    if (values.PMFrequency < 0)
        result.push('PMFrequency must be greater than zero');
    if (values.PMPhase < -360 || values.PMPhase > 360)
        result.push('PMPhase must be greater than -360 and less than 360');
    return result;
}