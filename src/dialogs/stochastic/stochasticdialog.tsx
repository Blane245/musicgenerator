import Stochastic from "classes/generators/stochastic";
import { ChangeEvent, JSX } from "react";
import StochasticValues from "./stochasticvalues";

export interface StochasticDialogProps {
  formData: Stochastic;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  setMessages: Function;
}

export default function StochasticDialog(
  props: StochasticDialogProps
): JSX.Element {
  const { formData, handleChange, setMessages } = props;

  return (
    <>
      <div className="stochastic-preamble">
        <StochasticValues 
        formData={formData}
        handleChange={handleChange}
        setMessages={setMessages}/>
      </div>
    </>
  );
}
