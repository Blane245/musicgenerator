// given a cumulative probability table, p, a spacing between the
// values, deltaX, and a random number, r, between 0 and 1, 

import { linearInterpolate } from "../interpolation";

// return the value of x with the cumulative probability r 
export default function probabilityLookup (p: number[], x: number[],r: number ): number {
    if (r <= p[0]) return 0;
    if (r > 1) return x[x.length];
    const index: number = p.findIndex((v)=> r <= v); 
    if (index <= 0) return 0;
    return linearInterpolate(r, p[index-1], p[index], x[index - 1], x[index]);
}