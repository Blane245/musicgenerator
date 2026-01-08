// given the length of a line, return a random interval according

import RandomNumber from "classes/randomnumber";

// to contiuous probability second law (x, p 326)
export default function intervalProbabilty (length: number, rN:RandomNumber): number {
    return length * (1 - Math.sqrt(1 - rN.rand()));
} 