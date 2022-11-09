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
    fromDigits(digits: number[]): number {
        return digits.reduce((p, a) => (p * this.base + a), 0);
    }

    /**
     * Convert the number to a base-n digit sequence.
     * @param {number} num The number.
     * @param {number} length The number of digits.
     * @returns {number[]} The sequence of digits in decreasing order of importance. 
     */
    toDigits(num: number, length: number): number[] {
        const arr: number[] = Array.from({ length: length });
        for (let i = length - 1; i > 0; i--) {
            arr[i] = num % this.base;
            num = Math.trunc(num / this.base);
        }
        arr[0] = num;
        return arr;
    }
}


/**
 * Represents an integer interval.
 */
export class IntegerRange<T> {
    a: number;
    b: number;

    constructor(a: number, b?: number) {
        if (typeof b == 'undefined') {
            this.a = 0;
            this.b = a;
        }
        else {
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
        for (let i = this.a; i < this.b; i++){
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


/**
 * Iterate through multidimensional indices.
 * @generator
 * @param {number[]} dims The dimension of the multidimensional array.
 * @param {number[]} vals A value list to prepend.
 * @yields {number[]} A tuple of indices.
 */
export function* MDIterator(dims: number[], vals: number[] = []): IterableIterator<number[]> {
    if (dims.length == 1) {
        for (let i = 0; i < dims[0]; i++) {
            yield [...vals, i];
        }
    }
    else {
        for (let i = 0; i < dims[0]; i++) {
            yield* MDIterator(dims.slice(1), [...vals, i]);
        }
    }
}


/**
 * @template T
 * @param {number} length The length of the array to be created.
 * @param {callback_init<T>} callback The callback function that creates elements.
 * @returns {T[]}
*/
export const init = <T>(length: number, callback: (index?: number) => T): T[] => {
    const arr: Array<T> = new Array(length);
    for (const i of arr.keys()){
        arr[i] = callback(i);
    }
    return arr;
}