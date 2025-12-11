// provide a table of the cumulative continuous probabilities at
// with mean density at spacing of unit
export default function continuousProbability (mean: number, unit: number ): number[] {

    // determine the size of the table with the probability at x is 
    // sufficiently close to zero
    let sum: number = mean;
    let p: number = 1;
    let n: number = 0;
    let x: number = 0;
    let partial: number = mean;
    const tolerance: number = 0.01;
    while (p > tolerance) {
        p = partial/sum;
        n++;
        x+=unit;
        partial = mean*Math.exp(-mean*x);
        sum+=partial;
    }

    // table size is n + 1
    // get cumulative probability
    const result: number[] = Array(n + 1);
    result[0] = mean / sum;
    for (let i = 1; i < result.length - 1; i++) {
        result[i] = result[i-1] + mean*Math.exp(-mean*i * unit) / sum;
    }
    result[n] = 1.0;
    return result;
} 