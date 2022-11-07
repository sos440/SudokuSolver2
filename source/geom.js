/**
 * @module hypergraph
 */

import { BaseN, MDIterator, init } from './tools';


/**
 * Represents multisets (with multiplicites taking integer values).
 */
export class Multiset extends Map {
    /** @param {any[]} element_list The array of elements */
    constructor(element_list) {
        super();
        if (element_list instanceof Array){
            for (const element of element_list) {
                this.add(element);
            }
        }
        else if (typeof element_list != 'undefined') {
            this.add(element_list);
        }
    }

    /**
     * Count the total count.
     * @returns {number} The total count.
     */
    get count() {
        return Array.from(this.values()).reduce((s, x) => s + x, 0);
    }

    /**
     * Add an element to the multiset.
     * @param {any} element The element to be added.
     * @returns {Multiset} The current multiset.
     */
    add(element) {
        this.set(element, (this.get(element) ?? 0) + 1);
        return this;
    }

    /**
     * Remove an element to the multiset.
     * @param {any} element The element to be removed.
     * @returns {Multiset} The current multiset.
     */
    remove(element) {
        this.set(element, (this.get(element) ?? 0) - 1);
        return this;
    }

    /**
     * A boolean callback function that iterates through the entries.
     * @callback iterateBoolean
     * @param {any} element The current element.
     * @param {number} count The current count.
     * @param {Multiset} this The current multiset.
     * @returns {boolean} The truth value.
     */

    /**
     * Check if the condition is satisfied by every distinguished elements.
     * @param {iterateBoolean} callbackfn The test function to evaluate through the elements.
     * @returns {boolean} True if the test function results in true for every element.
     */
    every(callbackfn) {
        for (const [element, count] of this.entries()) {
            if (!callbackfn(element, count, this)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if the condition is satisfied by some distinguished element.
     * @param {iterateBoolean} callbackfn The test function to evaluate through the elements.
     * @returns {boolean} True if the test function results in true for some element.
     */
    some(callbackfn) {
        for (const [element, count] of this.entries()) {
            if (callbackfn(element, count, this)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Filter all the elements satisfying the condition.
     * @param {iterateBoolean} callbackfn The test function to evaluate through the elements.
     * @returns {Multiset} The sub-multiset consisting of all element satisfying the test function.
     */
    filter(callbackfn) {
        const result = new Multiset();
        for (const [element, count] of this.entries()) {
            if (callbackfn(element, count, this)) {
                result.set(element, count);
            }
        }
        return result;
    }

    /**
     * Check if every count is non-negative.
     * @param {Multiset} cur_set The callback function to evaluate through the elements.
     * @returns {boolean} True if the callback is true for every element.
     */
    static geqZero(cur_set) {
        for (const [_, count] of cur_set.entries()) {
            if (count < 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if set_a(x) >= set_b(x) for all x.
     * @param {Multiset} set_a The multiset to compare.
     * @param {Multiset} set_b The multiset to compare.
     * @returns {boolean} True if set_a(x) >= set_b(x) for all x.
     */
    static geq(set_a, set_b) {
        for (const [element_a, count_a] of set_a.entries()) {
            if (count_a < (set_b.get(element_a) ?? 0)){
                return false;
            }
        }
        for (const [element_b, count_b] of set_b.entries()) {
            if (count_b > (set_a.get(element_b) ?? 0)){
                return false;
            }
        }
        return true;
    }

    /**
     * Add multisets.
     * @param {...Multiset} summands Multisets to be summed up.
     * @returns The sum.
     */
    static add(...summands) {
        const result = new Multiset();
        for (const cur_set of summands) {
            for (const [element, count] of cur_set.entries()) {
                result.set(element, (result.get(element) ?? 0) + count);
            }
        }
        /** Eliminiate zero-count elements. */
        for (const [element, count] of result.entries()) {
            if (count == 0){
                result.delete(element);
            }
        }
        return result;
    }

    /**
     * Subtract a multiset from another.
     * @param {Multiset} set_a The multiset to be subtracted from.
     * @param {Multiset} set_b The multiset to subtract.
     * @returns The difference.
     */
    static subtract(set_a, set_b) {
        const result = new Multiset();
        for (const [element, count] of set_a.entries()) {
            result.set(element, count);
        }
        for (const [element, count] of set_b.entries()) {
            result.set(element, (result.get(element) ?? 0) - count);
        }
        /** Eliminiate zero-count elements. */
        for (const [element, count] of result.entries()) {
            if (count == 0){
                result.delete(element);
            }
        }
        return result;
    }
}


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
         * @type {Map<string, Map<number, Multiset>>}
         */
        this.edgeGroups = new Map(name_list.map((name) => [name, new Map()]));
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

        /** @type {number} The dimensional parameter on which all the others depend. */
        this.Dp = Dp;
        /** @type {number} The length of each side. */
        this.D1 = this.Dp ** 2;
        /** @type {number} The area of the botton. */
        this.D2 = this.D1 ** 2;
        /** @type {number} Tehe volume of the 3D lattice. */
        this.D3 = this.D1 ** 3;

        /** Compute vertices. */
        const base_Dp = new BaseN(this.Dp);
        const base_D1 = new BaseN(this.D1);
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
}