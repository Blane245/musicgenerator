// provides the tie to the form fields and validators for all generators

import { ChangeEvent } from "react";
import CMG from "../../classes/cmg";
import SFPG from "../../classes/sfpg";
import SFRG from "../../classes/sfrg";
import { Preset } from "../../types/soundfonttypes";
import SFPGDialog from "./sfpgdialog";

export interface GeneratorTypeFormProps {
    formData: CMG | SFPG | SFRG,
    handleChange: (event:ChangeEvent<HTMLElement>) => void,
    presets: Preset[],
}

export default function GeneratorTypeForm(props: GeneratorTypeFormProps): JSX.Element {

    const { formData,  handleChange, presets } = props;
    return (
        <>
            {formData.type == 'SFPG' ?
                <SFPGDialog
                    formData={formData as SFPG}
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