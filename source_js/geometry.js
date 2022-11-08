/**
 * @module hypergraph
 */

import { Multiset } from './multiset';
import * as Tools from './tools';
import { b64_to_uint8, uint8_to_b64 } from './base64';


/** 
 * Represents labeled vertices.
 */
export class LabeledVertex {
    constructor() {
        /** @type {Map<string, number>} This stores labels as [key, value] pairs. */
        this.labels = new Map()
        /** @type {Map<string, Set<number>>} This stores layes as [group_name, index_list] pairs. */
        this.layers = new Map();
    }
}


/**
 * A callback function that performs a test on each vertex.
 * @callback callback_boolean
 * @param {LabeledVertex} v The vertex to test.
 * @param {number} [index] The index of the vertex in the vertex list.
 * @returns {boolean} The truth value.
 */


/**
 * Interface for hypergraphs that represent exact hitting games.
 * Any instance of this class is inteded as immutable, 
 * hence its structure must be determined at the time of its creation.
 */
export class Hypergraph {
    /** @param {...string} name_list The names of edge groups. */
    constructor(...name_list) {
        /** 
         * The sparse array of the form {index => vertex}.
         * @type {Map<number, LabeledVertex>}
         */
        this.vertices = new Map();
        /** 
         * The sparse tensor of the form {name => serial_no => vertex}.
         * @type {Map<string, Map<number, Map<LabeledVertex, number>>>}
         */
        this.edgeGroups = new Map(name_list.map((name) => [name, new Map()]));
        /**
         * The type information.
         * @type {object}
         */
        this.info = {
            type: 'hypergraph'
        };
    }

    /** 
     * Compute the transpose of the sparse tensor
     * v => name => index
     * in the form
     * name => index => v
     */
    computeHyperedges() {
        for (const [name, group] of this.edgeGroups.entries()) {
            for (const v of this.vertices.values()) {
                const v_layers = v.layers;
                for (const serial_no of v_layers.get(name)) {
                    if (group.has(serial_no)) {
                        group.get(serial_no).add(v);
                    }
                    else {
                        const new_edge = new Multiset();
                        new_edge.add(v);
                        group.set(serial_no, new_edge);
                    }
                }
            }
        }
    }

    /**
     * Create a subgraph consisting of all 
     * @param {number[] | callback_boolean} any_filter The test function.
     * @returns {Hypergraph} The subgraph consisting of all vertices passing the test.
     */
    filter(any_filter) {
        const g = new Hypergraph(...this.edgeGroups.keys());

        /** Inherit type information. */
        Object.assign(g.info, this.info);

        /** Filter vertices. */
        if (typeof any_filter == 'function') {
            for (const [index, v] of this.vertices.entries()) {
                if (any_filter(v, index)) {
                    g.vertices.set(index, v);
                }
            }
        }
        else if (any_filter instanceof Array) {
            for (const index of any_filter) {
                if (this.vertices.has(index)) {
                    g.vertices.set(index, this.vertices.get(index));
                }
            }
        }
        else {
            throw TypeError(`'${any_filter}' is not a valid type of filters.`);
        }

        /** Fill in vertices to hyperedges. */
        g.computeHyperedges();

        return g;
    }
}


/**
 * Represents vanilla sudoku of size parameter Dp
 */
export class GameSudokuVanilla extends Hypergraph {
    /** @param {number} Dp The dimensional parameter on which all the others depend. */
    constructor(Dp) {
        super('rc', 'rk', 'ck', 'bk');

        /** Change type information. */
        this.info.type = 'sudoku_vanilla';
        this.info.param = Dp;

        /** @type {number} The dimensional parameter on which all the others depend. */
        this.Dp = Dp;
        /** @type {number} The length of each side. */
        this.D1 = this.Dp ** 2;
        /** @type {number} The area of the botton. */
        this.D2 = this.D1 ** 2;
        /** @type {number} Tehe volume of the 3D lattice. */
        this.D3 = this.D1 ** 3;

        /** Compute vertices. */
        const base_Dp = new Tools.BaseN(this.Dp);
        const base_D1 = new Tools.BaseN(this.D1);
        for (const index of new Array(this.D3).keys()) {
            const v = new LabeledVertex();
            this.vertices.set(index, v);

            const [row, col, key] = base_D1.toDigits(index, 3);
            const digits = base_Dp.toDigits(index, 6);
            const box = base_Dp.fromDigits([digits[0], digits[2]]);
            const inn = base_Dp.fromDigits([digits[1], digits[3]]);
            v.labels
                .set('index', index)
                .set('row', row)
                .set('col', col)
                .set('key', key)
                .set('box', box)
                .set('inn', inn);
            v.layers
                .set('rc', new Set().add(base_D1.fromDigits([row, col])))
                .set('rk', new Set().add(base_D1.fromDigits([row, key])))
                .set('ck', new Set().add(base_D1.fromDigits([col, key])))
                .set('bk', new Set().add(base_D1.fromDigits([box, key])));
        }

        /** Compute hyperedge groups. */
        this.computeHyperedges();
    }


    /**
     * Import from a string.
     * @param {string} input An input string, either in simple/base64 format.
     * @param {string} [format] The format of the output.
     * @returns {Hypergraph} Returns the loaded sub-hypergraph.
     */
    import(input, format = 'base64') {
        /** Guess the format of the string. */
        if (input.length == this.D2) {
            format = 'simple';
        }
        else if (input.substring(0, 5) == 'data:') {
            format = 'base64';
        }

        /** Parse string */
        if (format == 'simple') {
            /** Build the list of indices to include. */
            const index_list = [];
            for (const [grid, c] of Array.from(input).entries()) {
                const index0 = grid * this.D1;
                if ('1' <= c && c <= '9') {
                    index_list.push(index0 + parseInt(c) - 1);
                }
                else {
                    for (const key of new Array(this.D1).keys()) {
                        index_list.push(index0 + key);
                    }
                }
            }
            /** Return the sub-hypergraph filtered by the list. */
            return this.filter(index_list);
        }
        else if (format == 'base64') {
            /** Build the list of indices to include. */
            const compressed = b64_to_uint8(input.substring(5));
            const index_list = [];
            for (const [pos, val] of compressed.entries()) {
                let index = pos * 8;
                for (let i = 0; i < 8; i++) {
                    if (index >= this.D3) {
                        break;
                    }
                    if ((val & (1 << i)) > 0) {
                        index_list.push(index);
                    }
                    index++;
                }
            }
            /** Return the sub-hypergraph filtered by the list. */
            return this.filter(index_list);
        }
        else {
            throw TypeError(`'${format}' is not a valid format.`);
        }
    }


    /**
     * Export the source as a formatted string.
     * @param {Hypergraph} source The source puzzle.
     * @param {string} format The format of the output.
     * @returns {string} The output string.
     */
    export(source, format = 'base64') {
        if (!(source instanceof Hypergraph)) {
            throw TypeError('The source is not a hypergraph!');

        }
        else if (!(source.info.type == this.info.type && source.info.param == this.info.param)) {
            throw TypeError('The source is not a subgraph of \'this\'.');
        }

        if (format == 'simple') {
            const result = new Array(this.D2).fill('.');
            for (const [grid, edge] of source.edgeGroups.get('rc').entries()) {
                if (edge.size == 1) {
                    result[grid] = String.fromCharCode(
                        ...Array.from(edge.keys()).map(v => 0x31 + v.labels.get('key'))
                    );
                }
            }
            return result.join('');
        }
        else if (format == 'base64') {
            /** Each 8 candidates are compressed to a single number and stored in this array. */
            const compressed = new Uint8Array(Math.ceil(this.D3 / 8));
            for (const pos of compressed.keys()) {
                /** @type {number} Current character. */
                let c = 0;
                for (let i = 0; i < 8; i++) {
                    if (source.vertices.has(pos * 8 + i)) {
                        c |= 1 << i;
                    }
                }
                compressed[pos] = c;
            }

            /** Return the base64 encoding of "compressed". */
            return `data:${uint8_to_b64(compressed)}`;
        }
        else if (format == 'candibox') {
            /** Compute the template. */
            const s1 = `*${new Array(this.Dp).fill(''.padEnd(this.Dp, ' ')).join('*')}*`;
            const s2 = new Array(this.Dp).fill(s1).join('');
            const s3 = Array.from(s2).map(c => (c == '*' ? ''.padEnd(s2.length, '*') : s2)).join('\n');
            const template = Array.from(s3);

            const slots = [];
            for (const [pos, c] of template.entries()) {
                if (c == ' ') {
                    slots.push(pos);
                }
            }

            /** Fill in the candidates. */
            const baseDp = new Tools.BaseN(this.Dp);
            for (const [index, v] of source.vertices.entries()) {
                const digits = baseDp.toDigits(index, 6);
                const idx = baseDp.fromDigits([digits[0], digits[1], digits[4], digits[2], digits[3], digits[5]]);
                template[slots[idx]] = String.fromCharCode(0x31 + v.labels.get('key'));
            }

            return template.join('');
        }
        else {
            throw TypeError(`'${format}' is not a valid format.`);
        }
    }
}