/**
 * @module Tools A toolbox.
 */

/**
 * An iterator over an integer interval.
 * @param {integer} a bound 1
 * @param {integer} b bound 2
 * @todo Check if this is really useful?
 */
export const range = function* (a, b) {
    if (arguments.length == 0) {
        for (let i = 0; true; i++) {
            yield i;
        }
    }
    else if (arguments.length == 1) {
        for (let i = 0; i < a; i++) {
            yield i;
        }
    }
    else if (arguments.length == 2) {
        for (let i = a; i < b; i++) {
            yield i;
        }
    }
    else {
        throw new Error("Invalid number of arguments");
    }
};

/**
 * Encode a Uint8Array to a base64 string.
 * @returns {string} A base64 string.
 */
Uint8Array.prototype.toBase64 = function () {
    return btoa(String.fromCharCode(...this));
};

/**
 * Decode a base64 string to a Uint8Array
 * @returns {Uint8Array[]} A uint8 array.
 */
String.prototype.toUint8Array = function () {
    const arr = new Uint8Array(this.length);
    for (let i = 0; i < this.length; i++) {
        arr[i] = this.charCodeAt(i);
    }
    return arr;
};