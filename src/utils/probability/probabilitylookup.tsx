// given a cumulative probability table, p, a spacing between the
// values, deltaX, and a random number, r, between 0 and 1, 

import { linearInterpolate } from "./interpolation";

// return the value of x
export default function probabilityLookup (p: number[], deltaX: number,r: number ): number {
    if (r <= p[0]) return 0;
    if (r > 1) return deltaX * (p.length - 1);
    const index: number = p.findIndex((v)=> r <= v); 
    if (index <= 0) return 0;
    return linearInterpolate(r, p[index-1], p[index], deltaX * (index - 1), deltaX * index)
    // return (deltaX * (index - 1) + deltaX * (r - p[index-1]) / (p[index] - p[index-1]))
}