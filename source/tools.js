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
 * @param {number} length The length of the array to be created.
 * @param {callback_init<T>} callbackfn The callback function that creates elements.
 * @returns {T[]}
*/
export const init = (length, callbackfn) => {
    return new Array(length).fill().map((_, i) => callbackfn(i));
}


const base64_map = [
    ...String.fromCharCode(...new Array(26).fill().map((_, i) => 0x41 + i)),
    ...String.fromCharCode(...new Array(26).fill().map((_, i) => 0x61 + i)),
    ...String.fromCharCode(...new Array(10).fill().map((_, i) => 0x30 + i)),
    '+', '/'
];

/**
 * Perform base64 encoding to the given uint8 array.
 * @param {Uint8Array[]} arr The uint8 array to encode.
 * @returns {string} The base64 encoding. 
 */
/*
export const utf8_to_b64 = (arr) => {
    const num_quanta = Math.ceil(arr.length / 3);
    return (Array
        .from({ length: num_quanta })
        .map((_, p) => {
            const quantum = arr.subarray(3 * p, 3);
            const a0 = quantum[0];
            const a1 = quantum[1] ?? 0;
            const a2 = quantum[2] ?? 0;
            // Needs to handle the final quantum of encoding input
            return [
                a0 >> 2,
                ((a0 & 0x03) << 4) | (a1 >> 4),
                ((a1 & 0x0F) << 2) | (a2 >> 6),
                a2 & 0x3F
            ]
                .map(c => base64_map[c])
                .join('');
        })
        .join('')
    );
};
*/