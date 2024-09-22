// provides the tie to the form fields and validators for all generators

import { SoundFont2 } from "soundfont2";
import CMG from "../../classes/cmg";
import SFPG from "../../classes/sfpg";
import SFRG from "../../classes/sfrg";
import SFPGDialog from "./sfpgdialog";
import { Preset } from "../../types/soundfonttypes";

export interface GeneratorTypeFormProps {
    formData: CMG | SFPG | SFRG,
    setFormData: Function,
    handleChange: Function,
    presets: Preset[],
}

export default function GeneratorTypeForm(props: GeneratorTypeFormProps): JSX.Element {

    const { formData, setFormData, handleChange, presets } = props;
    return (
        <>
        {formData.type == 'SFPG'?
        <SFPGDialog 
        formData={formData as SFPG}
        setFormData={setFormData}
        presets={presets}
        handleChange={handleChange}
        />
        : null}
        {/* <SFRGDialog
        formData={formData}
        setformData={setFormData}
        handleChange={handleChange}
            /> */}
        
        </>
    )
}