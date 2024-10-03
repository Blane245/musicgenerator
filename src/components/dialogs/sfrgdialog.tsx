// provides the form fields and validators for the random generator
//TODO complete
import SFPeriodicGenerator from "../../classes/sfpg"
import SFRandomGenerator from "../../classes/sfrg";
import { MODULATOR } from "../../types/types";

// provides the form fields and validators for the sfperiodic generator
export type SFRGDialogDialogProps = {
    values: SFRandomGenerator;
    setValues: Function;
}
export default function SFRGDialog(props: SFRGDialogDialogProps): JSX.Element {
    const { values, setValues } = props;

    // we are in the middle of the generator dialog form
    return (
        <>
            <label htmlFor="FMType">FMType:</label>
            <select name="FMType"
                defaultValue={values.FMType}
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
                defaultValue={values.FMAmplitude}
            />
            <label htmlFor="FMFrequency">FMAmplitude:</label>
            <input name="FMFrequency"
                type='FMFrequency'
                defaultValue={values.FMFrequency}
            />
            <label htmlFor="FMPhase">FMPhase:</label>
            <input name="FMPhase"
                type='FMPhase'
                defaultValue={values.FMPhase}
            />
            <hr />

            <label htmlFor="VMType">VMType:</label>
            <select name="VMType"
                defaultValue={values.FMType}
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
                defaultValue={values.VMAmplitude}
            />
            <label htmlFor="VMFrequency">VMAmplitude:</label>
            <input name="VMFrequency"
                type='VMFrequency'
                defaultValue={values.VMFrequency}
            />
            <label htmlFor="VMPhase">VMPhase:</label>
            <input name="VMPhase"
                type='VMPhase'
                defaultValue={values.VMPhase}
            />
            <hr />
            <label htmlFor="PMType">PMType:</label>
            <select name="PMType"
                defaultValue={values.PMType}
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
                defaultValue={values.FMAmplitude}
            />
            <label htmlFor="PMFrequency">PMAmplitude:</label>
            <input name="PMFrequency"
                type='PMFrequency'
                defaultValue={values.PMFrequency}
            />
            <label htmlFor="PMPhase">PMPhase:</label>
            <input name="PMPhase"
                type='PMPhase'
                defaultValue={values.PMPhase}
            />
        </>
    )
}

export function getSFPeriodicValues(form: HTMLFormElement): [SFPeriodicGenerator, string[]] {
    const formValues: SFPeriodicGenerator = new SFPeriodicGenerator(0);
    formValues.preset = form.elements['preset'].value;
    formValues.midi = form.elements['midi'].value;
    formValues.FMType = form.elements['FMType'].value;
    formValues.FMAmplitude = form.elements['FMAmplitude'].value;
    formValues.FMFrequency = form.elements['FMFrequency'].value;
    formValues.FMPhase = form.elements['FMPhase'].value;
    formValues.VMType = form.elements['VMType'].value;
    formValues.VMCenter = form.elements['VMCenter'].value;
    formValues.VMFrequency = form.elements['VMFrequency'].value;
    formValues.VMAmplitude = form.elements['VMAmplitude'].value;
    formValues.VMPhase = form.elements['VMPhase'].value;
    formValues.PMType = form.elements['PMType'].value;
    formValues.PMCenter = form.elements['PMCenter'].value;
    formValues.PMFrequency = form.elements['PMFrequency'].value;
    formValues.PMAmplitude = form.elements['PMAmplitude'].value;
    formValues.PMPhase = form.elements['PMPhase'].value;
    
    const msgs = validate(formValues)

    return [formValues, msgs];
}
// validate the fields returning each error as a text entry in the array
function validate (values: SFPeriodicGenerator): string[] {
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