import CMGFile from "classes/cmgfile";
import Algorithmic from "classes/generators/algorithmic";
import Stochastic from "classes/generators/stochastic";
import { GENERATORTYPE, GeneratorType, ReportSourceData } from "types";
import AlgorithmicReport from "./algorithmicreport";
import SourceReport from "./sourcereport";
import StochasticReport from "./stochasticreport";

export interface GeneratorReportProps {
  generator: GeneratorType;
  sourceData: ReportSourceData[]; 
}

export default function GeneratorReport(
  props: GeneratorReportProps,
): JSX.Element {
  const { generator, sourceData } = props;

  return (
    <>
      <h3>{`Generator: ${generator.name} (Type: ${generator.type} Start Time (sec): ${generator.startTime.toFixed(2)} Stop Time (sec): ${generator.stopTime.toFixed(2)})`}</h3>
      {!!(generator.type == GENERATORTYPE.Algorithmic) && (
        <AlgorithmicReport generator={generator as Algorithmic} />
      )}
      {!!(generator.type == GENERATORTYPE.Stochastic) && (
        <StochasticReport generator={generator as Stochastic} />
      )}
      <SourceReport generator={generator} sourceData={sourceData} />
    </>
  );
}
