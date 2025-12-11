

// create a cloud of sound elements that follow stochastic principles.
// A cloud is defined to have to have a number of elements of a specific type
// and a specific duration
// Each element is assigned a start time 
// the end time is from the first law of continous probability except in the percussion and pizz cases
// where it a fixed duration ahead of t1.
// the pitch is determined by the second law of continuous probability
// in the case of glissando, a second pitch is drawn

import { Range, SAMPLERATE, TIMBRE } from "types";
import continuousProbability from "utils/probability/continuousprobability";
import intervalProbabilty from "utils/probability/intervalprobability";
import probabilityLookup from "utils/probability/probabilitylookup";
import elementSample from "./elementsample";

// each element sample is placed in a cloud sample
// count is the number of sound elements in the cloud
// timbre is TIMBRE
// pitchRange is the hi and lo value for of the pitches (midi number) 
// elementDuration is the mean (elements/sec) and unit (seconds) of the continuous probability function with a fixed interval (sec) for percussion and pixx timbres
// duration is the time duration of teh cloud (sec)
//TODO integrate this interface with the timbre cloud types
export function cloudSample (props:{count: number, timbre: TIMBRE, pitchRange: Range, elementDuration: {mean: number, unit: number, fixed: number}, duration: number}) : number[] {
    const {count, timbre, pitchRange, elementDuration, duration} = props;
    const sampleCount = Math.ceil(SAMPLERATE * duration);
    const sample: number[] = Array(sampleCount).fill(0);

    // create the probability table for durations
    const p:number[] = continuousProbability(elementDuration.mean, elementDuration.unit);

    // crete each element sample and place it in the cloud sample
    // for glissando, two pitches and two times are required
    // for sustained, one pitch and two times are required
    // for pizz and perc, one pitch and a fixed time interval is required
    for (let i = 0; i < count; i++) {
        const pitch1: number = intervalProbabilty(pitchRange.hi = pitchRange.lo) + pitchRange.lo;
        const pitch2 = (timbre == TIMBRE.Glissando)? probabilityLookup(p, duration, Math.random()): pitch1;
        const t1 = probabilityLookup(p, duration, Math.random());
        let t2: number = t1;
        switch (timbre) {
            case TIMBRE.Glissando:
            case TIMBRE.Sustained:
                t2 = probabilityLookup(p, duration, Math.random());
                break;
            case TIMBRE.Percussion:
            case TIMBRE.Pizzicato:
                t2 = t1 + elementDuration.fixed;
                break;
        }
        const eSample = elementSample({pitch1: pitch1, pitch2: pitch2, duration: Math.abs(t1 - t2)});
        const iStart = Math.floor(sampleCount * Math.min(t1, t2) / duration);
        const iEnd = Math.min(eSample.length + iStart, sampleCount);
        for (let j = 0; j < iEnd - iStart; j++) {
            sample[iStart + j] += eSample[j];
        }
    } 
    return sample;
}