import { RandomSFTransitons } from "types/types";
import SFRG from "../../classes/sfrg";
import { ChangeEvent } from "react";
import { bankPresettoName, toNote } from "../../utils/util";
import { useCMGContext } from "../../contexts/cmgcontext";
import { Preset } from "../../types/soundfonttypes";

// provides the form fields and validators for the sfperiodic generator
export type SFRGDialogDialogProps = {
    formData: SFRG,
    handleChange: (event: ChangeEvent<HTMLElement>) => void;
}
export default function SFRGDialog(props: SFRGDialogDialogProps): JSX.Element {
    const { formData, handleChange } = props;
    const { presets } = useCMGContext();

    const INPUTSIZE: number = 6;
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
            <br />
            <label htmlFor="midi">Midi Number:</label>
            <input name="midi"
                type='number'
                step='0.01'
                onChange={handleChange}
                value={formData.midi}
            />
            <span> {formData.midi > 0 ? toNote(formData.midi) : null}</span>
            <hr />
            <div className="transition-box" >
                <p className="transition-header">Midi Transtions</p>
                <label>same-&gt;same:<input size={INPUTSIZE} name="midiT.same.same" value={formData.midiT.same.same} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>same-&gt;up:<input size={INPUTSIZE} name="midiT.same.up" value={formData.midiT.same.up} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>same-&gt;down:<input size={INPUTSIZE} name="midiT.same.down" value={formData.midiT.same.down} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <br />
                <label>up-&gt;same:<input size={INPUTSIZE} name="midiT.up.same" value={formData.midiT.up.same} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>up-&gt;up:<input size={INPUTSIZE} name="midiT.up.up" value={formData.midiT.up.up} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>up-&gt;down:<input size={INPUTSIZE} name="midiT.up.down" value={formData.midiT.up.down} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <br />
                <label>down-&gt;same:<input size={INPUTSIZE} name="midiT.down.same" value={formData.midiT.down.same} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>down-&gt;up:<input size={INPUTSIZE} name="midiT.down.up" value={formData.midiT.down.up} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>down-&gt;down:<input size={INPUTSIZE} name="midiT.down.down" value={formData.midiT.down.down} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
            </div>
            <div className="transition-box" >
                <p className="transition-header">Speed Transtions</p>
                <br />
                <label>Starting Value:<input size={INPUTSIZE} name="speedT.currentValue" value={formData.speedT.currentValue} onChange={handleChange} type='number' min={40} max={200} step={10} /></label>
                <br />
                <label>same-&gt;same:<input size={INPUTSIZE} name="speedT.same.same" value={formData.speedT.same.same} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>same-&gt;up:<input size={INPUTSIZE} name="speedT.same.up" value={formData.speedT.same.up} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>same-&gt;down:<input size={INPUTSIZE} name="speedT.same.down" value={formData.speedT.same.down} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <br />
                <label>up-&gt;same:<input size={INPUTSIZE} name="speedT.up.same" value={formData.speedT.up.same} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>up-&gt;up:<input size={INPUTSIZE} name="speedT.up.up" value={formData.speedT.up.up} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>up-&gt;down:<input size={INPUTSIZE} name="speedT.up.down" value={formData.speedT.up.down} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <br />
                <label>down-&gt;same:<input size={INPUTSIZE} name="speedT.down.same" value={formData.speedT.down.same} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>down-&gt;up:<input size={INPUTSIZE} name="speedT.down.up" value={formData.speedT.down.up} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>down-&gt;down:<input size={INPUTSIZE} name="speedT.down.down" value={formData.speedT.down.down} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
            </div>
            <div className="transition-box" >
                <p className="transition-header">Volume Transtions</p>
                <br />
                <label>Starting Value:<input size={INPUTSIZE} name="volumeT.currentValue" value={formData.volumeT.currentValue} onChange={handleChange} type='number' min={0} max={100} step={10} /></label>
                <br />
                <label>same-&gt;same:<input size={INPUTSIZE} name="volumeT.same.same" value={formData.volumeT.same.same} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>same-&gt;up:<input size={INPUTSIZE} name="volumeT.same.up" value={formData.volumeT.same.up} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>same-&gt;down:<input size={INPUTSIZE} name="volumeT.same.down" value={formData.volumeT.same.down} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <br />
                <label>up-&gt;same:<input size={INPUTSIZE} name="volumeT.up.same" value={formData.volumeT.up.same} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>up-&gt;up:<input size={INPUTSIZE} name="volumeT.up.up" value={formData.volumeT.up.up} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>up-&gt;down:<input size={INPUTSIZE} name="volumeT.up.down" value={formData.volumeT.up.down} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <br />
                <label>down-&gt;same:<input size={INPUTSIZE} name="volumeT.down.same" value={formData.volumeT.down.same} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>down-&gt;up:<input size={INPUTSIZE} name="volumeT.down.up" value={formData.volumeT.down.up} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>down-&gt;down:<input size={INPUTSIZE} name="volumeT.down.down" value={formData.volumeT.down.down} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
            </div>
            <div className="transition-box" >
                <p className="transition-header">Pan Transtions</p>
                <br />
                <label>Starting Value:<input size={INPUTSIZE} name="panT.currentValue" value={formData.panT.currentValue} onChange={handleChange} type='number' min={-1.0} max={1.0} step={0.1} /></label>
                <br />
                <label>same-&gt;same:<input size={INPUTSIZE} name="panT.same.same" value={formData.panT.same.same} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>same-&gt;up:<input size={INPUTSIZE} name="panT.same.up" value={formData.panT.same.up} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>same-&gt;down:<input size={INPUTSIZE} name="panT.same.down" value={formData.panT.same.down} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <br />
                <label>up-&gt;same:<input size={INPUTSIZE} name="panT.up.same" value={formData.panT.up.same} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>up-&gt;up:<input size={INPUTSIZE} name="panT.up.up" value={formData.panT.up.up} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>up-&gt;down:<input size={INPUTSIZE} name="panT.up.down" value={formData.panT.up.down} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <br />
                <label>down-&gt;same:<input size={INPUTSIZE} name="panT.down.same" value={formData.panT.down.same} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>down-&gt;up:<input size={INPUTSIZE} name="panT.down.up" value={formData.panT.down.up} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
                <label>down-&gt;down:<input size={INPUTSIZE} name="panT.down.down" value={formData.panT.down.down} onChange={handleChange} type='number' min={0} max={1} step={0.01} /></label>
            </div>
        </>
    )
}

// validate the fields returning each error as a text entry in the array
const EPS: number = 1e-4;
export function validateSFRGValues(formData: SFRG, presets: Preset[]): string[] {
    const result: string[] = [];

    function validateCumulatives(name: string, transition: RandomSFTransitons): void {
        let cum: number = 0;
        cum = transition.same.same + transition.same.up + transition.same.down;
        if (cum > 1.0 + EPS || cum < 1.0 - EPS)
            result.push(`${name} transition same probabilities add up to ${cum} and should be 1`);
        cum = transition.up.same + transition.up.up + transition.up.down;
        if (cum > 1.0 + EPS || cum < 1.0 - EPS)
            result.push(`${name} transition up probabilities add up to ${cum} and should be 1`);
        cum = transition.down.same + transition.down.up + transition.down.down;
        if (cum > 1.0 + EPS || cum < 1.0 - EPS)
            result.push(`${name} transition down probabilities add up to ${cum} and should be 1`);
    }
    function validateProbabiltiesRange(name: string, transition: RandomSFTransitons): void {
        if (transition.same.same < 0 || transition.same.same > 1)
            result.push(`${name} same->same probabilty must be between 0 and 1 inclusive`);
        if (transition.same.up < 0 || transition.same.up > 1)
            result.push(`${name} same->up probabilty must be between 0 and 1 inclusive`);
        if (transition.same.down < 0 || transition.same.down > 1)
            result.push(`${name} same->same probabilty must be between 0 and 1 inclusive`);
        if (transition.up.same < 0 || transition.up.same > 1)
            result.push(`${name} up->same probabilty must be between 0 and 1 inclusive`);
        if (transition.up.up < 0 || transition.up.up > 1)
            result.push(`${name} up->up probabilty must be between 0 and 1 inclusive`);
        if (transition.up.down < 0 || transition.up.down > 1)
            result.push(`${name} up->same probabilty must be between 0 and 1 inclusive`);
        if (transition.down.same < 0 || transition.down.same > 1)
            result.push(`${name} down->same probabilty must be between 0 and 1 inclusive`);
        if (transition.down.up < 0 || transition.down.up > 1)
            result.push(`${name} down->up probabilty must be between 0 and 1 inclusive`);
        if (transition.down.down < 0 || transition.down.down > 1)
            result.push(`${name} down->same probabilty must be between 0 and 1 inclusive`);
    }
    if (!formData.presetName) 
        result.push('PresetName must be specified');
    if (formData.midi < 0 || formData.midi > 127)
        result.push('Midi number must be between 0 and 127');

    validateCumulatives('midi', formData.midiT);
    validateCumulatives('speed', formData.speedT);
    validateCumulatives('volume', formData.volumeT);
    validateCumulatives('pan', formData.panT);

    validateProbabiltiesRange('midi', formData.midiT);
    validateProbabiltiesRange('speed', formData.speedT);
    validateProbabiltiesRange('volume', formData.volumeT);
    validateProbabiltiesRange('pan', formData.panT);
    return result;
}
