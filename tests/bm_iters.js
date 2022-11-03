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
 * Using callback
 * About 1.6x slower.
 */
const loop_through = function (callback) {
    for (let i = 0; i < arr.length; i++) {
        const ai = arr[i];
        for (let j = 0; j < arr.length; j++) {
            callback(arr[i], arr[j], i, j);
        }
    }
}
bm.reset();
for (let i_loop = 0; i_loop < NUM_LOOPS; i_loop++) {
    let c = 0;
    loop_through((ai, aj) => { c += ai + aj; });
}
console.log(`Code: Using callback
 ....Time elapsed: ${bm.elapsedTime} ms
 `);


/** 
* Looping through index
* About 3x slow.
*/
const arrlen2 = arr.length ** 2;
bm.reset();
for (let i_loop = 0; i_loop < NUM_LOOPS; i_loop++) {
    let c = 0;
    for (let idx = 0; idx < arrlen2; idx++) {
        const i = Math.trunc(idx / arr.length);
        const j = idx % arr.length;
        c += arr[i] + arr[j];
    }
}
console.log(`Code: Looping through index
....Time elapsed: ${bm.elapsedTime} ms
`);


/** 
 * Using modified generators 
 * Super slow
 */
/*
const iter = {
    i: 0,
    j: 0,
    next: function () {
        this.j++;
        if (this.j >= arr.length) {
            this.i++;
            this.j = 0;
        }
        if (this.i >= arr.length) {
            return { done: true };
        }
        else {
            return { done: false, value: [this.i, this.j] };
        }
    },
    return: function () {
        this.i = 0;
        this.j = 0;
    }
};

bm.reset();
for (let i_loop = 0; i_loop < NUM_LOOPS; i_loop++) {
    iter.return();
    let c = 0;
    while (true) {
        const res = iter.next();
        if (res.done){
            break;
        }
        c += arr[res.value[0]] + arr[res.value[1]];
    }
}
console.log(`Code: Using for loops
....Time elapsed: ${bm.elapsedTime} ms
`);
*/


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