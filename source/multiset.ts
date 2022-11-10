/**
 * @module multiset
 */

type Callback<V, R> = <T extends Map<V, number>>(element: V, multi?: number, cur_mset?: T) => R;


/**
 * Represents multisets (with multiplicites taking integer values).
 */
export interface MSet<V> extends Map<V, number> {
    /**
     * Counts the sum of multiplicites in the MSet.
     */
    get count(): number;

    /**
     * @returns {V} Returns the multiplicity of the element, or 0 if the element does not exist in MSet.
     */
    aget(key: V): number;

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
    modify(e: V, multi_mod: number): MSet<V>;

    /**
     * Adds an occurrence of the element to the MSet.
     */
    add(e: V): MSet<V>;

    /**
     * Removes an occurrence of the element from the MSet.
     */
    remove(e: V): MSet<V>;

    /**
     * Returns an iterator over the distinguished elements.
     */
    elements(): IterableIterator<V>;

    /**
     * @returns {boolean} true if the test results in true for every distinguished element, or false if the test fails for some element.
     */
    every(callback: Callback<V, boolean>): boolean;

    /**
     * @returns {boolean} true if the test results in true for some distinguished element, or false if the test fails for every element.
     */
    some(callback: Callback<V, boolean>): boolean;

    /**
     * Creates a new MSet consiting of all elements passing the test.
     */
    filter(callback: Callback<V, boolean>): MSet<V>;

    /**
     * Picks an element of the set.
     * Almost exclusively used when the set has a unique distinghished element.
     * @returns {V} An element of the set, or the default element if the set is empty.
     */
    pick(): V;
};


/**
 * @returns MSet class.
 */
export const createMSetClass = <V>(default_elem: V) => {
    return class __MSet extends Map<V, number> implements MSet<V> {
        constructor(e_iter?: IterableIterator<V> | __MSet | Set<V> | Array<V>) {
            super();
            if (e_iter instanceof __MSet) {
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

        get count(): number {
            return Array.from(this.values()).reduce((s, x) => s + x, 0);
        }

        aget(key: V): number {
            return this.get(key) ?? 0;
        }

        modify(e: V, multi_mod: number): __MSet {
            const multi = (this.get(e) ?? 0) + multi_mod;
            if (multi == 0) {
                this.delete(e);
            }
            else {
                this.set(e, multi);
            }
            return this;
        }

        add(e: V): __MSet {
            return this.modify(e, 1);
        }

        remove(e: V): __MSet {
            return this.modify(e, -1);
        }

        elements(): IterableIterator<V> {
            return this.keys();
        }

        every(callback: Callback<V, boolean>): boolean {
            for (const [e, multi] of this) {
                if (!callback(e, multi, this)) {
                    return false;
                }
            }
            return true;
        }

        some(callback: Callback<V, boolean>): boolean {
            for (const [e, multi] of this) {
                if (callback(e, multi, this)) {
                    return true;
                }
            }
            return false;
        }

        filter(callback: Callback<V, boolean>): __MSet {
            const result = new __MSet();
            for (const [e, multi] of this) {
                if (callback(e, multi, this)) {
                    result.set(e, multi);
                }
            }
            return result;
        }

        static geqZero(cur_mset: __MSet): boolean {
            for (const [_, multi] of cur_mset) {
                if (multi < 0) {
                    return false;
                }
            }
            return true;
        }

        static geq(mset_a: __MSet, mset_b: __MSet): boolean {
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

        static add(...summands: __MSet[]): __MSet {
            const result = new __MSet();
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

        static subtract(mset_a: __MSet, mset_b: __MSet): __MSet {
            const result = new __MSet();
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

        pick(): V {
            for (const e of this.keys()) {
                return e;
            }
            return default_elem;
        }
    };
};