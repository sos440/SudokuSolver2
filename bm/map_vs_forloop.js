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

const NUM_LOOPS = 10000000;
const arr = new Uint32Array(Array.from({ length: 32 }).map((_, i) => i ** 2));
const bm = new Benchmark();


/** 
 * Using for loops with tweaks 
 * This is fastest.
 */
bm.reset();
for (let i_loop = 0; i_loop < NUM_LOOPS; i_loop++) {
    let c = 0;
    for (let i = 0; i < arr.length; i++) {
        const ai = arr[i];
        for (let j = 0; j < arr.length; j++) {
            c += ai + arr[j];
        }
    }
}
console.log(`Code: Using for loops with treaks
....Time elapsed: ${bm.elapsedTime} ms
`);


/** 
 * Using while loops
 * Slightly slower
 */
bm.reset();
for (let i_loop = 0; i_loop < NUM_LOOPS; i_loop++) {
    let c = 0;
    let i = arr.length;
    while (i--) {
        const ai = arr[i];
        let j = arr.length;
        while (j--) {
            c += ai + arr[j];
        }
    }
}
console.log(`Code: Using while loops
....Time elapsed: ${bm.elapsedTime} ms
`);


/** 
 * Using for loops 
 * Fast enough
 */
bm.reset();
for (let i_loop = 0; i_loop < NUM_LOOPS; i_loop++) {
    let c = 0;
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length; j++) {
            c += arr[i] + arr[j];
        }
    }
}
console.log(`Code: Using for loops
....Time elapsed: ${bm.elapsedTime} ms
`);


/**
 * Using generators
 * About 3x slow
 * 
*/
/*
bm.reset();
for (let i_loop = 0; i_loop < NUM_LOOPS; i_loop++) {
    let c = 0;
    for (const ai of arr) {
        for (const aj of arr) {
            c += ai + aj;
        }
    }
}
console.log(`Code: Using generators
....Time elapsed: ${bm.elapsedTime} ms
`);
*/


/** 
 * Using Array.prototype.forEach
 * About 5.5x slow
 */
/*
bm.reset();
for (let i_loop = 0; i_loop < NUM_LOOPS; i_loop++) {
    let c = 0;
    arr.forEach(i => arr.forEach(j => { c += i + j; }));
}
console.log(`Code: Using Array.prototype.forEach
....Time elapsed: ${bm.elapsedTime} ms
`);
*/