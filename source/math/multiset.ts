/**
 * @module multiset
 */

type Callback<V, R> = (element: V, multi?: number, cur_mset?: MSet<V>) => R;


/**
 * Represents multisets (with multiplicites taking integer values).
 */
export class MSet<V> extends Map<V, number> {
    constructor(e_iter?: IterableIterator<V> | MSet<V> | Set<V> | Array<V>) {
        super();
        if (e_iter instanceof MSet<V>) {
            for (const [e, multi] of e_iter) {
                this.set(e, multi);
            }
        }
        else if (e_iter) {
            for (const e of e_iter) {
                this.add(e);
            }
        }
    }

    /**
     * Counts the sum of multiplicites in the MSet.
     */
    get count(): number {
        return Array.from(this.values()).reduce((s, x) => s + x, 0);
    }

    /**
     * @returns {V} Returns the multiplicity of the element, or 0 if the element does not exist in MSet.
     */
    aget(key: V): number {
        return this.get(key) ?? 0;
    }

    /**
     * Sets the multiplicity (number of occurrences) of the element in the MSet.
     * This is inherited from Map class.
     * @method set
     */

    /**
     * Removes all the occurrences of the element from the MSet.
     * This is inherited from Map class.
     * @method delete
     */

    /**
     * Modifies the multiplicity of the element by the specified amount.
     */
    modify(e: V, multi_mod: number): MSet<V> {
        const multi = (this.get(e) ?? 0) + multi_mod;
        if (multi == 0) {
            this.delete(e);
        }
        else {
            this.set(e, multi);
        }
        return this;
    }

    /**
     * Adds an occurrence of the element to the MSet.
     */
    add(e: V): MSet<V> {
        return this.modify(e, 1);
    }

    /**
     * Removes an occurrence of the element from the MSet.
     */
    remove(e: V): MSet<V> {
        return this.modify(e, -1);
    }

    /**
     * Returns an iterator over the distinguished elements.
     */
    elements(): IterableIterator<V> {
        return this.keys();
    }

    /**
     * @returns {boolean} true if the test results in true for every distinguished element, or false if the test fails for some element.
     */
    every(callback: Callback<V, boolean>): boolean {
        for (const [e, multi] of this) {
            if (!callback(e, multi, this)) {
                return false;
            }
        }
        return true;
    }

    /**
     * @returns {boolean} true if the test results in true for some distinguished element, or false if the test fails for every element.
     */
    some(callback: Callback<V, boolean>): boolean {
        for (const [e, multi] of this) {
            if (callback(e, multi, this)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Creates a new MSet consiting of all elements passing the test.
     * @note This is alredy implemented in and inherited from the base class Map.
     */
    // filter(callback: Callback<V, boolean>): MSet<V> {
    //     const result = new MSet<V>();
    //     for (const [e, multi] of this) {
    //         if (callback(e, multi, this)) {
    //             result.set(e, multi);
    //         }
    //     }
    //     return result;
    // }

    static geqZero<V>(cur_mset: MSet<V>): boolean {
        for (const [_, multi] of cur_mset) {
            if (multi < 0) {
                return false;
            }
        }
        return true;
    }

    static geq<V>(mset_a: MSet<V>, mset_b: MSet<V>): boolean {
        for (const [e_a, multi_a] of mset_a) {
            if (multi_a < (mset_b.get(e_a) ?? 0)) {
                return false;
            }
        }
        for (const [e_b, multi_b] of mset_b) {
            if (multi_b > (mset_a.get(e_b) ?? 0)) {
                return false;
            }
        }
        return true;
    }

    static add<V>(...summands: MSet<V>[]): MSet<V> {
        const result = new MSet<V>();
        for (const cur_mset of summands) {
            for (const [e, multi] of cur_mset) {
                result.set(e, (result.get(e) ?? 0) + multi);
            }
        }
        /** Eliminiates zero-count elements. */
        for (const [e, multi] of result) {
            if (multi == 0) {
                result.delete(e);
            }
        }
        return result;
    }

    static subtract<V>(mset_a: MSet<V>, mset_b: MSet<V>): MSet<V> {
        const result = new MSet<V>();
        for (const [e, multi] of mset_a) {
            result.set(e, multi);
        }
        for (const [e, multi] of mset_b) {
            result.set(e, (result.get(e) ?? 0) - multi);
        }
        /** Eliminiate zero-count elements. */
        for (const [e, multi] of result) {
            if (multi == 0) {
                result.delete(e);
            }
        }
        return result;
    }

    /**
     * Picks an element of the set.
     * Almost exclusively used when the set has a unique distinghished element.
     * @returns {V} An element of the set, or the default element if the set is empty.
     */
    pick(def_value: V): V {
        for (const e of this.keys()) {
            return e;
        }
        return def_value;
    }
};