// given an array of values, and mean value, return the quadratic mean
export default function quadraticMean( x: number[], mean: number): number {
    let sumsq: number = 0;
    for (let i = 0; i < x.length; i++) {
        sumsq+=x[i]*x[i];
    }
    return Math.sqrt(sumsq/x.length) * mean;
}