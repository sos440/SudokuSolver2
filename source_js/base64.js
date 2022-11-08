/**
 * @module base64
 */


const to_base64 = [
    ...String.fromCharCode(...new Array(26).fill().map((_, i) => 0x41 + i)),
    ...String.fromCharCode(...new Array(26).fill().map((_, i) => 0x61 + i)),
    ...String.fromCharCode(...new Array(10).fill().map((_, i) => 0x30 + i)),
    '+', '/'
];

const from_base64 = new Map(to_base64.map((c, i) => [c, i]));
from_base64.set('=', 0);

const base64_regex = /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/;

/**
 * Perform base64 encoding to the given uint8 array.
 * @param {Uint8Array[]} buffer The uint8 array to encode.
 * @returns {string} The base64 encoding. 
 */
const uint8_to_b64 = (buffer) => {
    if (!(buffer instanceof Uint8Array)) {
        throw TypeError('The input must be of the type Uint8Array[].');
    }

    const num_quanta = Math.ceil(buffer.length / 3);
    const result = new Array(4 * num_quanta);
    for (let p = 0; p < num_quanta; p++) {
        const quantum = buffer.subarray(3 * p, 3 * (p + 1));
        const a0 = quantum[0];
        const a1 = quantum[1] ?? 0;
        const a2 = quantum[2] ?? 0;
        result[4 * p] = to_base64[a0 >> 2];
        result[4 * p + 1] = to_base64[((a0 & 0x03) << 4) | (a1 >> 4)];
        result[4 * p + 2] = to_base64[((a1 & 0x0F) << 2) | (a2 >> 6)];
        result[4 * p + 3] = to_base64[a2 & 0x3F];
    }
    if (buffer.length % 3 == 1) {
        result[result.length - 1] = '=';
        result[result.length - 2] = '=';
    }
    if (buffer.length % 3 == 2) {
        result[result.length - 1] = '=';
    }
    return result.join('');
};


/**
 * Perform base64 decoding to the given string.
 * @param {string} input The string to decode.
 * @returns {Uint8Array[]} The decoded array.
 */
const b64_to_uint8 = (input) => {
    if (typeof input != 'string') {
        throw TypeError('The input is not a string.')
    }
    else if (!input.match(base64_regex)) {
        throw TypeError('The input does not match the base64 format.');
    }

    const num_quanta = Math.trunc(input.length / 4);
    const buffer = new Uint8Array(3 * num_quanta - (input.match(/={1,2}$/)?.at(0).length ?? 0));
    for (let p = 0; p < num_quanta; p++) {
        const quanta_chars = [...input.substring(p * 4, (p + 1) * 4)];
        const [b0, b1, b2, b3] = quanta_chars.map(c => from_base64.get(c));
        buffer[3 * p] = (b0 << 2) | (b1 >> 4);
        buffer[3 * p + 1] = ((b1 & 0x0F) << 4) | (b2 >> 2);
        buffer[3 * p + 2] = ((b2 & 0x03) << 6) | b3;
    }

    return buffer;
};

export { b64_to_uint8, uint8_to_b64 };