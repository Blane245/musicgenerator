import factorial from "./factorial";

export default function poisson (k: number, lambda: number): number {
    const ePower: number = Math.pow(Math.E, k);
    const lambdaPower = Math.pow(lambda, k);
    const numerator: number = ePower *  lambdaPower;
    const denominator: number = factorial(k);
    return numerator / denominator;
}