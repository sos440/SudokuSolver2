class Benchmark {
    constructor() {
        this.t0 = new Date().getTime();
    }
    get elapsedTime() {
        return (new Date().getTime() - this.t0);
    }
    reset() {
        this.t0 = new Date().getTime();
    }
}

const NUM_LOOPS = 1000000;
const arr = new Uint32Array(Array.from({ length: 32 }).map((_, i) => i ** 2));
const bm = new Benchmark();


/** 
 * Using for loops with tweaks
 */
bm.reset();
for (let i_loop = 0; i_loop < NUM_LOOPS; i_loop++) {
    let c = 0;
    for (let i = 0; i < arr.length; i++) {
        c += arr[i] * 3;
    }
}
console.log(`Code: Using for loops with treaks
....Time elapsed: ${bm.elapsedTime} ms
`);

/** 
 * Using generator
 */
 bm.reset();
 for (let i_loop = 0; i_loop < NUM_LOOPS; i_loop++) {
     let c = 0;
     for (const v of arr) {
         c += v * 3;
     }
 }
 console.log(`Code: Using generators
 ....Time elapsed: ${bm.elapsedTime} ms
 `);


 /** 
  * Using map
  */
 const map = new Map(arr.entries());
 bm.reset();
 for (let i_loop = 0; i_loop < NUM_LOOPS; i_loop++) {
     let c = 0;
     for (const v of map.values()) {
         c += v * 3;
     }
 }
 console.log(`Code: Using map
 ....Time elapsed: ${bm.elapsedTime} ms
 `);