/**
 * A robust, easy-to-use, and fast way to implement sudoku addresses.
 */

/** @type {number} Dimensional parameter on which all the other dimensional constants depend. */
const Dp = 3;
/** @type {number} Number of rows/columns/boxes. */
const D1 = Dp ** 2;
/** @type {number} Number of sites. */
const D2 = D1 ** 2;
/** @type {number} Number of vertices. */
const D3 = D1 ** 3;

class PuzzleAddress {
    static addresses = Array.from({ length: D3 }).map((_, index) => {
        const o = {};
        o.key = index % D1;
        index = Math.trunc(index / D1);
        o.row = Math.trunc(index / D1);
        o.col = index % D1;
        o.box = Math.trunc(o.row / Dp) * Dp + Math.trunc(o.col / Dp);
        o.site = (o.row % Dp) * Dp + (o.col % Dp);
        o.grid = o.row * D1 + o.col;
        o.rk = o.row * D1 + o.key;
        o.ck = o.col * D1 + o.key;
        o.bk = o.box * D1 + o.key;
        return o;
    });
}