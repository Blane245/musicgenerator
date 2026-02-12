import CMGFile from "classes/cmgfile";
import Algorithmic from "classes/generators/algorithmic";
import Stochastic from "classes/generators/stochastic";
import { GENERATORTYPE, GeneratorType, ReportSourceData } from "types";
import getAlgorithmicSources from "./getalgorithmicsources";
import getStochasticSources from "./getstochasticsources";

interface GetSourceDataProps {
  fileContents: CMGFile;
  generator: GeneratorType | null;
}

// load the source data for a specific generator or all of the generators
// in the file
export default function getSourceData(
  props: GetSourceDataProps,
): ReportSourceData[] {
  const { fileContents, generator } = props;
  const generatorList: GeneratorType[] = [];

  // build the generator list at start up
  if (generator) generatorList.push(generator);
  else {
    for (let track of fileContents.tracks) {
      for (let g of track.generators) {
        generatorList.push(g);
      }
    }
  }

  // loop through each generator and get
  const result: ReportSourceData[] = [];
  for (let generator of generatorList) {
    if (generator.type == GENERATORTYPE.Algorithmic)
      result.push(...getAlgorithmicSources(generator as Algorithmic));
    else if (generator.type == GENERATORTYPE.Stochastic)
      result.push(...getStochasticSources(generator as Stochastic));
  }
  return result.sort((a,b)=> a.startTime - b.startTime);
}
