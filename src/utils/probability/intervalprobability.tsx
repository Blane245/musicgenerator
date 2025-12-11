// given the length of a line, return a random interval according
// to contiuous probability second law (x, p 326)
export default function intervalProbabilty (length: number): number {
    return length * (1 - Math.sqrt(1 - Math.random()));
} 