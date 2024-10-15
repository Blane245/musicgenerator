import { ChangeEvent } from "react";
import SFPG from "../../classes/sfpg";
import { MODULATOR } from "../../types/types";
import { bankPresettoName, toNote } from "../../utils/util";
import { useCMGContext } from "../../contexts/cmgcontext";
import { Preset, PresetZone } from "../../types/soundfonttypes";

// provides the form fields and validators for the sfperiodic generator
export interface SFPGDialogProps {
    formData: SFPG,
    handleChange: (event: ChangeEvent<HTMLElement>) => void,
}
const INPUTSIZE: number = 6;

export default function SFPGDialog(props: SFPGDialogProps): JSX.Element {
    const { formData, handleChange } = props;
    const { presets } = useCMGContext();

    // we are in the middle of the generator dialog form
    return (
        <>
            <label htmlFor="presetName">Preset:</label>
            <select name="presetName"
                onChange={handleChange}
                value={formData.presetName}
            >
                {presets
                    .sort((a, b) => {
                        if (a.header.bank < b.header.bank) return -1;
                        if (a.header.bank > b.header.bank) return 1;
                        return (a.header.preset - b.header.preset)
                    })
                    .map((p) => {
                        const pName = bankPresettoName(p)
                        return (
                            <option key={`preset-${pName}`}
                                value={pName}>
                                {pName}
                            </option>
                        )
                    })}
            </select>
            <label htmlFor="midi">Midi Number:</label>
            <input name="midi"
                size={INPUTSIZE}
                type='number'
                min={0} max={255} step={1}
                onChange={handleChange}
                value={formData.midi}
            />
            <span> {formData.midi > 0 ? toNote(formData.midi) : null}</span>
            <hr />
            <label htmlFor="FMType">FMType:</label>
            <select name="FMType"
                onChange={handleChange}
                value={formData.FMType}
            >
                {Object.keys(MODULATOR).map((t) => {
                    if (!parseInt(t) && t != '0')
                        return (
                            <option key={'FMType-' + t} value={t}>{t}</option>
                        )
                })}
            </select>
            <label htmlFor="FMAmplitude">FMAmplitude:</label>
            <input name="FMAmplitude"
                type='number'
                min={0} max={255} size={1}
                onChange={handleChange}
                value={formData.FMAmplitude}
            />
            <span> (midi)</span>
            <label htmlFor="FMFrequency">FMFrequency:</label>
            <input name="FMFrequency"
                type='number'
                min={0} max={1000000} step={1}
                onChange={handleChange}
                value={formData.FMFrequency}
            />
            <span> (milliHz)</span>
            <label htmlFor="FMPhase">FMPhase:</label>
            <input name="FMPhase"
                type='number'
                min={-360} max={360} step={1}
                onChange={handleChange}
                value={formData.FMPhase}
            />
            <span> (degrees)</span>
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
            <label htmlFor="VMCenter">VMCenter:</label>
            <input name="VMCenter"
                type='number'
                min={0} max={100} step={1}
                onChange={handleChange}
                value={formData.VMCenter}
            />
            <span> (%)</span>
            <label htmlFor="VMAmplitude">VMAmplitude:</label>
            <input name="VMAmplitude"
                type='number'
                min={0} max={100} step={1}
                onChange={handleChange}
                value={formData.VMAmplitude}
            />
            <span> (%)</span>
            <label htmlFor="VMFrequency">VMFrequency:</label>
            <input name="VMFrequency"
                type='number'
                min={0} max={1000000} step={1}
                onChange={handleChange}
                value={formData.VMFrequency}
            />
            <span> (milliHz)</span>
            <label htmlFor="VMPhase">VMPhase:</label>
            <input name="VMPhase"
                type='number'
                min={-360} max={360} step={1}
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
            <label htmlFor="PMCenter">PMCenter:</label>
            <input name="PMCenter"
                type='number'
                min={-1} max={1} step={.1}
                onChange={handleChange}
                value={formData.PMCenter}
            />
            <span> (-1 to +1)</span>
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
            <label htmlFor="PMFrequency">PMFrequency:</label>
            <input name="PMFrequency"
                type='number'
                min={0} max={1000000} step={1}
                onChange={handleChange}
                value={formData.PMFrequency}
            />
            <span> (milliHz)</span>
            <label htmlFor="PMPhase">PMPhase:</label>
            <input name="PMPhase"
                type='number'
                min={-360} max={360} step={1}
                onChange={handleChange}
                value={formData.PMPhase}
            />
            <span> (degrees)</span>
        </>
    )
}

export function validateSFPGValues(values: SFPG, presets: Preset[]): string[] {
    const result: string[] = [];

    if (!values.presetName)
        result.push('PresetName must be specified')
    if (values.midi < 0 || values.midi > 127)
        result.push('Midi number must be between 0 and 127')
    if (values.FMAmplitude < 0)
        result.push('FMAmplitude must be greater than zero');
    if (values.FMFrequency < 0)
        result.push('FMFrequency must be greater than zero');
    if (values.FMPhase < -360 || values.FMPhase > 360)
        result.push('FMPhase must be greater than -360 and less than 360');
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