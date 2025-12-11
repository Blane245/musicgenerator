import RandomNumber from "classes/randomnumber";
import Cloud from "./cloud";
import Percussion from "./percussion";

// represents a cloud of percussions
export default class PercussionCloud extends Cloud {
    override values: {
        duration: number;
        frequency: number;
    rn: RandomNumber;
    noiseSeed: string;
    noiseFrequency: number; // frequency of the modulation moise
    noiseAmplitude: number; // noise gain
    } = {
        duration: 0,
        frequency: 0,
        rn: new RandomNumber(''),
        noiseSeed: '',
        noiseAmplitude: 0,
        noiseFrequency: 0,
    };
    cloud: Percussion[] = [];
}

