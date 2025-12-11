import { AlgorithmValues } from "classes/algorithms/algorithmvalues";
import { ALGORITHMTYPE, AttributeRange, DensityAttribute, ElementBuffer, Range, TIMBRE} from "types";
import Cloud from "./cloud";
import Sustained from "./sustained";
import randomIntervalProbabilty from "utils/probability/intervalprobability";
import intervalProbabilty from "utils/probability/intervalprobability";
import continuousProbability from "utils/probability/continuousprobability";
import probabilityLookup from "utils/probability/probabilitylookup";
import sustainedSample from "helpers/portamentosample";
import portamentoSample from "helpers/portamentosample";

// represents a cloud of sustained notes
export default class SustainedCloud extends Cloud {
    override values: {
        startTime: number; // seconds
        duration: DensityAttribute; // seconds
        pitchRange: Range; // midi number
        count: number // number of events in the cloud
    } = {
        startTime: 0,
        duration: {mean: 0, unit: 0, range: {lo: 0, hi: 0}},
        pitchRange: {lo: 0, hi: 0},
        count: 0,
    };
    cloud: Sustained[] = [];
    constructor(startTime: number) {
        super();
        this.type = TIMBRE.Sustained;
        this.values.startTime = startTime;
    }

    // construct eventCount events in the cloud
    build (durationDistribution: number[]): ElementBuffer[] {
        const result: ElementBuffer[] = [];
        for (let i = 0; i < this.values.count; i++) {
            const pitch: number = intervalProbabilty(this.values.pitchRange.hi - this.values.pitchRange.lo) + this.values.pitchRange.lo;
            const t1: number = probabilityLookup(durationDistribution, this.values.duration.unit, Math.random());
            const t2: number = probabilityLookup(durationDistribution, this.values.duration.unit, Math.random());
            const sample: number[] = portamentoSample(pitch, t1, t2);
            result.push ({time: this.values.startTime + Math.min(t1, t2), buffer: sample})
        }
        return result;
    }

    static validate(object: SustainedCloud): string[] {
        const e: string[] = [];
        if (object.values.startTime < 0) e.push('Sustained cloud start time must be nonnegative');
        if (object.values.duration.mean <=0) e.push ('Sustained cloud duration mean must be positive');
        if (object.values.duration.unit <=0) e.push ('Sustained cloud duration unit must be positive');
        if (object.values.duration.range.lo <=0 ||  object.values.duration.range.lo >= object.values.duration.range.hi) 
            e.push ('Sustained cloud duration range is not well defined (lo > 0 && hi > lo');
        if (object.values.pitchRange.lo <=0 ||  object.values.pitchRange.lo >= object.values.pitchRange.hi) 
            e.push ('Sustained cloud pitch range is not well defined (lo > 0 && hi > lo');
        if (object.values.count <= 0) e.push('Sustained cloud element count must be positive');
        return e;
    }

    setAttribute(name: string, value: string): boolean {
        switch (name) {
            case 'sustained.startime':
        }
    }


    
}

