/**
 * @module tools
 */


/**
 * A representation of base-n representation.
 */
export class BaseN {
    /** @param {number} base The base. */
    constructor(base) {
        this.base = base;
    }

    /**
     * Convert the digit sequence, interpreted as a base-n representation, to a number.
     * @param {number[]} digits The sequence of digits in decreasing order of importance. 
     * @returns {number} The number.
     */
    fromDigits(digits) {
        return digits.reduce((p, a) => (p * this.base + a), 0);
    }

    /**
     * Convert the number to a base-n digit sequence.
     * @param {number} num The number.
     * @param {number} length The number of digits.
     * @returns {number[]} The sequence of digits in decreasing order of importance. 
     */
    toDigits(num, length) {
        const arr = Array.from({ length: length });
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
export function* MDIterator(dims, vals = []) {
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
 * @callback callback_init
 * @param {number} index The index.
 * @returns {T} The initialized object.
 */


/**
 * @template T
 * @param {number} length The length of the array to be created.
 * @param {callback_init<T>} callbackfn The callback function that creates elements.
 * @returns {T[]}
*/
export const init = (length, callbackfn) => {
    return new Array(length).fill().map((_, i) => callbackfn(i));
}