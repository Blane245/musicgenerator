import RandomNumber from "classes/randomnumber";
let rn: RandomNumber | null;

export function generateRandomString(length:number): string {
    if (!rn) rn = new RandomNumber(Date.now.toString());
    let result:string = '';
    const characters:string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength:number = characters.length;
    for ( let i:number = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor((rn.rand() + 1) / 2 * charactersLength));
    }
    return result;
}

