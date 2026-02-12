// provides the tie to the form fields and validators for all generators

import Algorithmic from "classes/generators/algorithmic";
import Stochastic from "classes/generators/stochastic";
import AlgorithmicDialog from "dialogs/algorithmic/algorithmicdialog";
import StochasticDialog from "dialogs/stochastic/stochasticdialog";
import { ChangeEvent } from "react";
import { GeneratorType, GENERATORTYPE } from "types";

export interface GeneratorTypeFormProps {
  formData: GeneratorType;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  setMessages: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function GeneratorTypeForm(
  props: GeneratorTypeFormProps
): JSX.Element {
  const { formData, handleChange, setMessages} = props;
  return (
    <>
      {!!(formData.type == GENERATORTYPE.Algorithmic) && (
        <AlgorithmicDialog
          formData={formData as Algorithmic}
          handleChange={handleChange}
        />
      )}
      {!!(formData.type == GENERATORTYPE.Stochastic) && (
        <StochasticDialog
          formData={formData as Stochastic}
          handleChange={handleChange}
          setMessages={setMessages}
        />
      )}
    </>
  );
}
