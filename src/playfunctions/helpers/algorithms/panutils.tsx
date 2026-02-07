// bounce the next pan value off of the limits
/**
 * bounce off of values barriers. The sign of delta is reversed if the new value would be output of the low and high.
 * When reversal is performed, the low and high values constrain the result, which will never be outside low and high
 * @param last the last value for the variable
 * @param delta the change in the value
 * @param low the lowest allowed value
 * @param high the highest allowed value
 * @returns 
 */
export const bounce = (last: number, delta: number, low: number, high: number): number => {
    const test: number = last + delta;
    if (test > high || test < low) return Math.max(low, Math.min(high, last - delta));
    else return test;
};
export const pantoLeftRight = (pan: number): { left: number; right: number } => {
    return {
        left: (1 - pan) / 2,
        right: (1 + pan) / 2,
    };
};
