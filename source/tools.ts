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
     * Convert the digit sequence, interpreted as a base-n representation, to a number.
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
 * Iterate through multidimensional indices.
 * @generator
 * @param {number[]} dims The dimension of the multidimensional array.
 * @param {number[]} vals A value list to prepend.
 * @yields {number[]} A tuple of indices.
 */
export function* MDIterator(dims: number[], vals: number[] = []): Generator<number[], any, undefined> {
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
 * @param {callback_init<T>} callbackfn The callback function that creates elements.
 * @returns {T[]}
*/
export const init = <T>(length: number, callbackfn: (index: number) => T): T[] => {
    return new Array(length).fill(null).map((_, i) => callbackfn(i));
}