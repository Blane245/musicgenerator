// convert a generator to its audio samples and put sources 

import Chart from "classes/chart";
import Stochastic from "classes/generators/stochastic";
import RandomNumber from "classes/randomnumber";
import { VoiceHues } from "types";
import buildStochasticAudioChart from "./buildstochasticaudiochart";

export default function getSourcesFromStochastic (props:{
    generator: Stochastic,
    audioBuffer: Float32Array[],
    chart: Chart,
    voiceHues: VoiceHues,
}): string {
    const {generator, audioBuffer, chart, voiceHues} = props;

    const {values} = generator;

    // restart the composition dynamic random number generator 
    values.dynamicsRN = new RandomNumber(values.dynamicsSeed);

    // build the audio and chart items for this generator
    const error:string = buildStochasticAudioChart ({
        generator,
        voices: values.voices,
        audioBuffer: audioBuffer,
        chart,
        voiceHues,
    });
    return error;
    
} 