import { SoundFont2 } from "soundfont2";
import SFPG from "../../classes/sfpg"
import { MODULATOR } from "../../types/types";
import { Preset } from "../../types/soundfonttypes";

// provides the form fields and validators for the sfperiodic generator
export interface SFPGDialogProps {
    formData: SFPG,
    setFormData: Function,
    presets: Preset[],
    handleChange: Function,
}
export default function SFPGDialog(props: SFPGDialogProps): JSX.Element {
    const { formData, setFormData, presets, handleChange } = props;

    // we are in the middle of the generator dialog form
    return (
        <>
            <label htmlFor="preset">Preset:</label>
            <select name="preset"
                onChange={handleChange}
                value={formData.preset ? formData.preset.header.name : ''}
            >
                {presets.map((p) => (
                    <option key={'preset-'.concat(p.header.name)}
                        value={p.header.name}>
                        {p.header.name}
                    </option>
                ))}
            </select>
            <label htmlFor="midi">Midi Number:</label>
            <input name="midi"
                type='number'
                onChange={handleChange}
                value={formData.midi}
            />
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
                onChange={handleChange}
                value={formData.FMAmplitude}
            />
            <label htmlFor="FMFrequency">FMAmplitude:</label>
            <input name="FMFrequency"
                type='FMFrequency'
                onChange={handleChange}
                value={formData.FMFrequency}
            />
            <label htmlFor="FMPhase">FMPhase:</label>
            <input name="FMPhase"
                type='FMPhase'
                onChange={handleChange}
                value={formData.FMPhase}
            />
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
            <label htmlFor="VMAmplitude">VMAmplitude:</label>
            <input name="VMAmplitude"
                type='number'
                onChange={handleChange}
                value={formData.VMAmplitude}
            />
            <label htmlFor="VMFrequency">VMFrequency:</label>
            <input name="VMFrequency"
                type='VMFrequency'
                onChange={handleChange}
                value={formData.VMFrequency}
            />
            <label htmlFor="VMPhase">VMPhase:</label>
            <input name="VMPhase"
                type='VMPhase'
                onChange={handleChange}
                value={formData.VMPhase}
            />
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
            <label htmlFor="PMAmplitude">PMAmplitude:</label>
            <input name="PMAmplitude"
                type='number'
                onChange={handleChange}
                value={formData.PMAmplitude}
            />
            <label htmlFor="PMFrequency">PMFrequency:</label>
            <input name="PMFrequency"
                type='PMFrequency'
                onChange={handleChange}
                value={formData.PMFrequency}
            />
            <label htmlFor="PMPhase">PMPhase:</label>
            <input name="PMPhase"
                type='PMPhase'
                onChange={handleChange}
                value={formData.PMPhase}
            />
        </>
    )
}

export function validateSFPGValues(values: SFPG): string[] {
    const result: string[] = [];

    if (values.midi < 0 || values.midi > 255)
        result.push('midi number must be between 0 and 255');
    if (values.FMAmplitude < 0)
        result.push('FMAmplitude must be greater than zero');
    if (values.FMFrequency < 0)
        result.push('FMAmplitude must be greater than zero');
    if (values.FMPhase < -360 || values.FMPhase > 360)
        result.push('FMPhase must be greater than -360 and less than 360');
    if (values.VMAmplitude < 0)
        result.push('VMAmplitude must be greater than zero');
    if (values.VMFrequency < 0)
        result.push('VMAmplitude must be greater than zero');
    if (values.VMPhase < -360 || values.VMPhase > 360)
        result.push('VMPhase must be greater than -360 and less than 360');
    if (values.PMAmplitude < 0)
        result.push('PMAmplitude must be greater than zero');
    if (values.PMFrequency < 0)
        result.push('PMAmplitude must be greater than zero');
    if (values.PMPhase < -360 || values.PMPhase > 360)
        result.push('PMPhase must be greater than -360 and less than 360');
    return result;

}