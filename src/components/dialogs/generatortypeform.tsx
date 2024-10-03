// provides the tie to the form fields and validators for all generators

import { ChangeEvent } from "react";
import CMG from "../../classes/cmg";
import SFPG from "../../classes/sfpg";
import SFRG from "../../classes/sfrg";
import SFPGDialog from "./sfpgdialog";

export interface GeneratorTypeFormProps {
    formData: CMG | SFPG | SFRG,
    handleChange: (event:ChangeEvent<HTMLElement>) => void,
}

export default function GeneratorTypeForm(props: GeneratorTypeFormProps): JSX.Element {

    const { formData,  handleChange} = props;
    return (
        <>
            {formData.type == 'SFPG' ?
                <SFPGDialog
                    formData={formData as SFPG}
                    handleChange={handleChange}
                />
                : null}
            {/* <SFRGDialog
        formData={formData}
        handleChange={handleChange}
            /> */}

        </>
    )
}