// provides the tie to the form fields and validators for all generators

import { ChangeEvent } from "react";
import { GeneratorType, GENERATORTYPE } from "types";
import AlgorithmicDialog from "dialogs/algorithmic/algorithmicdialog";
import AudioFileDialog from "dialogs/audiofiledialog";
import Algorithmic from "classes/generators/algorithmic";
import AudioFile from "classes/generators/audiofile";
import StochasticDialog from "../stochastic/stochasticdialog";
import Stochastic from "classes/generators/stochastic";

export interface GeneratorTypeFormProps {
  formData: GeneratorType;
  setFormData: Function;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  setMessages: Function;
}

export default function GeneratorTypeForm(
  props: GeneratorTypeFormProps
): JSX.Element {
  const { formData, setFormData, handleChange, setMessages} = props;
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
      {formData.type == GENERATORTYPE.Stochastic ? (
        <StochasticDialog
          formData={formData as Stochastic}
          handleChange={handleChange}
          setMessages={setMessages}
        />
      ) : null}
    </>
  );
}
