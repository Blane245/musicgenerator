// provides the tie to the form fields and validators for all generators

import { Algorithmic, AudioFile } from "classes/generators";
import { ChangeEvent } from "react";
import { GeneratorType, GENERATORTYPE } from "types";
import AlgorithmicDialog from "./algorithmicdialog";
import AudioFileDialog from "./audiofiledialog";

export interface GeneratorTypeFormProps {
  formData: GeneratorType;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}

export default function GeneratorTypeForm(
  props: GeneratorTypeFormProps
): JSX.Element {
  const { formData, handleChange} = props;
  return (
    <>
      {formData.type == GENERATORTYPE.Algorithmic ? (
        <AlgorithmicDialog
          formData={formData as Algorithmic}
          handleChange={handleChange}
        />
      ) : null}
      {formData.type == GENERATORTYPE.AudioFile ? (
        <AudioFileDialog
          formData={formData as AudioFile}
          handleChange={handleChange}
        />
      ) : null}
    </>
  );
}
