export function linearInterpolate (x: number, x0: number, x1: number, y0:number, y1: number): number {
    if (x1 == x0) return y0;
    return y0 + (x - x0) * (y1 - y0) / (x1 - x0);
}