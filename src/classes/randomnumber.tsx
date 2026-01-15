// a seedable random number generator in javascript
// since there is not one within the specification
// comes from somewhere that I forgot

// a class version of this is used by different objects so that each can have 
// different random number sequence
export default class RandomNumber {
    #seed: number[] = [];
    constructor(seed: string) {
      let theSeed: string = seed;
      if (theSeed == "") {
        const now:string[] = new Date().toISOString().split("");
        // randomly shuffle the characters of now
        theSeed = now.sort(() => 0.5 - Math.random()).join("");
      }
      this.#seed = this.#cyrb128(theSeed);
      // do a little early sequence mixing
      for (let i = 0; i < 1000; i++) this.rand();
    }
  
    rand(): number {
      return this.#sfc32();
    }
  
    #cyrb128(str: string): number[] {
      let h1 = 1779033703,
        h2 = 3144134277,
        h3 = 1013904242,
        h4 = 2773480762;
      for (let i = 0; i < str.length; i++) {
        const k:number = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
      }
      h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
      h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
      h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
      h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
      h1 ^= h2 ^ h3 ^ h4;
      h2 ^= h1;
      h3 ^= h1;
      h4 ^= h1;
      return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
    }
  
    #sfc32(): number {
      let a: number = (this.#seed[0] |= 0);
      let b: number = (this.#seed[1] |= 0);
      let c: number = (this.#seed[2] |= 0);
      let d: number = (this.#seed[3] |= 0);
      const t: number = (((a + b) | 0) + d) | 0;
      d = (d + 1) | 0;
      a = b ^ (b >>> 9);
      b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11);
      c = (c + t) | 0;
      this.#seed[0] = a;
      this.#seed[1] = b;
      this.#seed[2] = c;
      this.#seed[3] = d;
      return (t >>> 0) / 4294967296;
    }
  }