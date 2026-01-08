// provide a table of the cumulative continuous probabilities at
// with mean density at spacing of unit
// per Xenakis, Appendix I, p. 325
// d - the number of points to be placed on a line
// length - the length of the line
// v - the units of the line
export default function continuousProbability (d: number, length: number, v: number ): [number[], number[]] {
    // P(i) = e(-civ)c* deltaXi
    // deltaXi = (1 - e(-cv) / c)
    // so P(i) = e(-civ) * (1 - e(-cv)) 
    // for i={0,...}
    const P = 
    (i: number,c:number, v:number)=> 
    (Math.exp(-i * c * v) * (1 - Math.exp(-c * v)))

    // create the probability array stopping when the
    // cumulative probability reach 99%
    const c: number = d / length; // linear density
    const n: number = Math.round(length / v);
    const Pi: number[] = [];
    const Xi: number[] = [];
    let sum: number = 0;
    for (let i = 0; i <= n; i++) {
      const p = P(i, c, v);
      sum = (i == n)? 1.0: sum + p;
      Pi.push(sum);
      Xi.push(i * v);
    }
    return [Pi, Xi];
}