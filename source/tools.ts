/**
 * @module tools
 */


/**
 * A representation of base-n representation.
 */
export class BaseN {
    base: number;

    /** @param {number} base The base. */
    constructor(base: number) {
        this.base = base;
    }

    
    /**
     * Converts the digit sequence, interpreted as a base-n representation, to a number.
     * @param {number[]} digits The sequence of digits in decreasing order of importance. 
     * @returns {number} The number.
     */
    static fromD (digits: number[], base: number): number {
        return digits.reduce((p, a) => (p * base + a), 0);
    }

    fromDigits(digits: number[]): number {
        return BaseN.fromD(digits, this.base);
    }

    /**
     * Convert the number to a base-n digit sequence.
     * @param {number} num The number.
     * @param {number} length The number of digits.
     * @returns {number[]} The sequence of digits in decreasing order of importance. 
     */
    static toD (num: number, length: number, base: number): number[] {
        const arr: number[] = Array.from({ length: length });
        for (let i = length - 1; i > 0; i--) {
            arr[i] = num % base;
            num = Math.trunc(num / base);
        }
        arr[0] = num;
        return arr;
    }

    toDigits(num: number, length: number): number[] {
        return BaseN.toD(num, length, this.base);
    }
}


/**
 * Represents an integer interval.
 * (Left-endpoint inclusive, right-endpoint exclusive.)
 */
export class Range {
    a: number;
    b: number;

    constructor(a: number, b?: number) {
        if (typeof b == 'undefined') {
            if (!Number.isInteger(a)) {
                throw TypeError(`The inputs must be integer.`);
            }
            this.a = 0;
            this.b = a;
        }
        else {
            if (!Number.isInteger(a) || !Number.isInteger(b)) {
                throw TypeError(`The inputs must be integer.`);
            }
            this.a = a;
            this.b = b;
        }
    }

    at(i: number) {
        return (this.a + i);
    }

    get length(): number {
        return (this.b - this.a);
    }

    set length(len: number) {
        this.b = this.a + len;
    }

    *keys() {
        const len = (this.b - this.a);
        for (let i = 0; i < len; i++) {
            yield i;
        }
    }

    *values() {
        for (let i = this.a; i < this.b; i++) {
            yield i;
        }
    }

    *[Symbol.iterator]() {
        for (let i = this.a; i < this.b; i++) {
            yield i;
        }
    }

    *entries() {
        const len = (this.b - this.a);
        for (let i = 0; i < len; i++) {
            yield [i, this.a + i];
        }
    }

    map<T>(f: (value: number, key?: number) => T): T[] {
        const len = (this.b - this.a);
        const arr = new Array(len);
        for (let i = 0; i < len; i++) {
            arr[i] = f(this.a + i, i);
        }
        return arr;
    }

    forEach<T>(f: (value: number, key?: number) => void): void {
        const len = (this.b - this.a);
        const arr = new Array(len);
        for (let i = 0; i < len; i++) {
            f(this.a + i, i);
        }
    }
}

export const range = (a: number, b?: number) => new Range(a, b);


/**
 * Iterate through multidimensional indices.
 * @generator
 * @param {number[]} dims The dimension of the multidimensional array.
 * @param {number[]} prev_res A value list to prepend.
 * @yields {number[]} A tuple of indices.
 */
function* MultirangeIterator(dims: (number | number[])[], prev_res: number[] = []): IterableIterator<number[]> {
    if (dims.length == 0){
        return [];
    }

    const i0 = (typeof dims[0] == 'number') ? 0 : dims[0][0];
    const i1 = (typeof dims[0] == 'number') ? dims[0] : dims[0][1];
    if (dims.length == 1) {
        for (let i = i0; i < i1; i++) {
            yield [...prev_res, i];
        }
    }
    else {
        for (let i = i0; i < i1; i++) {
            yield* MultirangeIterator(dims.slice(1), [...prev_res, i]);
        }
    }
}

export const multirange = (...dims: (number | number[])[]) => MultirangeIterator(dims);


function* MergedIterator(iters: Iterable<unknown>[], prev_res: Array<unknown> = []): IterableIterator<unknown[]> {
    if (iters.length == 0) {
        yield [];
        return;
    }
    else if (iters.length == 1) {
        for (const e of iters[0] as Iterable<unknown>) {
            yield [...prev_res, e];
        }
    }
    else {
        for (const e of iters[0] as Iterable<unknown>) {
            yield* mergiter(iters.slice(1), [...prev_res, e]);
        }
    }
}

export const mergiter = (...iters: Iterable<unknown>[]) => MergedIterator(iters);