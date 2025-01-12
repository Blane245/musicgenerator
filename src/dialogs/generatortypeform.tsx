// provides the tie to the form fields and validators for all generators

import { ChangeEvent } from "react";
import Noise from "../classes/noise";
import SFPG from "../classes/sfpg";
import SFRG from "../classes/sfrg";
import { CMGeneratorType, GENERATORTYPE } from "../types";
import NoiseDialog from "./noisedialog";
import SFPGDialog from "./sfpgdialog";
import SFRGDialog from "./sfrgdialog";
import AudioFile from "../classes/audiofile";
import AudioFileDialog from "./audiofiledialog";

export interface GeneratorTypeFormProps {
  formData: CMGeneratorType;
  handleChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}

export default function GeneratorTypeForm(
  props: GeneratorTypeFormProps
): JSX.Element {
  const { formData, handleChange } = props;
  return (
    <>
      {formData.type == GENERATORTYPE.SFPG ? (
        <SFPGDialog formData={formData as SFPG} handleChange={handleChange} />
      ) : null}
      {formData.type == GENERATORTYPE.SFRG ? (
        <SFRGDialog formData={formData as SFRG} handleChange={handleChange} />
      ) : null}
      {formData.type == GENERATORTYPE.Noise ? (
        <NoiseDialog formData={formData as Noise} handleChange={handleChange} />
      ) : null}
      {formData.type == GENERATORTYPE.AudioFile ? (
        <AudioFileDialog formData={formData as AudioFile} handleChange={handleChange} />
      ) : null}
    </>
  );
}
