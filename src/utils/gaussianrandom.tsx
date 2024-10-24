import { rand } from "./seededrandom";

// Standard Normal variate using Box-Muller transform.
export function gaussianRandom(mean:number=0, stdev:number=1):number {
    const u:number = 1 - rand(); // Converting [0,1) to (0,1]
    const v:number = rand();
    const z:number = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
}