// provides the tie to the form fields and validators for all generators

import { ChangeEvent } from "react";
import CMG from "../../classes/cmg";
import SFPG from "../../classes/sfpg";
import SFRG from "../../classes/sfrg";
import SFPGDialog from "./sfpgdialog";
import SFRGDialog from "./sfrgdialog";
import NoiseDialog from "./noisedialog";
import Noise from "../../classes/noise";
import { GENERATORTYPES } from "../../types/types";

export interface GeneratorTypeFormProps {
    formData: CMG | SFPG | SFRG,
    handleChange: (event:ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void,
}

export default function GeneratorTypeForm(props: GeneratorTypeFormProps): JSX.Element {

    const { formData,  handleChange} = props;
    return (
        <>
            {formData.type == GENERATORTYPES.SFPG ?
                <SFPGDialog
                    formData={formData as SFPG}
                    handleChange={handleChange}
                />
                : null}
            {formData.type == GENERATORTYPES.SFRG ?
                <SFRGDialog
                    formData={formData as SFRG}
                    handleChange={handleChange}
                />
                : null}
            {formData.type == GENERATORTYPES.Noise ?
                <NoiseDialog
                    formData={formData as Noise}
                    handleChange={handleChange}
                />
                : null}
        </>
    )
}