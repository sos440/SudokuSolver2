import * as Tools from './tools.mjs';

/** Dimensional parameter on which all the other dimensional constants depend. */
export const Dp = 3;
/** Number of rows/columns/boxes. */
export const D1 = Dp ** 2;
/** Number of cells. */
export const D2 = D1 ** 2;
/** Number of vertices. */
export const D3 = D1 ** 3;


/**
 * Enumeration of possible states of a vertex.
 * @enum {number}
 * @readonly
 */
export const State = {
    /** A vertex is vacant, i.e., it does not contain a pencilmark. */
    VACANT: 0,
    /** A vertex is occupied, i.e., it contains a pencilmark. */
    OCCUPIED: 1
};


/**
 * A namespace for various constants
 * @namespace
 */
const Constants = (() => {
    /** An integer interval from 0 to D1. */
    const list_D1 = Array.from({ length: D1 }).map((_, x) => x);

    /** An integer interval from 0 to D2. */
    const list_D2 = Array.from({ length: D2 }).map((_, x) => x);

    /** An integer interval from 0 to D3. */
    const list_D3 = Array.from({ length: D3 }).map((_, x) => x);

    /** A conversion map (index) => Uint8Array([row, cell, key, box, cell]). */
    const idx_to_rckbc = list_D3.map((index) => {
        const key = index % D1;
        index = Math.trunc(index / D1);
        const col = index % D1;
        const row = Math.trunc(index / D1);
        const box = Math.trunc(row / Dp) * Dp + Math.trunc(col / Dp);
        const cell = (row % Dp) * Dp + (col % Dp);
        return new Uint8Array([row, cell, key, box, cell]);
    });

    /** A conversion map (box, cell) => (index) */
    const bc_to_idx = list_D1.map(box => list_D1.map(cell => {
        const row = Math.trunc(box / Dp) * Dp + Math.trunc(cell / Dp);
        const col = (box % Dp) * Dp + (cell % Dp);
        return (row * D1 + col);
    }));

    /** Export the namespace */
    return {
        indexToRCKBC: idx_to_rckbc,
        BCToIndex: bc_to_idx
    };
})();


/** Creates an instance of puzzle. */
export class Puzzle {
    constructor() {
        /** An array storing states as a 1D list. */
        this.buffer = new Uint8Array(D3);
    }
    /**
     * Return the state at position (row, col, key).
     * @param {integer} row The row.
     * @param {integer} col The column.
     * @param {integer} key The pencilmark.
     * @returns {State} state at position (r, c, k).
     */
    getStateAt(row, col, key) {
        return this.buffer[Puzzle.RCKToIndex(row, col, key)];
    }
    /**
     * Assign the state to position (row, col, key).
     * @param {number} row The row.
     * @param {number} col The column.
     * @param {number} key The pencilmark.
     * @param {State} state The state to be assigned.
     */
    setStateAt(row, col, key, state) {
        this.buffer[Puzzle.RCKToIndex(row, col, key)] = state;
    }
    /**
     * Create a copy of a puzzle.
     * @param {Puzzle} source The source puzzle.
     * @returns {Puzzle} A copy of the source.
     */
    static copy(source) {
        const target = new Puzzle();
        target.buffer.set(source.buffer);
        return target;
    }
    /**
     * Computes the index using position (row, col, key).
     * @param {number} row The row.
     * @param {number} col The column.
     * @param {number} key The pencilmark.
     * @returns {number} The computed index.
     */
    static RCKToIndex(row, col, key) {
        return row * D2 + col * D1 + key;
    }
    /**
     * Computes the index using position (box, cell, key).
     * @param {number} box Index of the box.
     * @param {number} cell Index of the cell.
     * @param {number} key The pencilmark.
     * @returns {number} The computed index.
     */
    static BCToIndex(box, cell, key) {
        return Constants.BCToIndex[box][cell] * D1 + key;
    }
    /**
     * Computes the position using index.
     * @param {number} index 
     * @returns {Uint8Array[]} Position of the form [row, cell, key, box, cell].
     */
    static indexToRCKBC(index) {
        return Constants.indexToRCKBC[index];
    }

    /**
     * Load a puzzle from a string.
     * @param {string} str An input string, either as simple/base64/JSON format.
     * @returns {Puzzle} A loaded puzzle
     * @todo Implement this shit.
     */
    static fromString(str) {
    }
}


/**
 * A namespace for strategies.
 * @namespace
 */
export const Strategies = {
    /**
     * Apply the naked single (full house) strategy.
     * @param {Puzzle} source The source puzzle.
     * @returns {Result} An object containing all the necessary information about the solution process and result.
     */
    nakedSingle: function (source) {

    }
};