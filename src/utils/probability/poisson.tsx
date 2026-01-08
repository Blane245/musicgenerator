import factorial from "../factorial";

export default function poisson (k: number, lambda: number): number {
    return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k);
}