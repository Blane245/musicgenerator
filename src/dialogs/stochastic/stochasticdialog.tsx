import Stochastic from "classes/generators/stochastic";
import { ChangeEvent, JSX } from "react";
import StochasticValues from "./stochasticvalues";
import StochasticComposition from "./stochasticcomposition";

export interface StochasticDialogProps {
  formData: Stochastic;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  setMessages: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function StochasticDialog(
  props: StochasticDialogProps
): JSX.Element {
  const { formData, handleChange, setMessages } = props;

  return (
    <div>
      <StochasticValues
        formData={formData}
        handleChange={handleChange}
      />
      <StochasticComposition
        formData={formData}
        handleChange={handleChange}
        setMessages={setMessages}
      />
    </div>
  );
}
