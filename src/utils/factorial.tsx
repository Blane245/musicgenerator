export default function factorial(x:number):number {
    if (x ==0) {return 1}
    return x * factorial(x - 1);
}