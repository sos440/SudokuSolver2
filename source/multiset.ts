/**
 * @module multiset
 */


type Callback<K, V> = (element: K, multi?: number, cur_mset?: MSet<K>) => V;


/**
 * Represents multisets (with multiplicites taking integer values).
 */
export class MSet<K> extends Map<K, number> {
    constructor(e_iter?: IterableIterator<K> | MSet<K> | Set<K> | Array<K>) {
        super();
        if (e_iter instanceof MSet<K>){
            for (const [e, multi] of e_iter) {
                this.set(e, multi);
            }
        }
        else if (e_iter){
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
    modify(e: K, multi_mod: number): MSet<K> {
        const multi = (this.get(e) ?? 0) + multi_mod;
        if (multi == 0){
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
    add(e: K): MSet<K> {
        return this.modify(e, 1);
    }

    /**
     * Removes an occurrence of the element from the MSet.
     */
    remove(e: K): MSet<K> {
        return this.modify(e, -1);
    }

    /**
     * Returns an iterator over the distinguished elements.
     */
    elements(): IterableIterator<K> {
        return this.keys();
    }

    /**
     * @returns {boolean} true if the test results in true for every distinguished element, or false if the test fails for some element.
     */
    every(callback: Callback<K, boolean>): boolean {
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
    some(callback: Callback<K, boolean>): boolean {
        for (const [e, multi] of this) {
            if (callback(e, multi, this)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Creates a new MSet consiting of all elements passing the test.
     */
    filter(callback: Callback<K, boolean>): MSet<K> {
        const result = new MSet<K>();
        for (const [e, multi] of this) {
            if (callback(e, multi, this)) {
                result.set(e, multi);
            }
        }
        return result;
    }

    /**
     * @returns {boolean} true if every element in the MSet has non-negative multiplicity, or false if some element has negative multiplicity.
     */
    static geqZero<K>(cur_mset: MSet<K>): boolean {
        for (const [_, multi] of cur_mset) {
            if (multi < 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * @returns {boolean} true if the multiplicity in the first MSet is greater than or equal to that in the second MSet for every possible element, or false otherwise.
     */
    static geq<K>(mset_a: MSet<K>, mset_b: MSet<K>): boolean {
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

    /**
     * @returns {MSet<K>} Sum of all MSets in the argument.
     */
    static add<K>(...summands: MSet<K>[]): MSet<K> {
        const result = new MSet<K>();
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

    /**
     * @returns {MSet<K>} The first MSet minus the second MSet.
     */
    static subtract<K>(mset_a: MSet<K>, mset_b: MSet<K>): MSet<K> {
        const result = new MSet<K>();
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
     * @returns {K | undefined} An element of the set | undefined if the set is empty.
     */
    pick(): K | undefined {
        return Array.from(this.keys())[0];
    }
}