/**
 * @module Tools A toolbox.
 */

/**
 * An iterator over an integer interval.
 * @param {integer} a bound 1
 * @param {integer} b bound 2
 */
export const range = function* (a, b){
    if (arguments.length == 0){
        for (let i = 0; true; i++){
            yield i;
        }
    }
    else if (arguments.length == 1){
        for (let i = 0; i < a; i++){
            yield i;
        }
    }
    else if (arguments.length == 2){
        for (let i = a; i < b; i++){
            yield i;
        }
    }
    else {
        throw new Error("Invalid number of arguments");
    }
};

Uint8Array.prototype.toBase64 = function (){
    return btoa(String.fromCharCode(...this));
};

String.prototype.toUint8Array = function (){
    const arr = new Uint8Array(this.length);
    for (let i = 0; i < this.length; i++){
        arr[i] = this.charCodeAt(i);
    }
    return arr;
};